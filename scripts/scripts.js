const SCHEDULE_CONFIGS = ["schedule", "school_year", "semester"];

const SETTINGS_KEYS = ["subjects", "subject_colors", "trimmed", "email", "selected", "paco_buttons", "highlight_now", "limit_trimming", "color_schema", "class_popup_info"];

const setupColorSchema = (config) => {
    ["background-color", "background-hover", "font-color", "table-borders", "active", "checkbox-ball", "checkbox-background"].forEach(property => {
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
                checkboxBall: "#5e5e5e",
                checkboxBackground: "#7a7a7a",
                styles: [`
                    body .icon {
                        filter: invert(1) !important;
                        opacity: 0.8 !important;
                    }
                `]
            }
            break;
        case "Ligh High Contrast":
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
                styles: [`
                    body .icon {
                        filter: unset !important;
                        opacity: 1 !important;
                    }
                `]
            }
            break;
    }

    if (colorSchema) colorSchema.value = schema;

    if (options) setupColorSchema(options);

    chrome.storage.sync.set({"color_schema": schema});
}

// check for user's OS preferences
// https://stackoverflow.com/a/57795518/11488921
if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches)
    swapColorSchema("Dark Mode");

chrome.storage.sync.get("color_schema", result => {
    if (result["color_schema"] !== undefined || result["color_schema"] !== "System")
        swapColorSchema(result["color_schema"]);
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