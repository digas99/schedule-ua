chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.uploaded) {
        chrome.action.setBadgeText({text: '\u2B06'});
    }
});

const updateClass = () => {
    chrome.storage.sync.get(["schedule", "subject_colors"], result => {
        // put closest class in the badge text
        if (result["schedule"]) {
            const now = new Date();
            const todaySubjects = result["schedule"][getDayFromIndex(now.getDay(), DAYS_INDEX)];
            updateClassBadge(todaySubjects, result["subject_colors"], parseInt(now.getHours()), parseInt(now.getMinutes()));
        }
    });
}

updateClass();

chrome.alarms.create("update-class-badge", {delayInMinutes: 1});

chrome.alarms.onAlarm.addListener(alarm => {
    if (alarm.name === "update-class-badge")
        updateClass();
});

const updateClassBadge = (todaySubjects, subjectColors, hours, minutes) => {
    if (todaySubjects && todaySubjects.length > 0) {
        let closestClass = todaySubjects[0];
        todaySubjects.forEach(subject => {
            const time = parseFloat(hours+"."+(minutes*100/60));
            const classStart = parseFloat(subject["start"].replaceAll(",", "."));
            const classEnd = classStart+parseFloat(subject["duration"].replaceAll(",", "."));

            if (time >= classStart && time <= classEnd) closestClass = subject;

            if (time > classEnd) closestClass = null;
        });

        if (closestClass) {
            const subjectAbbrev = closestClass["subject"]["abbrev"];
            chrome.action.setBadgeText({text: subjectAbbrev});
            if (subjectColors) {
                const subjectColor = subjectColors[subjectAbbrev];
                if (subjectColor)
                    chrome.action.setBadgeBackgroundColor({color: subjectColor});
            }
        }
        else
            chrome.action.setBadgeText({text: ""});
    }
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