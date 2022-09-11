const handleBadgeIcon = selector => {
    chrome.storage.sync.get(["schedule", "subject_colors"], result => {      
        switch(selector) {
            case undefined: // make this the default option
            case "Next/Current Class":
                if (result["schedule"]) {
                    const now = new Date();
                    const todaySubjects = result["schedule"][getDayFromIndex(now.getDay(), DAYS_INDEX)];
                    updateClassBadge(todaySubjects, result["subject_colors"], parseInt(now.getHours()), parseInt(now.getMinutes()));

                    chrome.alarms.create("update-class-badge", {
                        delayInMinutes: 1,
                        periodInMinutes: 1
                    });
                }
                break;
        }

        chrome.storage.sync.set({"extension_badge": selector});
    });
}

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