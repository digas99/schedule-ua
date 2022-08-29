let mySchedule, schedule, school_year, semester, subjectColors;
const defaultHours = [8,9,10,11,12,13,14,15,16,17,18,19], defaultDays = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

chrome.storage.sync.get([...STORAGE_KEYS, "expanded", "subject_colors", "selected"], result => {
    // if schedule data exists
    if (STORAGE_KEYS.every(key => Object.keys(result).includes(key))) {
        schedule = result["schedule"];
        school_year = result["school_year"];
        semester = result["semester"];
        subjectColors = result["subject_colors"];

        const title = document.getElementById("title");
        if (title) title.innerText += ` ${school_year} ${semester}`;
        
        const navbarBottom = document.getElementById("navbar-bottom");
        if (navbarBottom) {
            const [year1, year2] = school_year.split("/");
            [year1.slice(2)+"/"+year2.slice(2), semester].forEach(value => {
                const row = document.createElement("div");
                navbarBottom.appendChild(row);
                row.appendChild(document.createTextNode(value));
            });
        }

        // create schedule table
        mySchedule = new Schedule(document.querySelector("#main > div"), {
            "hours": defaultHours,
            "days": defaultDays,
            "schedule": schedule,
            "colors": subjectColors,
            "trimmed": !result["expanded"]
        });

        mySchedule.create();
        mySchedule.removeSaturday();

        document.querySelector("#main").style.removeProperty("display");

        if (!subjectColors)
            chrome.storage.sync.set({"subject_colors": mySchedule.subjectColors});

        if (!result["expanded"]) updateExpandButton("shrink");


        if (result["selected"]) {
            const selectors = document.querySelectorAll(".selectors div");
            if (selectors) {
                const elem = Array.from(selectors).filter(selector => selector.innerText == result["selected"])[0];
                if (elem) elem.click();
            }
        }
    }
});

window.addEventListener("click", e => {
    const target = e.target;

    if (target.closest("#download")) {
        const blob = new Blob([JSON.stringify({
            "schedule": mySchedule.schedule,
            "school_year": school_year,
            "semester": semester,
            "subject_colors": mySchedule.subjectColors
        }, null, 2)], {type: "application/json"});
        
        saveAs(blob, `schedua-schedule_${school_year}_${semester}.json`);
    }

    // trim schedule ui
    if (target.closest("#shrink")) {
        updateExpandButton("shrink");
        mySchedule.trim();
        const infoPanel = document.querySelector(".info-panel");
        if (infoPanel)
            infoPanel.style.height = infoPanel.getAttribute("default-height");
    }
    // expand schedule
    else if (target.closest("#expanded")) {
        updateExpandButton("expanded");
        mySchedule.expand();
        const infoPanel = document.querySelector(".info-panel");
        if (infoPanel)
            infoPanel.style.height = (mySchedule.table.offsetHeight-40)+"px";
    }

    // take picture of schedule
    if (target.closest("#picture")) {
        const area = mySchedule.table.parentElement;
        if (area) {
            // printscreen animation
            area.style.filter = "brightness(2)";
            setTimeout(() => area.style.removeProperty("filter"), 150);

            html2canvas(area).then(canvas => canvas.toBlob(blob => saveAs(blob, `schedua-schedule_${school_year}_${semester}.png`), "image/png"));
        }
    }

    // schedule selectors
    if (target.closest(".selectors")) {
        const scheduleWrapper = document.querySelector("#main > div");
        if (scheduleWrapper && !target.classList.contains("selector-active")) {
            document.querySelector(".selector-active")?.classList.replace("selector-active", "clickable");
            target.classList.replace("clickable", "selector-active");

            const selected = target.innerText; 
            switch(selected) {
                case "Week":
                    scheduleWrapper.firstChild?.remove();
                    scheduleWrapper.querySelector(".info-panel")?.remove();

                    mySchedule = new Schedule(scheduleWrapper, {
                        "hours": defaultHours,
                        "days": defaultDays,
                        "schedule": schedule,
                        "colors": mySchedule.subjectColors,
                        "trimmed": mySchedule.trimmed
                    });

                    mySchedule.create();
                    mySchedule.removeSaturday();

                    break;
                case "Today":
                case "Tomorrow":
                case "Yesterday":
                    let day = getDayFromIndex(new Date().getDay());
                    if (selected == "Tomorrow")
                        day = getWeekDay(day, 1);
                    else if (selected == "Yesterday")
                        day = getWeekDay(day, -1);

                    createDaySchedule(scheduleWrapper, day);

                    break;
            }

            chrome.storage.sync.set({"selected": selected});
        }
    }

    // table week day header
    if (target.closest("table th")) {
        // only enable action if there are several days
        if (target.closest("table tr").children.length > 3) {
            const weekday = target.closest("table th").innerText;
            const scheduleWrapper = document.querySelector("#main > div");
            if (weekday && Object.keys(DAYS_INDEX).includes(weekday) && scheduleWrapper) {
                document.querySelector(".selector-active")?.classList.replace("selector-active", "clickable");
                createDaySchedule(scheduleWrapper, weekday);
            }
        }
    }

    if (target.closest(".class")) {
        const targetSubject = target.closest(".class").innerText.split(" - ")[0];
        const days = Object.entries(schedule)
            .filter(([day, subjects]) => subjects.some(subject => subject["subject"]["abbrev"] == targetSubject))
            .map(entry => entry[0])
            .sort((a, b) => DAYS_INDEX[a] - DAYS_INDEX[b]);

        if (days) {
            document.querySelector(".selector-active")?.classList.replace("selector-active", "clickable");

            const scheduleWrapper = document.querySelector("#main > div");
            scheduleWrapper.firstChild?.remove();
            scheduleWrapper.querySelector(".info-panel")?.remove();
        
            // adjust schedule
            const newSchedule = JSON.parse(JSON.stringify(schedule)); // deep clone schedule
            Object.keys(DAYS_INDEX).forEach(day => {
                if (!days.includes(day))
                    delete newSchedule[day];
            });

            mySchedule = new Schedule(scheduleWrapper, {
                "hours": defaultHours,
                "days": days,
                "schedule": newSchedule,
                "colors": mySchedule.subjectColors,
                "trimmed": mySchedule.trimmed
            });
        
            mySchedule.create();
        }
    }
});

window.addEventListener("mouseover", e => {
    const target = e.target;
    
    if (target.closest(".class")) {
        const targetSubject = target.closest(".class").innerText.split(" - ")[0];
        Array.from(mySchedule.table.querySelectorAll(".class")).forEach(subject => {
            if (subject.getAttribute("subject") !== targetSubject)
                subject.classList.add("shadowed-class");
        });
    }

    if (target.closest("table th")) {
        // only enable action if there are several days
        const targetElem = target.closest("table th");
        const weekday = targetElem.innerText;
        if (Object.keys(DAYS_INDEX).includes(weekday)) {
            if (target.closest("table tr").children.length > 3)
                Array.from(mySchedule.table.querySelectorAll(".class")).forEach(subject => {
                    if (subject.getAttribute("day") !== weekday)
                        subject.classList.add("shadowed-class");
                });
            else {
                targetElem.setAttribute("day", weekday);
                targetElem.innerText = "Week";
            }
        }
    }
});

window.addEventListener("mouseout", e => {
    const target = e.target;
    
    if (target.closest(".class")) {
        const targetSubject = target.closest(".class").innerText.split(" - ")[0];
        Array.from(mySchedule.table.querySelectorAll(".class")).forEach(subject => {
            if (subject.getAttribute("subject") !== targetSubject)
                subject.classList.remove("shadowed-class");
        });
    }

    if (target.closest("table th")) {
        // only enable action if there are several days
        const targetElem = target.closest("table th");
        const weekday = targetElem.innerText;
        if (target.closest("table tr").children.length > 3)
            Array.from(mySchedule.table.querySelectorAll(".class")).forEach(subject => {
                if (subject.getAttribute("day") !== weekday)  
                    subject.classList.remove("shadowed-class");
            });
        else {
            if (targetElem.getAttribute("day"))
                targetElem.innerText = targetElem.getAttribute("day");
        }
    }
});

const createDaySchedule = (scheduleWrapper, scheduleDay) => {
    scheduleWrapper.firstChild?.remove();
    scheduleWrapper.querySelector(".info-panel")?.remove();

    mySchedule = new Schedule(scheduleWrapper, {
        "hours": defaultHours,
        "days": [scheduleDay],
        "schedule": {[scheduleDay]: schedule[scheduleDay]},
        "colors": mySchedule.subjectColors,
        "trimmed": mySchedule.trimmed
    });

    mySchedule.create();

    scheduleWrapper.appendChild(infoPanel(mySchedule.schedule));

    // add arrows
    const [leftArrowWrapper, dayHeader, rightArrowWrapper] = mySchedule.table.querySelectorAll("th");
    leftArrowWrapper.classList.add("clickable");
    leftArrowWrapper.innerText = "<";
    leftArrowWrapper.addEventListener("click", () => {
        document.querySelector(".selector-active")?.classList.replace("selector-active", "clickable");
        createDaySchedule(scheduleWrapper, getWeekDay(scheduleDay, -1));
    });
     
    rightArrowWrapper.classList.add("clickable");
    rightArrowWrapper.innerText = ">";
    rightArrowWrapper.addEventListener("click", () => {
        document.querySelector(".selector-active")?.classList.replace("selector-active", "clickable");
        createDaySchedule(scheduleWrapper, getWeekDay(scheduleDay, 1));
    });

    // make day header go back to Week
    mySchedule.table.querySelector("th:nth-of-type(2)").addEventListener("click", () => document.querySelector(".selectors > div").click());
}

const updateExpandButton = state => {
    const button = document.getElementById(state);
    if (state == "shrink") {
        button.id = "expanded";
        button.title = "Expand Schedule";
        const image = button.querySelector("img");
        image.src = "images/icons/expand.png";
        chrome.storage.sync.set({"expanded":false});
    }
    // expand schedule
    else {
        button.id = "shrink";
        button.title = "Trim Schedule";
        const image = button.querySelector("img");
        image.src = "images/icons/shrink.png";
        chrome.storage.sync.set({"expanded":true});
    }
}

const infoPanel = schedule => {
    const wrapper = document.createElement("div");
    wrapper.classList.add("info-panel");
    wrapper.setAttribute("default-height", wrapper.style.height);

    const title = document.createElement("h2");
    wrapper.appendChild(title);
    title.appendChild(document.createTextNode("Your classes"));
    
    // general data
    const genDataWrapper = document.createElement("div");
    wrapper.appendChild(genDataWrapper);

    const subjectsWrapper = document.createElement("div");
    wrapper.appendChild(subjectsWrapper);
    const subjects = Object.values(schedule).flat(1);
    let pract = 0, theor = 0, hoursTotal = 0;
    if (subjects) {
        subjects.forEach(subject => {
            if (subject) {
                const subjectWrapper = document.createElement("div");
                subjectsWrapper.appendChild(subjectWrapper);
                subjectWrapper.classList.add("subject-info");
                const classTitle = document.createElement("div");
                subjectWrapper.appendChild(classTitle);
                classTitle.appendChild(document.createTextNode(`${subject["subject"]["abbrev"]} - ${subject["subject"]["name"]}`));
                classTitle.style.backgroundColor = mySchedule.subjectColors[subject["subject"]["abbrev"]];
                const infoWrapper = document.createElement("div");
                subjectWrapper.appendChild(infoWrapper);
                const classNumberWrapper = document.createElement("div");
                infoWrapper.appendChild(classNumberWrapper);
                const classNumber = document.createElement("div");
                classNumberWrapper.appendChild(classNumber);
                classNumber.appendChild(document.createTextNode(subject["class"]));
                const info = document.createElement("div");
                infoWrapper.appendChild(info);
                ["duration", "room", "capacity"].forEach(type => {
                    const rowWrapper = document.createElement("div");
                    info.appendChild(rowWrapper);
                    const rowTitle = document.createElement("b");
                    rowWrapper.appendChild(rowTitle);
                    rowTitle.appendChild(document.createTextNode(type.charAt(0).toUpperCase()+type.slice(1)));
                    const rowContent = document.createElement("div");
                    rowWrapper.appendChild(rowContent);
                    rowContent.appendChild(document.createTextNode(subject[type]));
                });
    
                if (subject["class"].charAt(0) == "P") pract++;
                else theor++;
    
                hoursTotal += parseFloat(subject["duration"].replace(",", "."));
            }
        });
    }

    const data = [pract+theor, pract, theor, hoursTotal+"h"];
    ["Classes", "Pract.", "Theor.", "Hours Total"].forEach((title, i) => {
        const wrapper = document.createElement("div");
        genDataWrapper.appendChild(wrapper);
        const titleElem = document.createElement("b");
        wrapper.appendChild(titleElem);
        titleElem.appendChild(document.createTextNode(title));
        wrapper.appendChild(document.createTextNode(` ${data[i]}`));
    });

    return wrapper;
}