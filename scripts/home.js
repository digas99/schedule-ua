let mySchedule, schedule, school_year, semester, subjectColors, highlightNow;
const defaultHours = [8,9,10,11,12,13,14,15,16,17,18,19,20], defaultDays = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

chrome.storage.sync.get([...STORAGE_KEYS, "trimmed", "subject_colors", "selected", "highlight_now", "limit_trimming", "subjects"], result => {
    // if schedule data exists
    if (STORAGE_KEYS.every(key => Object.keys(result).includes(key))) {
        schedule = result["schedule"];
        school_year = result["school_year"];
        semester = result["semester"];
        subjectColors = result["subject_colors"];
        highlightNow = result["highlight_now"];

        const title = document.getElementById("title");
        if (title) title.innerText += ` ${school_year} ${semester}`;

        let allHours;
        if (result["limit_trimming"] !== false)
            allHours = Object.values(schedule).map(subjects => subjects.map(subject => [parseFloat(subject["start"]), parseFloat(subject["start"])+parseFloat(subject["duration"])])).flat(2);

        // create schedule table
        mySchedule = new Schedule(document.querySelector("#main > div"), {
            "hours": defaultHours,
            "days": defaultDays,
            "schedule": schedule,
            "colors": subjectColors,
            "trimmed": result["trimmed"],
            "limitTrimming": result["limit_trimming"] !== false,
            "soonest": allHours ? Math.min.apply(Math, allHours) : null,
            "latest": allHours ? Math.max.apply(Math, allHours)-1 : null
        });

        // check if the subjects have changed
        if (mySchedule.subjectColors && mySchedule.subjects) {
            const subjectsFromColors = Object.keys(mySchedule.subjectColors).sort((a, b) => a.localeCompare(b));
            const subjects = mySchedule.subjects.sort((a, b) => a.localeCompare(b));
            for (let i = 0; i < subjectsFromColors.length; ++i) {
                if (subjectsFromColors[i] !== subjects[i]) {
                    mySchedule.setColors();
                    chrome.storage.sync.set({"subject_colors": mySchedule.subjectColors});
                    break;
                }
            }
        }

        if (mySchedule.subjects)
            chrome.storage.sync.set({"subjects": mySchedule.subjects});

        mySchedule.create();
        mySchedule.removeSaturday();
        mySchedule.setupOverlappedSubjects();

        if (!subjectColors)
            chrome.storage.sync.set({"subject_colors": mySchedule.subjectColors});

        highlightNowCell();

        document.querySelector("#main").style.removeProperty("display");

        if (result["trimmed"])
            updateExpandButton("shrink");

        if (result["selected"]) {
            const selectors = document.querySelectorAll(".day-selector div");
            if (selectors) {
                const elem = Array.from(selectors).filter(selector => selector.innerText == result["selected"])[0];
                if (elem) elem.click();
            }
        }
    }
    else
        window.location.href = "/login.html";
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
    if (target.closest(".day-selector")) {
        const scheduleWrapper = document.querySelector("#main > div");
        if (scheduleWrapper && !target.classList.contains("selector-active")) {
            document.querySelector(".selector-active")?.classList.replace("selector-active", "clickable");
            target.classList.replace("clickable", "selector-active");
            
            let letter = "N";
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
                        "trimmed": mySchedule.trimmed,
                        "limitTrimming": mySchedule.limitTrimming,
                        "soonest": mySchedule.soonest,
                        "latest": mySchedule.latest
                    });

                    mySchedule.create();
                    mySchedule.removeSaturday();
                    mySchedule.setupOverlappedSubjects();

                    highlightNowCell();

                    letter = "W";

                    break;
                case "Today":
                case "Tomorrow":
                case "Yesterday":
                    let day = getDayFromIndex(new Date().getDay(), DAYS_INDEX);
                    if (selected == "Tomorrow") {
                        day = getWeekDay(day, 1);
                        letter = "T";
                    }
                    else if (selected == "Yesterday") {
                        day = getWeekDay(day, -1);
                        letter = "Y";
                    }

                    createDaySchedule(scheduleWrapper, day);

                    break;
            }

            const infoCircle = document.querySelector("#schedule .info-circle");
            document.querySelector("#schedule .info-circle").style.removeProperty("display");
            if (infoCircle) infoCircle.firstChild.innerText = letter;

            chrome.storage.sync.set({"selected": selected});
        }
    }

    // table week day header
    if (target.closest("table th")) {
        // only enable action if there are several days
        if (target.closest("table tr").children.length > 3) {
            const weekday = target.closest("table th").innerText.replaceAll(/[<>]/g, "").replaceAll("\n", "");
            const scheduleWrapper = document.querySelector("#main > div");
            if (weekday && Object.keys(DAYS_INDEX).includes(weekday) && scheduleWrapper) {
                document.querySelector(".selector-active")?.classList.replace("selector-active", "clickable");
                document.querySelector("#schedule .info-circle").style.display = "none";
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
            document.querySelector("#schedule .info-circle").style.display = "none";

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
                "trimmed": mySchedule.trimmed,
                "limitTrimming": mySchedule.limitTrimming,
                "soonest": mySchedule.soonest,
                "latest": mySchedule.latest
            });
        
            mySchedule.create();
            mySchedule.setupOverlappedSubjects();
            
            highlightNowCell();
        }
    }
});

window.addEventListener("mouseover", e => {
    const target = e.target;
    
    if (target.closest(".class")) {
        const subject = target.closest(".class");
        subject.style.zIndex = "3";
        const targetSubject = subject.innerText.split(" - ")[0];
        Array.from(mySchedule.table.querySelectorAll(".class")).forEach(subject => {
            if (subject.getAttribute("subject") !== targetSubject)
                subject.classList.add("shadowed-class");
        });

        // info popup
        const subjectInfo = mySchedule.schedule[subject.getAttribute("day")].filter(subj => subj["subject"]["abbrev"] === subject.getAttribute("subject") && subj["class"] === subject.getAttribute("class-group"))[0];
        const start = parseFloat(subjectInfo["start"].replace(",", "."));
        const duration = parseFloat(subjectInfo["duration"].replace(",", "."));
        const end = start+duration;
        const popup = classInfoPopup(subjectInfo["subject"]["name"], start, end, mySchedule.subjectColors ? mySchedule.subjectColors[targetSubject] : null);
        popup.style.top = (subject.offsetHeight - 5)+"px";
        subject.appendChild(popup);
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

    if (target.closest("#schedule")) {
        const daySelector = document.querySelector(".day-selector");
        if (daySelector) {
            daySelector.style.removeProperty("display");
        }
    }

    if (!target.closest("#navbar")) {
        const daySelector = document.querySelector(".day-selector");
        if (daySelector) {
            daySelector.style.display = "none";
        }
    }
});

window.addEventListener("mouseout", e => {
    const target = e.target;
    
    if (target.closest(".class")) {
        const subject = target.closest(".class");
        subject.style.removeProperty("z-index");
        const targetSubject = subject.innerText.split(" - ")[0];
        Array.from(mySchedule.table.querySelectorAll(".class")).forEach(subject => {
            if (subject.getAttribute("subject") !== targetSubject)
                subject.classList.remove("shadowed-class");
        });

        subject.querySelector(".class-info-popup").remove();
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
        "trimmed": mySchedule.trimmed,
        "limitTrimming": mySchedule.limitTrimming,
        "soonest": mySchedule.soonest,
        "latest": mySchedule.latest
    });

    mySchedule.create();
   
    highlightNowCell();

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
    mySchedule.table.querySelector("th:nth-of-type(2)").addEventListener("click", () => document.querySelector(".day-selector > div").click());
}

const updateExpandButton = state => {
    const button = document.getElementById(state);
    if (state == "shrink") {
        button.id = "expanded";
        button.title = "Expand Schedule";
        const image = button.querySelector("img");
        image.src = "images/icons/expand.png";
        chrome.storage.sync.set({"trimmed":true});
    }
    // expand schedule
    else {
        button.id = "shrink";
        button.title = "Trim Schedule";
        const image = button.querySelector("img");
        image.src = "images/icons/shrink.png";
        chrome.storage.sync.set({"trimmed":false});
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
                const start = parseFloat(subject["start"].replace(",", "."));
                const duration = parseFloat(subject["duration"].replace(",", "."));
                const end = start+duration;
                subject["time"] = `${start}h - ${end}h`;
                ["time" ,"duration", "room", "capacity"].forEach(type => {
                    const rowWrapper = document.createElement("div");
                    info.appendChild(rowWrapper);
                    rowWrapper.title = type.charAt(0).toUpperCase()+type.slice(1);
                    const rowIcon = document.createElement("img");
                    rowWrapper.appendChild(rowIcon);
                    rowIcon.src = `images/icons/${type}.png`;
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

const highlightNowCell = (day, hours, minutes) => {
    if (highlightNow !== false) {
        const now = new Date();
        day = day !== undefined ? day : now.getDay();
        hours = hours !== undefined ? hours : now.getHours();
        minutes = minutes !== undefined ? minutes : now.getMinutes();
        if (day > 0 && day < 6) {
            let cell = mySchedule.highlight(day, hours, minutes, "You're here");
            if (cell) {
                if (cell.classList.contains("class")) {
                    const liveClass = document.createElement("div");
                    cell.appendChild(liveClass);
                    liveClass.classList.add("live-class");
                }
                
                if (cell.getAttribute("type") == "slave") {
                    const masterId = cell.getAttribute("id");
                    if (masterId) {
                        const master = mySchedule.table.querySelector(`.class[id='${masterId}']`);
                        if (master) {
                            mySchedule.highlightCell(master);
                            const liveClass = document.createElement("div");
                            master.appendChild(liveClass);
                            liveClass.classList.add("live-class");
                        }
                    }
                }
            }
        }
    }
}

const classInfoPopup = (className, start, end, color) => {
    const wrapper = document.createElement("div");
    wrapper.classList.add("class-info-popup");
    if (color)
        wrapper.style.borderBottom = "4px solid "+color;
    const name = document.createElement("div");
    wrapper.appendChild(name);
    name.appendChild(document.createTextNode(className));
    const time = document.createElement("div");
    wrapper.appendChild(time);
    time.appendChild(document.createTextNode(`${start}h - ${end}h`));
    return wrapper;
}