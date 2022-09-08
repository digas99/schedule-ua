const STORAGE_KEYS = ["schedule", "school_year", "semester"];

const swapDarkMode = () => {
    document.documentElement.style.setProperty('--background-color', "#323232");
    document.documentElement.style.setProperty('--background-hover', "#666666");
    document.documentElement.style.setProperty('--font-color', "#e3e3e3");
    
    const addStyle = (styleString) => {
        const style = document.createElement('style');
        style.textContent = styleString;
        document.head.append(style);
    }
    
    addStyle(`
        body .icon {
            filter: invert(1);
            opacity: 0.8 !important;
        }
    `);

    // change icon
    const darkModeIcon = document.querySelector("#darkmode");
    if (darkModeIcon) {
        if (darkModeIcon.title === "Dark Mode") {
            darkModeIcon.title = "Light Mode";
            darkModeIcon.querySelector("img").src = "images/icons/sun.png";
        }
        else {
            darkModeIcon.title = "Dark Mode";
            darkModeIcon.querySelector("img").src = "images/icons/moon.png";
            window.location.reload();
        }
    }
}

// check for user's OS preferences
// https://stackoverflow.com/a/57795518/11488921
if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches)
    swapDarkMode();

chrome.storage.sync.get("darkmode", result => {
    if (result["darkmode"]) swapDarkMode();
});