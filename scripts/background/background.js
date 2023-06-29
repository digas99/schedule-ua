importScripts(
    "../schedule.js",
    "extension-badge.js"
);

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.uploaded) {
        chrome.action.setBadgeText({text: '\u2B06'});
    }

    if (request.codes && request.auth) {
        sendResponse({fetch: "Waiting for subject schedules to be loaded..."});

        let counter = 0;
        const total = request.codes.length;
        const subjectsRequests = setInterval(() => {
            const code = request.codes[counter++];
            console.log("Fetching schedule for subject "+code);
            fetch("https://pacoua-api.pt/schedule/subject/"+code, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Basic ${request.auth}`
                }
            })
            .then(response => response.json())
            .then(result => chrome.storage.sync.set({[code+"_schedule"]: result["data"]}, () => {
                console.log("Stored schedule for subject "+code);
                chrome.runtime.sendMessage({loadingCode: code, progress: counter, total: total, success: true});
            }))
            .catch(error => {
                console.log("Failed to fetch schedule for subject "+code);
                chrome.runtime.sendMessage({loadingCode: code, progress: counter, total: total, success: false});
            });

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