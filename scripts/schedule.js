chrome.storage.sync.get(STORAGE_KEYS, result => {
    // if schedule data exists
    if (Object.keys(result).length === 3) {
        const title = document.getElementById("title");
        if (title) title.innerText += ` ${result["school_year"]} ${result["semester"]}`;
        
        schedule = scheduleMatrix();

        // fill in the schedule matrix
        Object.entries(result["schedule"]).forEach(([day, subjects]) => {
            subjects.forEach(subject => {
                const start = Number(subject["start"].replace("h", ""));
                schedule[start][DAYS_INDEX[day]] = subject;
            });
        });

        // iterate through filled matrix
        const spans = {};
        for (let i = 1; i <= 19*2+1; i++) {
            spans[i] = [];
        }
        Object.entries(Object.entries(schedule)).forEach(([i, [hour, subjects]]) => {
            const currentTableIndex = (Number(i)+1)*2;
            const tableRow = document.querySelector(`#main table tr:nth-of-type(${currentTableIndex})`);
            //console.log(tableRow, i, subjects);
            if (tableRow) {
                // fill the row with the subjects
                // iterate cells
                for (let j = 0; j <= 5; j++) {
                    const subject = subjects[j];
                    if (subject) {
                        const cell = tableRow.querySelector(`td:nth-child(${j+2})`);
                        
                        // number of rows the subject will fill
                        const rowspan = parseFloat(subject["duration"].replace("h", "").replace(",", "."))*2;
                        cell.setAttribute("rowspan", rowspan);

                        if (rowspan > 2)
                            spans[currentTableIndex+1].push(j+2);                

                        const subjectName = document.createElement("div");
                        cell.appendChild(subjectName);
                        subjectName.appendChild(document.createTextNode(subject["subject"]["abbrev"]));
                    }

                }
            }
        });

        // hide certain cells to compensate for the space taken by the rowspan
        for (let i = 1; i <= 19*2+1; i++) {
            if (spans[i].length > 0) {
                const tableRow = document.querySelector(`#main table tr:nth-of-type(${i+1})`);
                if (tableRow) {
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
    }
});

const scheduleMatrix = () => {
    const matrix = {};
    for (let i = 8; i <= 19; i++) {
        matrix[i] = new Array(6);
    }
    return matrix;
}

document.getElementById("exit").addEventListener("click", () => {
    chrome.storage.sync.remove(STORAGE_KEYS).then(() => window.location.href = "/popup.html");
});