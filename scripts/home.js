let mySchedule, storage;
const defaultHours = [8,9,10,11,12,13,14,15,16,17,18,19,20], defaultDays = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

const loadingData = loading("Loading data...");
document.body.appendChild(loadingData);

chrome.storage.sync.get(null, result => {
    // if schedule data exists
    if (SCHEDULE_CONFIGS.every(key => Object.keys(result).includes(key))) {
        storage = result;

        const title = document.getElementById("title");
        if (title) title.innerText += ` ${storage["school_year"]} ${storage["semester"]}`;

        let allHours;
        if (storage["limit_trimming"] !== false)
            allHours = Object.values(storage["schedule"]).map(subjects => subjects.map(subject => [parseFloat(subject["start"]), parseFloat(subject["start"])+parseFloat(subject["duration"])])).flat(2);

        // setup message tags default
        if (!storage["messages"]) {
            const messageTags = {};
            MESSAGE_TAGS.forEach(tag => {
                messageTags[tag] = true;
            });
            storage["messages"] = messageTags;
            chrome.storage.sync.set({"messages": messageTags});
        }

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

        // warn for missing schedules of subjects
        const subjectCodes = Array.from(new Set(Object.entries(mySchedule.schedule).map(([_, classes]) => classes.map(data => data["subject"]["code"])).flat(1))); 
        const subjectsWithoutSchedules = [];
        subjectCodes.forEach(code => {
            // if the subject doesn't have a schedule yet
            if (!Object.keys(storage).includes(code+"_schedule"))
                subjectsWithoutSchedules.push(code);

        });
        
        if (subjectsWithoutSchedules.length > 0 && !window.location.search.includes("bottom_info") && storage["messages"]["missing_subject_schedules"])
            document.body.appendChild(bottomInfo("Missing schedules for the following subjects: "+ subjectsWithoutSchedules.join(","), "Some schedules could not be loaded due to some issue. To try to load them, login again. If you didn't login in the first place, please ignore this message."));
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

document.addEventListener("click", e => {
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
                    chrome.storage.sync.get(["schedule"], storage => {
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
                        
                    });

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

    // class cell
    if (target.closest(".class") &&  !target.closest(".class-context-menu")) {
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

    // clicked on class context menu
    if (target.closest(".class-context-menu")) {
        const cell = target.closest(".class");
        const option = target.closest(".clickable")?.innerText;
        switch(option) {
            case "Complete Schedule":
                const scheduleWrapper = document.querySelector("#main > div");
                const subjectCode = target.closest(".class").getAttribute("code");
                if (scheduleWrapper && subjectCode) {
                    const key = subjectCode+"_schedule";
                    chrome.storage.sync.get(key, result => {
                        if (result[key]) {
                            scheduleWrapper.firstChild?.remove();
                            scheduleWrapper.querySelector(".info-panel")?.remove();

                            const schedule = result[key]["schedule"];

                            mySchedule = new Schedule(scheduleWrapper, {
                                "hours": defaultHours,
                                "days": defaultDays,
                                "schedule": schedule,
                                "colors": mySchedule.subjectColors,
                                "trimmed": mySchedule.trimmed,
                                "limitTrimming": mySchedule.limitTrimming,
                            });

                            mySchedule.create();
                            mySchedule.setupOverlappedSubjects();
                            mySchedule.removeSaturday();
                            
                            highlightNowCell();
                        }
                    });
                }
                break;
            case "Edit Class":
                const classInfo = {
                    subject: cell.getAttribute("subject"),
                    day: cell.getAttribute("day"),
                    start: cell.getAttribute("start"),
                    duration: cell.getAttribute("duration"),
                }
                if (cell.getAttribute("class-group"))
                    classInfo["class"] = cell.getAttribute("class-group");
                if (cell.getAttribute("room"))
                    classInfo["room"] = cell.getAttribute("room");
                if (cell.getAttribute("capacity"))
                    classInfo["capacity"] = cell.getAttribute("capacity");

                document.body.appendChild(editClass("Edit Class", (e, popup, values) => {
                    if (editClassUpdate(e, popup, values)) {
                        chrome.storage.sync.get("schedule", result => removeCell(cell, result["schedule"]));
                        Array.from(mySchedule.table.querySelectorAll(".shadowed-class")).forEach(cell => cell.classList.remove("shadowed-class"));
                    }
                }, classInfo));

                break;
            case "Remove Class":
                if (cell) {
                    chrome.storage.sync.get("schedule", result => removeCell(cell, result["schedule"]));
                    Array.from(mySchedule.table.querySelectorAll(".shadowed-class")).forEach(cell => cell.classList.remove("shadowed-class"));
                }
                
                break;
            case "Remove Subject":
                if (cell) {
                    const subject = cell.getAttribute("subject");
                    if (subject) {
                        chrome.storage.sync.get("schedule", result => Array.from(mySchedule.table.querySelectorAll(`td[subject="${subject}"]`)).forEach(classCell => removeCell(classCell, result["schedule"])));
                        Array.from(mySchedule.table.querySelectorAll(".shadowed-class")).forEach(cell => cell.classList.remove("shadowed-class"));
                    }
                }
        }
    }

    // clicked outside class context menu
    if (document.querySelector(".class-context-menu") && !target.closest(".class-context-menu"))
        document.querySelector(".class-context-menu").remove();

    // empty cell        
    let cell;
    if ((cell = target.closest("table tr > td")) && !cell.style.display && !cell.getAttribute("type")) {
        const x = parseInt(Array.from(cell.parentElement.children).indexOf(cell));
        const y = parseInt(Array.from(cell.parentElement.parentElement.children).indexOf(cell.parentElement));
        const day = mySchedule.table.querySelector(`th:nth-of-type(${x+1})`).innerText;
        let time = parseInt((y % 2 == 0 ? cell.parentElement.previousElementSibling : cell.parentElement).firstElementChild.innerText);
        if (y % 2 == 0)
            time+=",5";

        document.body.appendChild(editClass("Add Class", editClassUpdate, {
            start: time,
            day: day
        }));
    }
});

const editClassUpdate = (e, popup, values) => {
    console.log(values);
    const subjectSelect = popup.querySelector("#add-subject");
    const startTimeInput = popup.querySelector("#add-start-time");
    const startDayInput = popup.querySelector("#add-start-day");
    const duration = popup.querySelector("#add-duration");
    if (subjectSelect.value && startTimeInput.value && startDayInput.value && duration.value) {
        const daySubjects = mySchedule.schedule[startDayInput.value.replaceAll(/<>/g, "")];
        if (daySubjects) {
            const subjectData = mySchedule.subjectsData.filter(subject => subject["abbrev"] === values.subject)[0];
            daySubjects.push({
                capacity: parseInt(values.capacity),
                class: values.class,
                duration: values.duration.replace(".", ",")+"h",
                room: values.room,
                start: values.start.replace(".", ",")+"h",
                subject: subjectData
            });

            chrome.storage.sync.set({"schedule": mySchedule.schedule}, () => window.location.reload());

            return true;
        }
    }

    return false;
}

const editClass = (title, action, defaults) => {
    const pp = popup({
        "close": true,
        "title": title,
    });

    console.log(defaults);

    const popupWindow = pp.querySelector("div:nth-child(2)");
    popupWindow.classList.add("add-class-menu");
    
    const subjectSection = document.createElement("div");
    popupWindow.appendChild(subjectSection);
    subjectSection.classList.add("item-check");
    const subjectLabel = document.createElement("label");
    subjectSection.appendChild(subjectLabel);
    subjectLabel.appendChild(document.createTextNode("Subject *"));
    subjectLabel.setAttribute("for", "add-subject");
    if (mySchedule && mySchedule.subjects) {
        const subjectSelect = document.createElement("select");
        subjectSection.appendChild(subjectSelect);
        subjectSelect.id = "add-subject";
        subjectSelect.setAttribute("name", "add-subject");
        ["", ...mySchedule.subjects.sort((a, b) => a.localeCompare(b))].forEach(subject => {
            const subjectOption = document.createElement("option");
            subjectSelect.appendChild(subjectOption);
            subjectOption.appendChild(document.createTextNode(subject));
            if (mySchedule.subjectColors) {
                subjectOption.style.backgroundColor = mySchedule.subjectColors[subject];
                subjectOption.style.color = "white";
            }

            if (subject === defaults?.subject)
                subjectOption.selected = true;
        });

        const startWrapper = document.createElement("div");
        popupWindow.appendChild(startWrapper);
        startWrapper.classList.add("item-check");
        const startIcon = document.createElement("img");
        startWrapper.appendChild(startIcon);
        startIcon.classList.add("icon");
        startIcon.src = "images/icons/time.png";
        const startLabel = document.createElement("label");
        startWrapper.appendChild(startLabel);
        startLabel.appendChild(document.createTextNode("Start *"));
        const startTimeInput = document.createElement("input");
        startWrapper.appendChild(startTimeInput);
        startTimeInput.id = "add-start-time";
        startTimeInput.setAttribute("name", "add-start-time");
        startTimeInput.type = "text";
        startTimeInput.placeholder = "8,5";
        if (defaults?.start)
            startTimeInput.value = defaults.start;
        startTimeInput.style.width = "25%";
        startTimeInput.style.marginRight = "-10px";
        const startH = document.createElement("div");
        startWrapper.appendChild(startH);
        startH.innerText = "h";
        startH.style.fontSize = "16px";
        startH.style.paddingLeft = "3px";
        const startDayInput = document.createElement("input");
        startWrapper.appendChild(startDayInput);
        startDayInput.id = "add-start-day";
        startDayInput.setAttribute("name", "add-start-day");
        startDayInput.type = "text";
        startDayInput.placeholder = "Segunda";
        if (defaults?.day)
            startDayInput.value = defaults.day;
        startDayInput.style.width = "55%";

        const sections = [
            {
                title: "Duration *",
                placeholder: "1,5",
                icon: "images/icons/duration.png"
            },
            {
                title: "Class",
                placeholder: "TP1",
                icon: "images/icons/schedule.png"
            },
            {
                title: "Room",
                placeholder: "4.1.10",
                icon: "images/icons/room.png"
            },
            {
                title: "Capacity",
                placeholder: "30",
                icon: "images/icons/capacity.png"
            }
        ];

        sections.forEach(section => {
            const wrapper = document.createElement("div");
            popupWindow.appendChild(wrapper);
            wrapper.classList.add("item-check");
            const img = document.createElement("img");
            wrapper.appendChild(img);
            img.classList.add("icon");
            img.src = section["icon"];
            const label = document.createElement("label");
            wrapper.appendChild(label);
            label.appendChild(document.createTextNode(section["title"]));
            label.setAttribute("for", "add-"+section["title"].replace(" *", "").toLowerCase());
            const input = document.createElement("input");
            wrapper.appendChild(input);
            input.id = "add-"+section["title"].replace(" *", "").toLowerCase();
            input.setAttribute("name", "add-"+section["title"].replace(" *", "").toLowerCase());
            input.type = "text";
            input.placeholder = section["placeholder"];

            // defaults
            if (defaults && defaults[section["title"].replace(" *", "").toLowerCase()])
                input.value = defaults[section["title"].replace(" *", "").toLowerCase()];
        });

        const durationWrapper = popupWindow.querySelector("#add-duration").parentElement;
        durationWrapper.querySelector("input").style.marginRight = "-10px";
        const h = document.createElement("div");
        durationWrapper.appendChild(h);
        h.innerText = "h";
        h.style.marginRight = "-12px";
        h.style.fontSize = "16px";
        h.style.paddingLeft = "3px";

        if (action) {
            const addButton = document.createElement("div");
            popupWindow.appendChild(addButton);
            addButton.classList.add("button");
            addButton.appendChild(document.createTextNode("Submit"));
            addButton.addEventListener("click", e => action(e, pp, {
                subject: subjectSelect.value,
                start: startTimeInput.value,
                day: startDayInput.value,
                duration: durationWrapper.querySelector("input").value,
                class: popupWindow.querySelector("#add-class").value,
                room: popupWindow.querySelector("#add-room").value,
                capacity: popupWindow.querySelector("#add-capacity").value
            }));
        }

        return pp;
    }

    return null;
}

const removeCell = (cell, schedule) => {
    const day = cell.getAttribute("day");
    const subject = cell.getAttribute("subject");
    const classGroup = cell.getAttribute("class-group");
    const dayObject = schedule[day];
    let indexToDelete;
    for (const [i, classValue] of dayObject.entries()) {
        if (classValue["subject"]["abbrev"] === subject && classValue["class"] === classGroup) {
            indexToDelete = i;
            break;
        }
    }

    if (indexToDelete !== undefined) {
        dayObject.splice(indexToDelete, 1);
        chrome.storage.sync.set({schedule: schedule});
        mySchedule.schedule = schedule;
    }

    mySchedule.removeClassCell(cell);
}

document.addEventListener("mouseover", e => {
    const target = e.target;
    
    if (target.closest(".class")) {
        const subject = target.closest(".class");

        // remove z-index from others
        Array.from(document.querySelectorAll(".class")).forEach(cell => {
            if (target.closest(".class") !== cell)
                cell.style.removeProperty("z-index");
        });

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

document.addEventListener("mouseout", e => {
    const target = e.target;
    
    if (target.closest(".class")) {
        const subject = target.closest(".class");
        
        subject.style.removeProperty("z-index");
        // add z-index to the subject with context menu active
        const classWithContextMenu = Array.from(document.querySelectorAll(".class")).filter(cell => cell.querySelector(".class-context-menu"))[0];
        if (classWithContextMenu)
            classWithContextMenu.style.zIndex = "3";

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
        "schedule": {[scheduleDay]: mySchedule.schedule[scheduleDay]},
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

document.addEventListener('contextmenu', e => {
    const target = e.target;

    if (target.closest(".class") && !target.closest(".class-context-menu")) {
        // prevent default context menu
        e.preventDefault();

        if (document.querySelector(".class-popup"))
            document.querySelector(".class-popup").remove();
        
        const subjectCode = target.closest(".class").getAttribute("code");
        chrome.storage.sync.get(null, result => {
            const inactive = [];
            if (!Object.keys(result).includes(subjectCode+"_schedule"))
                inactive.push("Complete Schedule");
        
            target.closest(".class").appendChild(contextMenu([
                {title: "Complete Schedule", icon: "images/icons/schedule.png"},
                {title: "Edit Class", icon: "images/icons/edit.png"},
                {title: "Remove Class", icon: "images/icons/bin.png"},
                {title: "Remove Subject", icon: "images/icons/bin.png"},
            ], inactive));
        });
    }

    // clicked outside context menu
    if (document.querySelector(".class-context-menu") && !target.closest(".class"))
        document.querySelector(".class-context-menu").remove();
});

const contextMenu = (options, inactive) => {
    const wrapper = document.createElement("div");
    wrapper.classList.add("class-popup", "class-context-menu");
    options.forEach(option => {
        const opt = document.createElement("div");
        wrapper.appendChild(opt);
        opt.classList.add("clickable");
        const img = document.createElement("img");
        opt.appendChild(img);
        img.classList.add("icon");
        img.src = option["icon"];
        opt.appendChild(document.createTextNode(option["title"]));

        if (inactive.includes(option["title"])) {
            opt.style.opacity = "0.5";
            opt.classList.remove("clickable");
            opt.style.pointerEvents = "none";
        }
    });
    return wrapper;
}