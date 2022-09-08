const STORAGE_KEYS = ["schedule", "school_year", "semester"];

const colorSchemaSetup = (config) => {
    document.documentElement.style.setProperty('--background-color', config["backgroundColor"]);
    document.documentElement.style.setProperty('--background-hover', config["backgroundHover"]);
    document.documentElement.style.setProperty('--font-color', config["fontColor"]);
    document.documentElement.style.setProperty('--table-borders', config["tableBorders"]);

    const addStyle = (styleString) => {
        const style = document.createElement('style');
        style.textContent = styleString;
        document.head.append(style);
    }
    
    if (config["style"])
        addStyle(config["style"]);
}

const swapDarkMode = () => {
    // change icon
    const darkModeIcon = document.querySelector("#darkmode");
    const colorSchema = document.querySelector("#color-schema");
    if (darkModeIcon) {
        let options;

        if (darkModeIcon.title === "Dark Mode") {
            darkModeIcon.title = "Light Mode";
            darkModeIcon.querySelector("img").src = "images/icons/sun.png";
        
            if (colorSchema) colorSchema.value = "Dark Mode";

            options = {
                backgroundColor: "#323232",
                backgroundHover: "#666666",
                fontColor: "#e3e3e3",
                tableBorders: "#838383",
                style: `
                    body .icon {
                        filter: invert(1) !important;
                        opacity: 0.8 !important;
                    }
                `
            };
        }
        else {
            darkModeIcon.title = "Dark Mode";
            darkModeIcon.querySelector("img").src = "images/icons/moon.png";

            if (colorSchema) colorSchema.value = "Light Mode";

            options = {
                backgroundColor: "white",
                backgroundHover: "#e1e1e1",
                fontColor: "#585858",
                tableBorders: "#dddddd",
                style: `
                    body .icon {
                        filter: unset !important;
                        opacity: 0.5 !important;
                    }
                `
            };
        }

        colorSchemaSetup(options);
    }
}

// check for user's OS preferences
// https://stackoverflow.com/a/57795518/11488921
if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches)
    swapDarkMode();

chrome.storage.sync.get("darkmode", result => {
    if (result["darkmode"]) swapDarkMode();
});

const loading = text => {
    const wrapper = document.createElement("div");
    wrapper.classList.add("loading");

    // add gray back
    wrapper.appendChild(document.createElement("div"));

    // add popup
    const textWrapper = document.createElement("div");
    wrapper.appendChild(textWrapper);
    const textNode = document.createElement("div");
    textWrapper.appendChild(textNode);
    textNode.appendChild(document.createTextNode(text));
    
    return wrapper;
}