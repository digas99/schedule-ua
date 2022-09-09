chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.uploaded) {
        chrome.action.setBadgeText({text: '\u2B06'});
    }
});

chrome.storage.sync.get(["schedule", "subject_colors"], result => {
    // put closest class in the badge text
    if (result["schedule"]) {

        const updateClass = () => {
            const now = new Date();
            const todaySubjects = result["schedule"][getDayFromIndex(now.getDay(), DAYS_INDEX)];
            if (todaySubjects && todaySubjects.length > 0) {
                let closestClass = todaySubjects[0];
                todaySubjects.forEach(subject => {
                    const nowHours = parseInt(now.getHours());
                    const nowMinutes = parseInt(now.getMinutes());
                    const time = parseFloat(nowHours+"."+(nowMinutes*100/60));
                    const classStart = parseFloat(subject["start"].replaceAll(",", "."));
                    const classEnd = classStart+parseFloat(subject["duration"]);
                    
                    if (time >= classStart && time <= classEnd) closestClass = subject;
    
                    if (time > classEnd) closestClass = null;
                });

                console.log(closestClass);
    
                if (closestClass) {
                    const subjectAbbrev = closestClass["subject"]["abbrev"];
                    chrome.action.setBadgeText({text: subjectAbbrev});
                    if (result["subject_colors"]) {
                        const subjectColor = result["subject_colors"][subjectAbbrev];
                        if (subjectColor)
                            chrome.action.setBadgeBackgroundColor({color: subjectColor});
                    }
                }
                else
                    chrome.action.setBadgeText({text: ""});
            }
        }

        updateClass();

        setInterval(() => updateClass, 60000);
    }
});

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