(() => {
    const ignoredWords = ["o", "a", "os", "as", "de", "da", "do", "das", "dos", "e", "na", "no", "nas", "nos", "em"];

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
                    let scheduleType, subjectsList; 

                    // subject schedule
                    if (scheduleInfoElem.childNodes.length == 1) {
                        scheduleType = "subject";
                        const scheduleInfo = scheduleInfoElem.childNodes[0].wholeText;
                        data["school_year"] = scheduleInfo.split(" - ")[3],
                        data["semester"] = Number(scheduleInfo.split(" - ")[2].split("º")[0]);
                    }
                    // student schedule
                    else {
                        scheduleType = "student";
                        const scheduleInfo = scheduleInfoElem.childNodes[2].wholeText;
                        data["school_year"] = scheduleInfo.split(" - ")[1].split("AnoLectivo: ")[1];
                        data["semester"] = Number(scheduleInfo.split(" - ")[2].split("º")[0]);

                        // subjects list
                        subjectsList = Array.from(new Set(Array.from(table.nextElementSibling.querySelectorAll("tr > td:nth-of-type(2)")).map(info => info.innerText.split(" (")[0].trim())));
                    }
        
                    // subjects
                    Array.from(table.querySelectorAll(".horario_turma")).forEach(elem => {
                        const titleData = elem.title.split("\n");
                        const weekday = data["schedule"][titleData[1].split("DIA DA SEMANA: ")[1]];
                        let subject = {};
                        if (scheduleType === "subject") {
                            subject = {
                                "subject": {
                                    "name": titleData[0],
                                    "abbrev": titleData[0].split(" ").reduce((abbrev, string) => abbrev+=(!ignoredWords.includes(string.toLowerCase()) ? string.charAt(0) : ""), "")
                                },
                                "start": titleData[2].split("INÍCIO: ")[1],
                                "duration": titleData[3].split("DURAÇÃO: ")[1],
                                "capacity": Number(titleData[4].split("LOTAÇÃO: ")[1].split(" alunos")[0]),
                                "class": elem.childNodes[0].wholeText.replace(/[,(]/g, ""),
                                "room": elem.childNodes[elem.childNodes.length-1].wholeText.replace(/[()]/g, "")
                            }
                        }
                        else if (scheduleType === "student") {
                            subject = {
                                "subject": {
                                    "name": titleData[0],
                                    "abbrev": elem.childNodes[0].wholeText.split(" ")[0].replace("\n", ""),
                                    "code": subjectsList.filter(subject => subject.split(" - ")[1] === titleData[0])[0].split(" - ")[0]
                                },
                                "start": titleData[2].split("INÍCIO: ")[1],
                                "duration": titleData[3].split("DURAÇÃO: ")[1],
                                "capacity": Number(titleData[4].split("LOTAÇÃO: ")[1].split(" alunos")[0]),
                                "class": elem.childNodes[0].wholeText.split(" ")[2].replace(/[,(]/g, ""),
                                "room": elem.childNodes[elem.childNodes.length-1].wholeText.replace(/[()]/g, "")
                            }
                        }
                        
                        weekday.push(subject);
                    });    
                }
        
                return data;
            }
            
            const createMessage = msg => {
                document.querySelector(".message")?.remove();
                const message = document.createElement("message");
                message.classList.add("message");
                message.appendChild(document.createTextNode(msg));
                setTimeout(() => message.remove(), 2000);
                return message;
            }

            const scheduleTable = document.querySelector("#template_main > table") ? document.querySelector("#template_main > table")  : document.querySelector("table");
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
                    wrapper.appendChild(createMessage("Download has started!"));
                });
                const pacoUpload = document.createElement("img");
                wrapper.appendChild(pacoUpload);
                pacoUpload.src = "https://i.imgur.com/p5HAMnj.png";
                pacoUpload.title = "SchedUA - Upload Schedule Configuration";
                pacoUpload.addEventListener("click", () => {
                    chrome.storage.sync.set(schedule)
                        .then(() => {
                            chrome.runtime.sendMessage({uploaded:"schedule"});
                            wrapper.appendChild(createMessage("Uploaded! Check the extension popup."));
                        });
                });
            }
        }
    });
})();