importScripts(
    "../schedule.js",
    "extension-badge.js"
);

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.uploaded) {
        chrome.action.setBadgeText({text: '\u2B06'});
    }

    if (request.codes && request.auth) {
        let counter = 0;
        const subjectsRequests = setInterval(() => {
            const code = request.codes[counter++];
            fetch("https://pacoua-api.pt/schedule/subject/"+code, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Basic ${request.auth}`
                }
            })
            .then(response => response.json())
            .then(result => chrome.storage.sync.set({[code+"_schedule"]: result["data"]}, () => {
                console.log("Stored schedule for subject "+code);
                chrome.runtime.sendMessage({loadingCode: code}, response => {
                    if (response.code == request.codes[request.codes.length-1] && counter == request.codes.length)
                        setTimeout(() => chrome.runtime.sendMessage({bottomInfo: "close"}), 500);
                });
            }));

            if (counter == request.codes.length) clearInterval(subjectsRequests);
        }, 2000);
    }
});

const updateBadge = () => {
    chrome.storage.sync.get("extension_badge", result => {
        if (result["extension_badge"] == false) {
            chrome.action.setBadgeText({text: ''});

            // clear any related alarms
            ["update-class-badge"]
                .forEach(alarm => chrome.alarms.clear(alarm));
        }
        else
            handleBadgeIcon(result["extension_badge"]);
    });
}

updateBadge();

chrome.alarms.onAlarm.addListener(alarm => {
    if (alarm.name === "update-class-badge")
        updateBadge();
});