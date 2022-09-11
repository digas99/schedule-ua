importScripts(
    "../schedule.js",
    "extension-badge.js"
);

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.uploaded) {
        chrome.action.setBadgeText({text: '\u2B06'});
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