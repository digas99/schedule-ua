window.addEventListener("click", e => {
    const target = e.target;

    if (target.closest("#exit"))
        chrome.storage.sync.remove([...STORAGE_KEYS, "subject_colors"]).then(() => window.location.href = "/login.html");

    if (target.closest("#schedule") && !target.closest("#schedule").classList.contains("button-inactive")) window.location.href = "/home.html";

    if (target.closest("#settings") && !target.closest("#settings").classList.contains("button-inactive")) window.location.href = "/settings.html";

    if (target.closest("#about") && !target.closest("#about").classList.contains("button-inactive")) window.location.href = "/about.html";
});