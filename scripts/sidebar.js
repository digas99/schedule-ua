window.addEventListener("click", e => {
    const target = e.target;

    chrome.storage.sync.get("color_schema", result => {
    if (target.closest("#exit"))
        chrome.storage.sync.remove([...SCHEDULE_CONFIGS, "subject_colors"]).then(() => window.location.href = `/login.html?theme=${result["color_schema"]}`);

    if (target.closest("#schedule") && !target.closest("#schedule").classList.contains("button-inactive")) window.location.href = `/home.html?theme=${result["color_schema"]}`;

    if (target.closest("#settings") && !target.closest("#settings").classList.contains("button-inactive")) window.location.href = `/settings.html?theme=${result["color_schema"]}`;

    if (target.closest("#about") && !target.closest("#about").classList.contains("button-inactive")) window.location.href = `/about.html?theme=${result["color_schema"]}`;

    if (target.closest("#darkmode")) swapColorSchema(target.closest("#darkmode").title);
    });
});