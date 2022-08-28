const Schedule = function(container, config) {
    this.container = container;

    this.hours = config["hours"];
    this.days = config["days"];
    this.schedule = config["schedule"];
    this.subjectColors = config["colors"];
    
    this.matrix = scheduleMatrix(this.hours, this.days.length);
}

Schedule.prototype = {
    create: function() {
        this.createTable();
        if (!this.subjectColors) this.setColors();
        this.populateMatrix();
        this.fill();
        this.fix();
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
        Object.entries(this.schedule).forEach(([day, subjects]) => {
            subjects.forEach(subject => {
                const start = Number(subject["start"].replace("h", ""));
                this.matrix[start][DAYS_INDEX[day]] = subject;
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
    // hide certain cells to compensate for the space taken by the rowspan
    fix: function() {
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
    "Segunda": 0,
    "Terça": 1,
    "Quarta": 2,
    "Quinta": 3,
    "Sexta": 4,
    "Sábado": 5,
    "Domingo": 6
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