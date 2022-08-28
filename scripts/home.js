let mySchedule, school_year, semester;

chrome.storage.sync.get([...STORAGE_KEYS, "expanded", "subject_colors"], result => {
    // if schedule data exists
    if (STORAGE_KEYS.every(key => Object.keys(result).includes(key))) {
        school_year = result["school_year"];
        semester = result["semester"];

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
            "hours": [8,9,10,11,12,13,14,15,16,17,18,19],
            "days": ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"],
            "schedule": result["schedule"],
            "colors": result["subject_colors"]
        });
        
        mySchedule.create();

        if (!result["subject_colors"]) chrome.storage.sync.set({"subject_colors": mySchedule.subjectColors});

        // remove "Sábado" if it has no classes
        if (mySchedule.schedule["Sábado"].length == 0)
            mySchedule.table.querySelectorAll("tr").forEach(row => row.children[6].style.display = "none");

        if (!result["expanded"]) document.getElementById("shrink")?.click();
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
        const elem = target.closest("#shrink"); 
        elem.id = "expand";
        elem.title = "Expand Schedule";
        const image = elem.querySelector("img");
        image.src = "images/icons/expand.png";
        chrome.storage.sync.set({"expanded":false});

        const tableRows = mySchedule.table.querySelectorAll("tr");
        if(tableRows) {
            // top to bottom
            for (let i = 1; i < tableRows.length; i++) {
                // if row is empty
                if (!tableRows[i].getAttribute("filled")) tableRows[i].style.display = "none";
                else break;
            }

            // bottom to top
            for (let i = tableRows.length-1; i > 0; i--) {
                // if row is empty
                if (!tableRows[i].getAttribute("filled")) tableRows[i].style.display = "none";
                else break;
            }
         }
    }
    // expand schedule
    else if (target.closest("#expand")) {
        const elem = target.closest("#expand"); 
        elem.id = "shrink";
        elem.title = "Trim Schedule";
        const image = elem.querySelector("img");
        image.src = "images/icons/shrink.png";
        chrome.storage.sync.set({"expanded":true});

        Array.from(mySchedule.table.querySelectorAll("tr[style='display: none;']")).forEach(cell => cell.style.removeProperty("display"));
    }

    // take picture of schedule
    if (target.closest("#picture")) {
        // printscreen animation
        mySchedule.table.style.filter = "brightness(2)";
        setTimeout(() => mySchedule.table.style.removeProperty("filter"), 150);

        html2canvas(mySchedule.table).then(canvas => canvas.toBlob(blob => saveAs(blob, `schedua-schedule_${school_year}_${semester}.png`), "image/png"));
    }
});
