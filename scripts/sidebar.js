window.addEventListener("click", e => {
    const target = e.target;

    if (target.closest("#exit"))
        chrome.storage.sync.remove(STORAGE_KEYS).then(() => window.location.href = "/popup.html");

    if (target.closest("#schedule") && !target.closest("#schedule").classList.contains("button-inactive")) window.location.href = "/home.html";

    if (target.closest("#settings") && !target.closest("#settings").classList.contains("button-inactive")) window.location.href = "/settings.html";
});