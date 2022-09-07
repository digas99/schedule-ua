const Schedule = function(container, config) {
    this.container = container;

    this.hours = config["hours"];
    this.days = config["days"];
    if (this.days) {
        this.daysIndex = {};
        this.days.forEach((day, i) => this.daysIndex[day] = i);
    }

    this.schedule = config["schedule"];
    this.subjectColors = config["colors"];
    this.trimmed = config["trimmed"];
    this.limitTrimming = config["limitTrimming"];
    this.soonest = config["soonest"];
    this.latest = config["latest"];
    this.subjectId = 0;

    if (Object.values(this.schedule)[0] == undefined || Object.values(this.schedule).flat(1).length == 0) this.empty = true;

    this.matrix = scheduleMatrix(this.hours, this.days.length);

    if (this.empty !== true && this.schedule)
        this.subjects = [...new Set(Object.entries(this.schedule).map(([key, value]) => value.map(obj => obj["subject"]["abbrev"])).flat(1))];
}

Schedule.prototype = {
    create: function() {
        this.createTable();

        if (!this.subjectColors)
            this.setColors();

        this.populateMatrix();
        this.fill();

        //this.fixSpanning();

        if (this.trimmed)
            this.trim();

        this.fixSpanningCollapse();
    },
    createTable: function() {
        this.table = document.createElement("table");
        const body = document.createElement("tbody");
        this.table.appendChild(body);
    
        // headers
        const headersRow = document.createElement("tr");
        body.appendChild(headersRow);
        ["", ...this.days, ""].forEach(day => {
            const header = document.createElement("th");
            headersRow.appendChild(header);
            header.appendChild(document.createTextNode(day));
        });
    
        // data rows
        this.hours.forEach(hour => {
            // row for the first half of the hour
            const firstRow = document.createElement("tr");
            body.appendChild(firstRow);
           
            const hourOnSide = hour => {
                const hourWrapper = document.createElement("td");
                hourWrapper.appendChild(document.createTextNode(hour+"h"));
                hourWrapper.setAttribute("rowspan", 2);
                return hourWrapper;
            }
    
            // hours on left side
            firstRow.appendChild(hourOnSide(hour));
           
            for (let i = 0; i < this.days.length; i++) {
                firstRow.appendChild(document.createElement("td"));
            }
    
            // hours on right side
            firstRow.appendChild(hourOnSide(hour));
    
            // row for the second half of the hour
            const secondRow = document.createElement("tr");
            body.appendChild(secondRow);
    
            for (let i = 0; i < this.days.length+2; i++) {
                secondRow.appendChild(document.createElement("td"));
            }
        });

        this.container.appendChild(this.table);
    },
    populateMatrix: function() {
        Object.entries(this.schedule).sort(([a_day, a_subject], [b_day, b_subject]) => this.daysIndex[a_day] - this.daysIndex[b_day])
            .forEach(([day, subjects]) => {
                // check if classes overlap
                for (let i = 0; i < subjects.length; i++) {
                    for (let j = i+1; j < subjects.length; j++) {
                        if (classesOverlap(subjects[i], subjects[j]))
                            subjects[j]["overlap"] = true;
                    }
                }

                subjects?.forEach(subject => {
                    if (!subject["overlap"]) {
                        const start = parseFloat(subject["start"].replace("h", ""));
                        this.matrix[start][this.daysIndex[day]] = subject;
                    }
                });
            });
    },
    setColors: function() {
        this.subjectColors = shuffleColors(this.subjects, SUBJECT_COLORS);
    },
    fill: function() {
        // iterate through filled matrix
        Object.entries(Object.entries(this.matrix)).forEach(([i, [hour, subjects]]) => {
            let rowIndex = (Number(i)+1)*2;
            let tableRow = this.table.querySelector(`tr:nth-of-type(${rowIndex})`);
            let halfHourStart = false;
            if (tableRow) {
                // fill the row with the subjects
                // iterate cells
                for (let j = 0; j < subjects.length; j++) {
                    const subject = subjects[j];
                    if (subject) {
                        // check for XXh30 cases
                        if (parseInt(subject["start"].split(",")[1]) >= 5) {
                            tableRow = this.table.querySelector(`tr:nth-of-type(${++rowIndex})`);
                            halfHourStart = true;
                        }

                        tableRow.setAttribute("filled", "true");
                        if (tableRow.nextElementSibling) tableRow.nextElementSibling.setAttribute("filled", "true");

                        const thisSubjectId = this.subjectId++;
                        const cell = tableRow.querySelector(`td:nth-child(${j+(!halfHourStart ? 2 : 1)})`);
                        cell.classList.add("class");
                        cell.setAttribute("id", thisSubjectId);
                        cell.setAttribute("subject", subject["subject"]["abbrev"]);
                        cell.setAttribute("class-group", subject["class"]);
                        cell.setAttribute("day", getDayFromIndex(j, this.daysIndex));

                        // number of rows the subject will fill
                        const rowspan = parseFloat(subject["duration"].replace("h", "").replace(",", "."))*2;
                        cell.setAttribute("rowspan", rowspan);
                        // hide cells below covered by the span
                        for (let k = 1; k < rowspan; k++) {
                            const rowOffset = rowIndex+k;
                            const row = this.table.querySelector(`tr:nth-of-type(${rowOffset})`);
                            if (row) {
                                row.setAttribute("filled", "true");
                                // if offset odd, then it is a row for the XX:30h's
                                const cellOffset = rowOffset % 2 == 0 ? j+2 : j+1; 
                                const cellToHide = row.querySelector(`td:nth-child(${cellOffset})`);
                                if (cellToHide) {
                                    cellToHide.setAttribute("id", thisSubjectId);
                                    cellToHide.setAttribute("type", "slave");
                                    cellToHide.style.display = "none";
                                }
                            }
                        }           

                        cell.style.backgroundColor = this.subjectColors[subject["subject"]["abbrev"]];
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
    },
    fixSpanningCollapse: function() {
        // add fixed height to cells with spanning that collapse
        const rows = this.table.querySelectorAll("tr");
        if (rows) {
            Array.from(rows).forEach((row, i) => {
                if (i % 2 !== 0 && row.getAttribute("filled") == "true") {
                    const cell = row.querySelector("td");
                    if (cell.offsetHeight < 27)
                        cell.style.height = "31px";
                }
            });
        }
    },
    removeSaturday: function() {
        // remove "Sábado" if it has no classes
        if (this.schedule["Sábado"] && this.schedule["Sábado"].length == 0)
            this.table.querySelectorAll("tr").forEach(row => row.children[Object.keys(this.schedule).length].style.display = "none");
    },
    trim: function(force=false) {
        if (!this.empty || force || this.limitTrimming) {
            const tableRows = this.table.querySelectorAll("tr");
            if(tableRows) {
                // top to bottom
                for (let i = 1; i < tableRows.length; i++) {
                    const row = tableRows[i];

                    if (this.limitTrimming && parseFloat(row.children[0].innerText) == this.soonest)
                        break;

                    // if row is empty
                    if (!row.getAttribute("filled")) row.style.display = "none";
                    else break;
                }
    
                // bottom to top
                for (let i = tableRows.length-1; i > 0; i--) {
                    const row = tableRows[i];

                    if (this.limitTrimming && parseFloat(row.children[0].innerText) == this.latest) {
                        tableRows[i+1]?.style.removeProperty("display"); // show the XXh30 from this hour
                        break;
                    }

                    // if row is empty
                    if (!row.getAttribute("filled")) row.style.display = "none";
                    else break;
                }
            }
        }

        this.trimmed = true;
    },
    expand: function() {
        Array.from(this.table.querySelectorAll("tr[style='display: none;']")).forEach(cell => cell.style.removeProperty("display"));
        this.trimmed = false;
    },
    highlight: function(day, hours, minutes, text) {
        let cell;
        let y = (hours-this.hours[0]+1)*2;
        const dayIndex = this.days.indexOf(getDayFromIndex(day, DAYS_INDEX));
        if (dayIndex >= 0) {
            let x = dayIndex+2;
            if (minutes >= 30) {
                y++;
                x--;
            }
    
            const row = this.table.querySelector(`tr:nth-of-type(${y})`);
            if (row) {
                cell = row.querySelector(`td:nth-of-type(${x})`);
                this.highlightCell(cell, text);
            }
        }

        return cell;
    },
    highlightCell: function(cell, text) {
        cell.classList.add("cell-now");
                
        if (!cell.innerText && text)
            cell.innerText = text;
    },
    addColumns: function(day, cols) {
        const index = this.daysIndex[day];
        if (index !== undefined) {
            // +2 because it starts on sunday and nth-of-type starts at 1
            const header = this.table.querySelector(`th:nth-of-type(${index+2})`);
            if (header) {
                header.setAttribute("colspan", cols+1);
                const tableWidth = this.table.offsetWidth-(36*2); // remove columns of hours
                const nColumns = this.table.querySelectorAll("th").length-2+cols; // remove columns of hours and add new cols
                console.log(tableWidth, this.table.querySelectorAll("th").length, nColumns);
                if (tableWidth && nColumns) {
                    const colWidth = tableWidth/nColumns;
                    header.style.width = colWidth*(cols+1)+"px";
                    for (let i = 0; i < cols; i++) {
                        // get all td from the next day, to make an insertBefore
                        const cells = this.table.querySelectorAll(`tr td:nth-of-type(${index+3})`);
                        const rows = this.table.querySelectorAll("tr:not(:first-child)");
                        if (rows) {
                            Array.from(rows).forEach((row, i) => row.insertBefore(document.createElement("td"), cells[i]));
                        }
                    }
                }
            }
        }
    },
    removeColumns: function(day, cols) {
        const index = this.daysIndex[day];
        if (index !== undefined) {
            // +2 because it starts on sunday and nth-of-type starts at 1
            const header = this.table.querySelector(`th:nth-of-type(${index+2})`);
            if (header) {
                const currentNCols = parseInt(header.getAttribute("colspan"));
                if (currentNCols && !isNaN(currentNCols) && currentNCols-cols > 0) {
                    const newCols = currentNCols-cols;
                    header.setAttribute("colspan", newCols);
                    const tableWidth = this.table.offsetWidth-(36*2); // remove columns of hours
                    const nColumns = this.table.querySelectorAll("th").length-2+(newCols-1); // remove columns of hours and add new cols
                    if (tableWidth && nColumns) {
                        const colWidth = tableWidth/nColumns;
                        header.style.width = colWidth*(newCols)+"px";
                        for (let i = cols; i > 0; i--) {
                            // get all td from the next day, to make an insertBefore
                            const cells = this.table.querySelectorAll(`tr td:nth-of-type(${index+2+i})`);
                            const rows = this.table.querySelectorAll("tr:not(:first-child)");
                            if (rows) {
                                for (let j = 0; j < rows.length; j++) {
                                    cells[j].remove();
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

const scheduleMatrix = (hours, nDays) => {
    const matrix = {};
    hours.forEach(hour => { 
        matrix[hour] = new Array(nDays);
    });
    return matrix;
}

const shuffleColors = (subjects, colors) => {
    console.log(subjects, colors);
    let indexes = [], counter = 0, subjectColors = {};
    while (indexes.length < subjects.length) {
        const index = Math.floor(Math.random() * colors.length-1) + 1;
        if (indexes.indexOf(index) === -1) {
            indexes.push(index);
            subjectColors[subjects[counter++]] = colors[index];
        }
    }

    console.log(subjectColors);
    return subjectColors;
}

const DAYS_INDEX = {
    "Domingo": 0,
    "Segunda": 1,
    "Terça": 2,
    "Quarta": 3,
    "Quinta": 4,
    "Sexta": 5,
    "Sábado": 6
}

const getDayFromIndex = (index, daysIndex) => Object.entries(daysIndex).filter(([day, i]) => i == index)[0][0];

const getWeekDay = (day, increment) => {
    let index = DAYS_INDEX[day]+increment;
    if (index == 7) index = 0;
    else if (index == -1) index = 6;

    return Object.entries(DAYS_INDEX).filter(([d, i]) => i == index)[0][0];
}

const SUBJECT_COLORS = [
    "#e1c358",
    "#7694e9",
    "#f16b6b",
    "#6fb792",
    "#cf77b0",
    "#a274df",
    "#62c1d1",
    "#e6a356"
];

// https://stackoverflow.com/a/47668070/11488921
const classesOverlap = (classA, classB) => {
    const startA = parseFloat(classA["start"].replace(",", "."));
    const durationA = parseFloat(classA["duration"].replace(",", "."));
    const endA = startA+durationA;
    const startB = parseFloat(classB["start"].replace(",", "."));
    const durationB = parseFloat(classB["duration"].replace(",", "."));
    const endB = startB+durationB;

    if (startB < startA) return endB > startA;
    else return startB < endA;
}