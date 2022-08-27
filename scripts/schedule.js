chrome.storage.sync.get(["schedule", "school_year", "semester"], result => {
    // if schedule data exists
    if (Object.keys(result).length === 3) {
        const title = document.getElementById("title");
        if (title) title.innerText += ` ${result["school_year"]} ${result["semester"]}`;
        
        schedule = scheduleMatrix();

        // fill in the schedule matrix
        console.log(DAYS_INDEX);
        Object.entries(result["schedule"]).forEach(([day, subjects]) => {
            subjects.forEach(subject => {
                const start = Number(subject["start"].replace("h", ""));
                schedule[start][DAYS_INDEX[day]] = subject;
            });
        });

        console.log(schedule);

        // iterate through filled matrix
        Object.entries(Object.entries(schedule)).forEach(([i, [hour, subjects]]) => {
            const tableRow = document.querySelector(`#main table tr:nth-of-type(${((Number(i)+1)*2)})`);
            //console.log(tableRow, i, subjects);
            if (tableRow) {
                // fill the row with the subjects
                // iterate cells
                for (let j = 0; j <= 5; j++) {
                    const subject = subjects[j];
                    if (subject) {
                        const cell = tableRow.querySelector(`td:nth-child(${j+2})`);
                        
                        // number of rows the subject will fill
                        const rowspan = Number(subject["duration"].replace("h", ""))*2;
                        cell.setAttribute("rowspan", rowspan);

                        // hide certain cells to compensate for the space taken by the rowspan
                        if (rowspan > 2) {
                            const nextHourRow = tableRow.nextElementSibling?.nextElementSibling;
                            if (nextHourRow) {
                                const cell = nextHourRow.querySelector(`td:nth-child(${j+3})`);
                                if (cell) cell.style.display = "none";
                            }
                        }
                        

                        const subjectName = document.createElement("div");
                        cell.appendChild(subjectName);
                        subjectName.appendChild(document.createTextNode(subject["subject"]["abbrev"]));
                    }

                }
            }
        });
    }
});

const scheduleMatrix = () => {
    const matrix = {};
    for (let i = 8; i <= 19; i++) {
        matrix[i] = new Array(6);
    }
    return matrix;
}