let schedule = {}, school_year, semester;

chrome.storage.sync.get([...STORAGE_KEYS, "expanded", "subject_colors"], result => {
    // if schedule data exists
    if (STORAGE_KEYS.every(key => Object.keys(result).includes(key))) {
        schedule = result["schedule"];
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

        let subjectColors = result["subject_colors"];
        if (!subjectColors) {
            subjectColors = {};
            const subjects = [...new Set(Object.entries(schedule).map(([key, value]) => value.map(obj => obj["subject"]["abbrev"])).flat(1))];
            let indexes = [], counter = 0;
            while (indexes.length < subjects.length) {
                const index = Math.floor(Math.random() * SUBJECT_COLORS.length-1) + 1;
                if (indexes.indexOf(index) === -1) {
                    indexes.push(index);
                    subjectColors[subjects[counter++]] = SUBJECT_COLORS[index];
                }
            }
            chrome.storage.sync.set({"subject_colors": subjectColors});
        }

        // remove "Sábado" if it has no classes
        if (schedule["Sábado"].length == 0)
            document.querySelectorAll("#main table tr").forEach(row => row.children[6].style.display = "none");

        matrix = scheduleMatrix();

        // fill in the schedule matrix
        Object.entries(schedule).forEach(([day, subjects]) => {
            subjects.forEach(subject => {
                const start = Number(subject["start"].replace("h", ""));
                matrix[start][DAYS_INDEX[day]] = subject;
            });
        });

        // iterate through filled matrix
        const spans = {};
        for (let i = 1; i <= 19*2+1; i++) {
            spans[i] = [];
        }
        Object.entries(Object.entries(matrix)).forEach(([i, [hour, subjects]]) => {
            const currentTableIndex = (Number(i)+1)*2;
            const tableRow = document.querySelector(`#main table tr:nth-of-type(${currentTableIndex})`);
            if (tableRow) {
                // fill the row with the subjects
                // iterate cells
                for (let j = 0; j <= 5; j++) {
                    const subject = subjects[j];
                    if (subject) {
                        tableRow.setAttribute("filled", "true");
                        if (tableRow.nextElementSibling) tableRow.nextElementSibling.setAttribute("filled", "true");

                        const cell = tableRow.querySelector(`td:nth-child(${j+2})`);
                        cell.classList.add("clickable", "class");

                        // number of rows the subject will fill
                        const rowspan = parseFloat(subject["duration"].replace("h", "").replace(",", "."))*2;
                        cell.setAttribute("rowspan", rowspan);

                        if (rowspan > 2)
                            spans[currentTableIndex+1].push(j+2);                

                        cell.style.backgroundColor = subjectColors[subject["subject"]["abbrev"]];
                        const infoWrapper = document.createElement("div");
                        cell.appendChild(infoWrapper);
                        const subjectName = document.createElement("div");
                        infoWrapper.appendChild(subjectName);
                        subjectName.appendChild(document.createTextNode(`${subject["subject"]["abbrev"]} - ${subject["class"]}`));
                        const roomName = document.createElement("div");
                        infoWrapper.appendChild(roomName);
                        roomName.appendChild(document.createTextNode(subject["room"]));
                    }

                }
            }
        });

        // hide certain cells to compensate for the space taken by the rowspan
        for (let i = 1; i <= 19*2+1; i++) {
            if (spans[i].length > 0) {
                const tableRow = document.querySelector(`#main table tr:nth-of-type(${i+1})`);
                if (tableRow) {
                    // identify row as indirectly filled
                    tableRow.setAttribute("filled", "true");
                    if (tableRow.nextElementSibling) tableRow.nextElementSibling.setAttribute("filled", "true");

                    let counter = 0, control = 0;
                    while(1) {
                        const cell = tableRow.querySelector(`td:nth-child(${spans[i][counter]})`);
                        // only hide cells that are empty
                        if (cell && !cell.innerText) {
                            cell.style.display = "none";
                            counter++;
                        }             
                        
                        // break loop if the correct number os cells have been hidden
                        // (or when there aren't any more cells left, to prevent an infinite loop)
                        if (spans[i].length == counter || control++ >= tableRow.childElementCount) break;
                    }
                }
            }
        }

        if (!result["expanded"]) document.getElementById("shrink")?.click();
    }
});

const scheduleMatrix = () => {
    const matrix = {};
    for (let i = 8; i <= 19; i++) {
        matrix[i] = new Array(6);
    }
    return matrix;
}

window.addEventListener("click", e => {
    const target = e.target;

    if (target.closest("#download")) {
        const blob = new Blob([JSON.stringify(schedule, null, 2)], {type: "application/json"});
        
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

        const tableRows = document.querySelectorAll("#main table tr");
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

        const table = document.querySelector(`#main table`);
        if(table)
            Array.from(table.querySelectorAll("tr[style='display: none;']")).forEach(cell => cell.style.removeProperty("display"));
    }
});
