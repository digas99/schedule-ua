(() => {
    chrome.storage.sync.get("paco_buttons", result => {
        if (result["paco_buttons"] !== false) {
            const parseSchedule = table => {
                const data = {
                    "schedule": {
                        "Segunda": [],"Terça": [],"Quarta": [],"Quinta": [],"Sexta": [],"Sábado": []
                    }
                };
        
                if (table) {
                    // info
                    const scheduleInfoElem = table.querySelector("tr").children[0];
                    // subject schedule
                    if (scheduleInfoElem.childNodes.length == 1) {
                        const scheduleInfo = scheduleInfoElem.childNodes[0].wholeText;
                        data["school_year"] = scheduleInfo.split(" - ")[3],
                        data["semester"] = Number(scheduleInfo.split(" - ")[2].split("º")[0]);
                    }
                    // student schedule
                    else {
                        const scheduleInfo = scheduleInfoElem.childNodes[2].wholeText;
                        data["school_year"] = scheduleInfo.split(" - ")[1].split("AnoLectivo: ")[1];
                        data["semester"] = Number(scheduleInfo.split(" - ")[2].split("º")[0]);
                    }
        
                    // subjects
                    Array.from(table.querySelectorAll(".horario_turma")).forEach(elem => {
                        const titleData = elem.title.split("\n");
                        const weekday = data["schedule"][titleData[1].split("DIA DA SEMANA: ")[1]];
                        weekday.push({
                            "subject": {
                                "name": titleData[0],
                                "abbrev": elem.childNodes[0].wholeText.split(" ")[0].replace("\n", "")
                            },
                            "start": titleData[2].split("INÍCIO: ")[1],
                            "duration": titleData[3].split("DURAÇÃO: ")[1],
                            "capacity": Number(titleData[4].split("LOTAÇÃO: ")[1].split(" alunos")[0]),
                            "class": elem.childNodes[0].wholeText.split(" ")[2],
                            "room": elem.childNodes[4].wholeText.replace(/[()]/g, "")
                        });
                    });    
                }
        
                return data;
            }
            
            const scheduleTable = document.querySelector("#template_main > table");
            if (scheduleTable) {
                const schedule = parseSchedule(scheduleTable);
        
                const wrapper = document.createElement("div");
                scheduleTable.appendChild(wrapper);
                wrapper.id = "schedua-buttons";
                const pacoDownload = document.createElement("img");
                wrapper.appendChild(pacoDownload);
                pacoDownload.src = "https://i.imgur.com/0SkbMLO.png";
                pacoDownload.title = "SchedUA - Download Schedule Configuration";
                pacoDownload.addEventListener("click", () => {
                    const blob = new Blob([JSON.stringify(schedule, null, 2)], {type: "application/json"});
                    saveAs(blob, `schedua-schedule_${schedule["school_year"]}_${schedule["semester"]}.json`);
                });
                const pacoUpload = document.createElement("img");
                wrapper.appendChild(pacoUpload);
                pacoUpload.src = "https://i.imgur.com/p5HAMnj.png";
                pacoUpload.title = "SchedUA - Upload Schedule Configuration";
                pacoUpload.addEventListener("click", () => {
                    chrome.storage.sync.set(schedule)
                        .then(() => chrome.runtime.sendMessage({uploaded:"schedule"}));
                });
            }
        }
    });
})();