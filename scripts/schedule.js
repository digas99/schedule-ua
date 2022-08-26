chrome.storage.sync.get(["schedule", "school_year", "semester"], result => {
    // if schedule data exists
    if (Object.keys(result).length === 3) {
        const title = document.getElementById("main").querySelector("h2");
        if (title) title.innerText += ` ${result["school_year"]} ${result["semester"]}`;
    }
});