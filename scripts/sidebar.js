window.addEventListener("click", e => {
    const target = e.target;

    chrome.storage.sync.get("color_schema", result => {
        if (target.closest("#exit"))
            chrome.storage.sync.remove([...SCHEDULE_CONFIGS, "subject_colors"]).then(() => window.location.href = `/login.html?theme=${result["color_schema"]}`);

        if (target.closest("#schedule") && !target.closest("#schedule").classList.contains("button-inactive")) window.location.href = `/home.html?theme=${result["color_schema"]}`;

        if (target.closest("#settings") && !target.closest("#settings").classList.contains("button-inactive")) window.location.href = `/settings.html?theme=${result["color_schema"]}`;

        if (target.closest("#about") && !target.closest("#about").classList.contains("button-inactive")) window.location.href = `/about.html?theme=${result["color_schema"]}`;
    });

    if (target.closest("#darkmode")) swapColorSchema(target.closest("#darkmode").title);

    if (target.closest("#list-subjects") && !target.closest("#list-subjects").classList.contains("button-inactive") && document.getElementById("main") && mySchedule.schedule) {
        let floatingInfoPanel = document.querySelector(".floating-info-panel");
        if (!floatingInfoPanel) {
            floatingInfoPanel = document.createElement("div");
            document.getElementById("main").appendChild(floatingInfoPanel);
            floatingInfoPanel.classList.add("floating-info-panel");
            const sortedSchedule = Object.entries(mySchedule.schedule)
                .filter(([, value]) => value && value.length > 0)
                .sort(([a,], [b,]) => mySchedule.daysIndex[a] - mySchedule.daysIndex[b])
                .reduce((acc, [key, value]) => ({...acc, [key]: value}), {});

            const panel = infoPanel(sortedSchedule);
            floatingInfoPanel.appendChild(panel);

            floatingInfoPanel.style.transition = "0.3s";
            floatingInfoPanel.style.right = `-${floatingInfoPanel.offsetWidth}px`;
            setTimeout(() => {
                floatingInfoPanel.style.right = "51px";
                setTimeout(() => floatingInfoPanel.style.removeProperty("transition"), 300);
            }, 50);

        }
        else {
            floatingInfoPanel.style.transition = "0.3s";
            floatingInfoPanel.style.right = `-${floatingInfoPanel.offsetWidth}px`;
            setTimeout(() => floatingInfoPanel.remove(), 300);
        }
    }
});