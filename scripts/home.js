let mySchedule, storage;
const defaultHours = [8,9,10,11,12,13,14,15,16,17,18,19,20], defaultDays = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

const loadingData = loading("Loading data...");
document.body.appendChild(loadingData);

chrome.storage.sync.get([...SCHEDULE_CONFIGS, ...SETTINGS_KEYS], result => {
    // if schedule data exists
    if (SCHEDULE_CONFIGS.every(key => Object.keys(result).includes(key))) {
        storage = result;

        const title = document.getElementById("title");
        if (title) title.innerText += ` ${storage["school_year"]} ${storage["semester"]}`;

        let allHours;
        if (storage["limit_trimming"] !== false)
            allHours = Object.values(storage["schedule"]).map(subjects => subjects.map(subject => [parseFloat(subject["start"]), parseFloat(subject["start"])+parseFloat(subject["duration"])])).flat(2);

        // create schedule table
        mySchedule = new Schedule(document.querySelector("#main > div"), {
            "hours": defaultHours,
            "days": defaultDays,
            "schedule": storage["schedule"],
            "colors": storage["subject_colors"],
            "trimmed": storage["trimmed"],
            "limitTrimming": storage["limit_trimming"] !== false,
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

        if (!storage["subject_colors"])
            chrome.storage.sync.set({"subject_colors": mySchedule.subjectColors});


        //highlightTester(1, [8, 17], 0, 250);
        highlightNowCell();

        document.querySelector("#main").style.removeProperty("display");
        loadingData.remove();

        if (storage["trimmed"])
            updateExpandButton("shrink");

        if (storage["selected"]) {
            const selectors = document.querySelectorAll(".day-selector div");
            if (selectors) {
                const elem = Array.from(selectors).filter(selector => selector.innerText == storage["selected"])[0];
                if (elem) elem.click();
            }
        }
    }
    else
        window.location.href = "/login.html";
});

const highlightTester = (day, hours, k, speed) => {
    let [start, end] = hours;
    const fixedStart = start;
    const interval = setInterval(() => {
        const now = document.querySelectorAll(".cell-now");
        if (now) {
            now.forEach(elem => {
                elem.classList.remove("cell-now");
                if (elem.innerText === "You're here") elem.innerText = "";
            });
        }

        if (day == 6) clearInterval(interval);

        if (start == end+1) {
            start = fixedStart-1;
            day++;
        }

        if (k == 2) {
            k = 0;
            start++;
        }

        highlightNowCell(day, start, (k++)*30);
    }, speed);
}

window.addEventListener("click", e => {
    const target = e.target;

    if (target.closest("#download")) {
        const blob = new Blob([JSON.stringify({
            "schedule": mySchedule.schedule,
            "school_year": storage["school_year"],
            "semester": storage["semester"],
            "subject_colors": mySchedule.subjectColors
        }, null, 2)], {type: "application/json"});
        
        saveAs(blob, `schedua-schedule_${storage["school_year"]}_${storage["semester"]}.json`);
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

            html2canvas(area).then(canvas => canvas.toBlob(blob => saveAs(blob, `schedua-schedule_${storage["school_year"]}_${storage["semester"]}.png`), "image/png"));
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
                    const listSubjectsButton = document.getElementById("list-subjects");
                    if (listSubjectsButton)
                        listSubjectsButton.classList.replace("button-inactive", "clickable");

                    scheduleWrapper.firstChild?.remove();
                    scheduleWrapper.querySelector(".info-panel")?.remove();

                    mySchedule = new Schedule(scheduleWrapper, {
                        "hours": defaultHours,
                        "days": defaultDays,
                        "schedule": storage["schedule"],
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
        const listSubjectsButton = document.getElementById("list-subjects");
        if (listSubjectsButton)
            listSubjectsButton.classList.replace("button-inactive", "clickable");

        const targetSubject = target.closest(".class").innerText.split(" - ")[0];
        const days = Object.entries(storage["schedule"])
            .filter(([day, subjects]) => subjects.some(subject => subject["subject"]["abbrev"] == targetSubject))
            .map(entry => entry[0])
            .sort((a, b) => DAYS_INDEX[a] - DAYS_INDEX[b]);

        if (days) {
            document.querySelector(".selector-active")?.classList.replace("selector-active", "clickable");
            document.querySelector("#schedule .info-circle").style.display = "none";

            const scheduleWrapper = document.querySelector("#main > div");
            scheduleWrapper.firstChild?.remove();
            scheduleWrapper.querySelector(".info-panel")?.remove();
        
            if (days.length == 1)
                createDaySchedule(scheduleWrapper, days[0]);
            else {
                // adjust schedule
                const newSchedule = JSON.parse(JSON.stringify(storage["schedule"])); // deep clone schedule
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
    }

    if (!target.closest(".floating-info-panel") && !target.closest("#list-subjects") && !target.closest("#darkmode") && document.querySelector(".floating-info-panel"))
        document.querySelector("#list-subjects").click();

    if (document.querySelector(".day-selector") && !target.closest(".day-selector") && window.getComputedStyle(document.querySelector(".day-selector"))["display"] !== "none")
        document.querySelector(".day-selector").style.display = "none";
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
        if (storage["class_popup_info"] !== false) {
            const subjectInfo = mySchedule.schedule[subject.getAttribute("day")].filter(subj => subj["subject"]["abbrev"] === subject.getAttribute("subject") && subj["class"] === subject.getAttribute("class-group"))[0];
            const start = parseFloat(subjectInfo["start"].replace(",", "."));
            const duration = parseFloat(subjectInfo["duration"].replace(",", "."));
            const end = start+duration;
            if (!document.querySelector(".class-popup")) {
                const popup = classInfoPopup({name: subjectInfo["subject"]["name"], code: subjectInfo["subject"]["code"]}, start, end, mySchedule.subjectColors ? mySchedule.subjectColors[targetSubject] : null);
                popup.style.top = (subject.offsetHeight - 5)+"px";
                subject.appendChild(popup);
            }
        }
    }

    if (target.closest("table th")) {
        // only enable action if there are several days
        const targetElem = target.closest("table th");
        const weekday = targetElem.innerText;
        if (Object.keys(DAYS_INDEX).includes(weekday)) {
            if (target.closest("table tr").children.length > 3) {
                Array.from(mySchedule.table.querySelectorAll(".class")).forEach(subject => {
                    if (subject.getAttribute("day") !== weekday)
                        subject.classList.add("shadowed-class");
                });

                // highlight column
                const index = mySchedule.daysIndex[weekday]+2;
                mySchedule.columnHighlight(index, "add");
            }
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

    if (storage["highlight_mouse_target_cell"]) {
        if (target.closest("table td")) {
            const thisCell = target.closest("table td");
    
            const x = Array.from(thisCell.parentElement.children).indexOf(thisCell)+1;
            const y = Array.from(thisCell.parentElement.parentElement.children).indexOf(thisCell.parentElement)+1;
            
            mySchedule.columnHighlight(x, "add");
            mySchedule.rowHighlight(y, "add");
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

        if (subject.querySelector(".class-info-popup")) subject.querySelector(".class-info-popup").remove();
    }

    if (target.closest("table th")) {
        // only enable action if there are several days
        const targetElem = target.closest("table th");
        const weekday = targetElem.innerText;
        if (target.closest("table tr").children.length > 3) {
            Array.from(mySchedule.table.querySelectorAll(".class")).forEach(subject => {
                if (subject.getAttribute("day") !== weekday)  
                    subject.classList.remove("shadowed-class");
            });

            // remove column highlight
            const index = mySchedule.daysIndex[weekday]+2;
            mySchedule.columnHighlight(index, "remove");
        }
        else {
            if (targetElem.getAttribute("day"))
                targetElem.innerText = targetElem.getAttribute("day");
        }
    }

    if (storage["highlight_mouse_target_cell"]) {
        if (target.closest("table td")) {
            const thisCell = target.closest("table td");
    
            const x = Array.from(thisCell.parentElement.children).indexOf(thisCell)+1;
            const y = Array.from(thisCell.parentElement.parentElement.children).indexOf(thisCell.parentElement)+1;
            
            mySchedule.columnHighlight(x, "remove");
            mySchedule.rowHighlight(y, "remove");
        }
    }
});

const createDaySchedule = (scheduleWrapper, scheduleDay) => {
    scheduleWrapper.firstChild?.remove();
    scheduleWrapper.querySelector(".info-panel")?.remove();
    const listSubjectsButton = document.getElementById("list-subjects");
    if (listSubjectsButton)
        listSubjectsButton.classList.replace("clickable", "button-inactive");

    mySchedule = new Schedule(scheduleWrapper, {
        "hours": defaultHours,
        "days": [scheduleDay],
        "schedule": {[scheduleDay]: storage.schedule[scheduleDay]},
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

    if (schedule) {
        const scheduleSize = Object.keys(schedule).length;

        // summary
        const genDataWrapper = document.createElement("div");
        wrapper.appendChild(genDataWrapper);

        let dayChooser;
        if (scheduleSize > 1) {
            // day chooser
            dayChooser = document.createElement("div");
            wrapper.appendChild(dayChooser);
            dayChooser.classList.add("day-chooser");
        }

        const subjectsWrapper = document.createElement("div");
        wrapper.appendChild(subjectsWrapper);
        let pract = 0, theor = 0, hoursTotal = 0;

        Object.entries(schedule).forEach(([day, subjects]) => {
            if (subjects) {
                const container = document.createElement("div");
                subjectsWrapper.appendChild(container);
                container.setAttribute("day", day);
                subjects.forEach(subject => {
                    if (subject) {
                        const subjectWrapper = document.createElement("div");
                        container.appendChild(subjectWrapper);
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
                        subject["day"] = day.slice(0, 3).toUpperCase();
                        const keys = ["day", "time" ,"duration", "room", "capacity"];
                        if (scheduleSize == 1)
                            delete keys[0];

                        keys.forEach(type => {
                            const rowWrapper = document.createElement("div");
                            info.appendChild(rowWrapper);
                            rowWrapper.title = type.charAt(0).toUpperCase()+type.slice(1);
                            const rowIcon = document.createElement("img");
                            rowWrapper.appendChild(rowIcon);
                            rowIcon.src = `images/icons/${type}.png`;
                            rowIcon.classList.add("icon");
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
        }); 
     
        // summary
        const data = [scheduleSize, pract+theor, pract, theor, hoursTotal+"h"];
        const titles = ["Days", "Classes", "Pract.", "Theor.", "Hours Total"];
        if (scheduleSize == 1) {
            delete data[0];
            delete titles[0];
        }
        titles.forEach((title, i) => {
            const wrapper = document.createElement("div");
            genDataWrapper.appendChild(wrapper);
            const titleElem = document.createElement("b");
            wrapper.appendChild(titleElem);
            titleElem.appendChild(document.createTextNode(title));
            wrapper.appendChild(document.createTextNode(` ${data[i]}`));
        });

        // day chooser
        if (scheduleSize > 1) {
            Object.keys(schedule).forEach(dayString => {
                const dayWrapper = document.createElement("div");
                dayChooser.appendChild(dayWrapper);
                dayWrapper.appendChild(document.createTextNode(dayString));
                dayWrapper.classList.add("clickable");
                dayWrapper.addEventListener("click", () => wrapper.parentElement.scrollTo(0, subjectsWrapper.querySelector(`div[day="${dayString}"]`).offsetTop));
            });
        }
    }

    return wrapper;
}

const highlightNowCell = (day, hours, minutes) => {
    if (storage["highlight_now"] !== false) {
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
                            mySchedule.cellHighlight(master);
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

const classInfoPopup = (info, start, end, color) => {
    const wrapper = document.createElement("div");
    wrapper.classList.add("class-popup", "class-info-popup");
    if (color)
        wrapper.style.borderBottom = "4px solid "+color;
    const name = document.createElement("div");
    wrapper.appendChild(name);
    name.appendChild(document.createTextNode(info["name"]));

    const infoRow = (icon, text) => {
        const rowWrapper = document.createElement("div");
        const img = document.createElement("img");
        rowWrapper.appendChild(img);
        img.src = icon;
        img.classList.add("icon");
        const textElem = document.createElement("div");
        rowWrapper.appendChild(textElem);
        textElem.appendChild(document.createTextNode(text));
        return rowWrapper;
    }

    if (info["code"])
        wrapper.appendChild(infoRow("images/icons/key.png", info["code"]));

    wrapper.appendChild(infoRow("images/icons/time.png", `${start}h - ${end}h`));
    return wrapper;
}

window.addEventListener('contextmenu', e => {
    const target = e.target;

    if (target.closest(".class")) {
        // prevent default context menu
        e.preventDefault();

        if (document.querySelector(".class-popup"))
            document.querySelector(".class-popup").remove();
        
        target.closest(".class").appendChild(contextMenu(["Complete Schedule", "Remove Class", "Remove Subject"]));
    }
});

const contextMenu = options => {
    const wrapper = document.createElement("div");
    wrapper.classList.add("class-popup", "class-context-menu");
    options.forEach(option => {
        const opt = document.createElement("div");
        wrapper.appendChild(opt);
        opt.classList.add("clickable");
        opt.appendChild(document.createTextNode(option));
    });
    return wrapper;
}