const Schedule = function(container, config) {
    this.container = container;

    this.hours = config["hours"];
    this.days = config["days"];
    this.schedule = config["schedule"];
    this.subjectColors = config["colors"];
    this.trimmed = config["trimmed"];

    if (Object.values(this.schedule)[0] == undefined || Object.values(this.schedule).flat(1).length == 0) this.empty = true;

    this.matrix = scheduleMatrix(this.hours, this.days.length);
}

Schedule.prototype = {
    create: function() {
        this.createTable();

        if (!this.subjectColors)
            this.setColors();

        this.populateMatrix();
        this.fill();

        this.fixSpanning();

        if (this.trimmed)
            this.trim();

        if (this.days.length == 1)
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
        Object.entries(this.schedule).sort(([a_day, a_subject], [b_day, b_subject]) => DAYS_INDEX[a_day] - DAYS_INDEX[b_day])
            .forEach(([day, subjects], i) => {
                subjects?.forEach(subject => {
                    const start = Number(subject["start"].replace("h", ""));
                    this.matrix[start][i] = subject;
                });
            });
    },
    setColors: function() {
        this.subjects = [...new Set(Object.entries(this.schedule).map(([key, value]) => value.map(obj => obj["subject"]["abbrev"])).flat(1))];
        this.subjectColors = shuffleColors(this.subjects, SUBJECT_COLORS);
    },
    fill: function() {
        // iterate through filled matrix
        this.spans = {};
        for (let i = 1; i <= this.hours.length*2+1; i++) {
            this.spans[i] = [];
        }

        Object.entries(Object.entries(this.matrix)).forEach(([i, [hour, subjects]]) => {
            const currentTableIndex = (Number(i)+1)*2;
            const tableRow = this.table.querySelector(`tr:nth-of-type(${currentTableIndex})`);
            if (tableRow) {
                // fill the row with the subjects
                // iterate cells
                for (let j = 0; j < subjects.length; j++) {
                    const subject = subjects[j];
                    if (subject) {
                        tableRow.setAttribute("filled", "true");
                        if (tableRow.nextElementSibling) tableRow.nextElementSibling.setAttribute("filled", "true");

                        const cell = tableRow.querySelector(`td:nth-child(${j+2})`);
                        cell.classList.add("class");
                        cell.setAttribute("subject", subject["subject"]["abbrev"]);
                        cell.setAttribute("day", getDayFromIndex(j+1));

                        // number of rows the subject will fill
                        const rowspan = parseFloat(subject["duration"].replace("h", "").replace(",", "."))*2;
                        cell.setAttribute("rowspan", rowspan);

                        if (rowspan > 2)
                            this.spans[currentTableIndex+1].push(j+2);                

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
    fixSpanning: function() {
        // hide certain cells to compensate for the space taken by the rowspan
        for (let i = 1; i <= this.hours.length*2+1; i++) {
            if (this.spans[i].length > 0) {
                const tableRow = this.table.querySelector(`tr:nth-of-type(${i+1})`);
                if (tableRow) {
                    // identify row as indirectly filled
                    tableRow.setAttribute("filled", "true");
                    if (tableRow.nextElementSibling) tableRow.nextElementSibling.setAttribute("filled", "true");

                    let counter = 0, control = 0;
                    while(1) {
                        const cell = tableRow.querySelector(`td:nth-child(${this.spans[i][counter]})`);
                        // only hide cells that are empty
                        if (cell && !cell.innerText) {
                            cell.style.display = "none";
                            counter++;
                        }             
                        
                        // break loop if the correct number os cells have been hidden
                        // (or when there aren't any more cells left, to prevent an infinite loop)
                        if (this.spans[i].length == counter || control++ >= tableRow.childElementCount) break;
                    }
                }
            }
        }
    },
    fixSpanningCollapse: function() {
        // add fixed height to cells with spanning that collapse
        const rows = this.table.querySelectorAll("tr[filled='true']");
        if (rows) {
            Array.from(rows).forEach(row => {
                Array.from(row.querySelectorAll("td")).forEach(cell => {
                    const cellHeight = parseInt(getComputedStyle(cell)["height"]);
                    if (cellHeight > 0 && cellHeight < 21) cell.style.height = "21px";
                });
            });
        }
    },
    removeSaturday: function() {
        // remove "Sábado" if it has no classes
        if (this.schedule["Sábado"] && this.schedule["Sábado"].length == 0)
            this.table.querySelectorAll("tr").forEach(row => row.children[Object.keys(this.schedule).length].style.display = "none");
    },
    trim: function(force=false) {
        if (!this.empty || force) {
            const tableRows = this.table.querySelectorAll("tr");
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

        this.trimmed = true;
    },
    expand: function() {
        Array.from(this.table.querySelectorAll("tr[style='display: none;']")).forEach(cell => cell.style.removeProperty("display"));
        this.trimmed = false;
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
    let indexes = [], counter = 0, subjectColors = {};
    while (indexes.length < subjects.length) {
        const index = Math.floor(Math.random() * colors.length-1) + 1;
        if (indexes.indexOf(index) === -1) {
            indexes.push(index);
            subjectColors[subjects[counter++]] = colors[index];
        }
    }
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

const getDayFromIndex = index => Object.entries(DAYS_INDEX).filter(([day, i]) => i == index)[0][0];

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
    "#62c1d1"
];