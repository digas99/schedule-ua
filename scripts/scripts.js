const SCHEDULE_CONFIGS = ["schedule", "school_year", "semester"];

const SETTINGS_KEYS = ["subjects", "subject_colors", "trimmed", "email", "selected", "paco_buttons", "highlight_now", "limit_trimming", "color_schema", "class_popup_info"];

const setupColorSchema = (config) => {
    ["background-color", "background-hover", "font-color", "table-borders", "active", "checkbox-ball", "checkbox-background", "select-font"].forEach(property => {
        const split = property.split("-");
        let key = split[0];
        if (split[1])
            key += split[1].charAt(0).toUpperCase() + split[1].slice(1);
        if (config[key])
            document.documentElement.style.setProperty('--'+property, config[key]);
    });
    
    if (config["styles"]) {
        config["styles"].forEach(styleString => {
            const style = document.createElement('style');
            style.textContent = styleString;
            document.head.append(style);
        });
    }
}

const swapColorSchema = schema => {
    let options;
    const darkModeIcon = document.querySelector("#darkmode");
    const colorSchema = document.querySelector("#color-schema");
    switch(schema) {
        case "Dark Mode":
            if (darkModeIcon) {
                darkModeIcon.title = "Light Mode";
                darkModeIcon.querySelector("img").src = "images/icons/sun.png";
            }

            options = {
                backgroundColor: "#323232",
                backgroundHover: "#666666",
                fontColor: "#e3e3e3",
                tableBorders: "#838383",
                active: "#9c9c9c",
                checkboxBall: "#5e5e5e",
                checkboxBackground: "#7a7a7a",
                selectFont: "#e3e3e3",
                styles: [`
                    body .icon {
                        filter: invert(1) !important;
                        opacity: 0.8 !important;
                    }
                `]
            };
            break;
        case "Light Mode":
            if (darkModeIcon) {
                darkModeIcon.title = "Dark Mode";
                darkModeIcon.querySelector("img").src = "images/icons/moon.png";
            }
    
            options = {
                backgroundColor: "white",
                backgroundHover: "#e1e1e1",
                fontColor: "#585858",
                tableBorders: "#dddddd",
                active: "#9c9c9c",
                checkboxBall: "#5e5e5e",
                checkboxBackground: "#7a7a7a",
                selectFont: "white",
                styles: [`
                    body .icon {
                        filter: unset !important;
                        opacity: 0.5 !important;
                    }
                `]
            };
            break;
        case "System":
            if (window.matchMedia)
                swapColorSchema(window.matchMedia('(prefers-color-scheme: dark)').matches ? "Dark Mode" : "Light Mode");
            else
                window.location.reload();
            break;
        case "Dark High Contrast":
            if (darkModeIcon) {
                darkModeIcon.title = "Light Mode";
                darkModeIcon.querySelector("img").src = "images/icons/sun.png";
            }

            options = {
                backgroundColor: "black",
                fontColor: "white",
                backgroundHover: "#666666",
                tableBorders: "white",
                active: "#9c9c9c",
                checkboxBall: "white",
                checkboxBackground: "#b2b2b2",
                selectFont: "black",
                styles: [`
                    body .icon {
                        filter: invert(1) !important;
                        opacity: 1 !important;
                    }
                `]
            }
            break;
        case "Light High Contrast":
            if (darkModeIcon) {
                darkModeIcon.title = "Dark Mode";
                darkModeIcon.querySelector("img").src = "images/icons/moon.png";
            }

            options = {
                backgroundColor: "white",
                backgroundHover: "#e1e1e1",
                fontColor: "black",
                tableBorders: "black",
                active: "black",
                checkboxBall: "black",
                checkboxBackground: "#484848",
                selectFont: "white",
                styles: [`
                    body .icon {
                        filter: unset !important;
                        opacity: 1 !important;
                    }
                `]
            }
            break;
        case "Sapphire":
            if (darkModeIcon) {
                darkModeIcon.title = "Light Mode";
                darkModeIcon.querySelector("img").src = "images/icons/sun.png";
            }

            options = {
                backgroundColor: "#1f234c",
                backgroundHover: "#364672",
                fontColor: "#b9ffe6",
                tableBorders: "#b9ffe6",
                active: "#69ab93",
                checkboxBall: "#b9ffe6",
                checkboxBackground: "#69ab93",
                selectFont: "black",
                styles: [`
                    body .icon {
                        filter: invert(86%) sepia(34%) saturate(277%) hue-rotate(96deg) brightness(104%) contrast(101%) !important;
                        opacity: 0.8 !important;
                    }
                `]
            }
            break;
        case "Ambar":
            if (darkModeIcon) {
                darkModeIcon.title = "Light Mode";
                darkModeIcon.querySelector("img").src = "images/icons/sun.png";
            }

            options = {
                backgroundColor: "#2c2c2c",
                backgroundHover: "#766648",
                fontColor: "#ecc377",
                tableBorders: "#ecc377",
                active: "#766648",
                checkboxBall: "#ecc377",
                checkboxBackground: "#766648",
                selectFont: "black",
                styles: [`
                    body .icon {
                        filter: invert(81%) sepia(15%) saturate(1079%) hue-rotate(357deg) brightness(97%) contrast(91%) !important;
                        opacity: 0.8 !important;
                    }
                `]
            }
            break;
    }

    if (colorSchema) colorSchema.value = schema;

    if (options) setupColorSchema(options);

    chrome.storage.sync.set({"color_schema": schema});
}

// check for color theme from url
const urlParams = new URLSearchParams(window.location.search);
if (urlParams.get('theme'))
    swapColorSchema(urlParams.get('theme'));

chrome.storage.sync.get(["color_schema", "schedule", "subject_colors"], result => {
    if (!urlParams.get('theme')) {
        if (result["color_schema"] !== undefined && result["color_schema"] !== "System")
            swapColorSchema(result["color_schema"]);
        else {
            // check for user's OS preferences
            // https://stackoverflow.com/a/57795518/11488921
            if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches)
                swapColorSchema("Dark Mode");
        }
    }

    // put closest class in the badge text
    if (result["schedule"]) {
        const now = new Date();
        const todaySubjects = result["schedule"][getDayFromIndex(now.getDay(), DAYS_INDEX)];
        updateClassBadge(todaySubjects, result["subject_colors"], parseInt(now.getHours()), parseInt(now.getMinutes()));
    }
});    


const updateClassBadge = (todaySubjects, subjectColors, hours, minutes) => {
    if (todaySubjects && todaySubjects.length > 0) {
        let closestClass = todaySubjects[0];
        todaySubjects.forEach(subject => {
            const time = parseFloat(hours+"."+(minutes*100/60));
            const classStart = parseFloat(subject["start"].replaceAll(",", "."));
            const classEnd = classStart+parseFloat(subject["duration"].replaceAll(",", "."));
            
            if (time >= classStart && time <= classEnd) closestClass = subject;

            if (time > classEnd) closestClass = null;
        });

        if (closestClass) {
            const subjectAbbrev = closestClass["subject"]["abbrev"];
            chrome.action.setBadgeText({text: subjectAbbrev});
            if (subjectColors) {
                const subjectColor = subjectColors[subjectAbbrev];
                if (subjectColor)
                    chrome.action.setBadgeBackgroundColor({color: subjectColor});
            }
        }
        else
            chrome.action.setBadgeText({text: ""});
    }
}

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