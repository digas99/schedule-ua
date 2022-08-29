chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.uploaded) {
        chrome.action.setBadgeText({text: '\u2B06'});
    }
});