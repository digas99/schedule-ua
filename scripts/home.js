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
        const blob = new Blob([JSON.stringify(mySchedule.schedule, null, 2)], {type: "application/json"});
        
        saveAs(blob, `schedua-schedule_${school_year}_${semester}.json`);
    }

    // trim schedule ui
    if (target.closest("#shrink")) {
        updateExpandButton("shrink");
        mySchedule.trim();
    }
    // expand schedule
    else if (target.closest("#expanded")) {
        updateExpandButton("expanded");
        mySchedule.expand();
    }

    // take picture of schedule
    if (target.closest("#picture")) {
        // printscreen animation
        mySchedule.table.style.filter = "brightness(2)";
        setTimeout(() => mySchedule.table.style.removeProperty("filter"), 150);

        html2canvas(mySchedule.table).then(canvas => canvas.toBlob(blob => saveAs(blob, `schedua-schedule_${school_year}_${semester}.png`), "image/png"));
    }

    // schedule selectors
    if (target.closest(".selectors")) {
        const scheduleWrapper = document.querySelector("#main > div");
        if (scheduleWrapper && !target.classList.contains("selector-active")) {
            scheduleWrapper.firstChild?.remove();
            
            document.querySelector(".selector-active").classList.replace("selector-active", "clickable");
            target.classList.replace("clickable", "selector-active");

            const trimmed = mySchedule.trimmed;
            const selected = target.innerText; 
            switch(selected) {
                case "Week":
                    mySchedule = new Schedule(scheduleWrapper, {
                        "hours": defaultHours,
                        "days": defaultDays,
                        "schedule": schedule,
                        "colors": subjectColors,
                        "trimmed": trimmed
                    });

                    mySchedule.create();
                    mySchedule.removeSaturday();

                    break;
                case "Today":
                case "Tomorrow":
                case "Yesterday":
                    let day;
                    if (selected == "Today")
                        day = getDayFromIndex(new Date().getDay());
                    else if (selected == "Tomorrow")
                        day = getDayFromIndex(getNewDate(1).getDay());
                    else if (selected == "Yesterday")
                        day = getDayFromIndex(getNewDate(-1).getDay());

                    mySchedule = new Schedule(scheduleWrapper, {
                        "hours": defaultHours,
                        "days": [day],
                        "schedule": {[day]: schedule[day]},
                        "colors": subjectColors,
                        "trimmed": trimmed
                    });

                    mySchedule.create();
                    mySchedule.fixSpanningCollapse();
                    
                    break;
            }

            chrome.storage.sync.set({"selected": selected});
        }
    }
});

updateExpandButton = state => {
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