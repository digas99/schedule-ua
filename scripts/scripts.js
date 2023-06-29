const SCHEDULE_CONFIGS = ["schedule", "school_year", "semester"];

const DEFAULT_TRUE_SETTINGS = ["paco_buttons", "highlight_now", "limit_trimming", "class_popup_info", "extension_badge"];
const DEFAULT_FALSE_SETTINGS = ["highlight_mouse_target_cell"];
const SETTINGS_KEYS = ["subjects", "subject_colors", "trimmed", "email", "selected", "color_schema", ...DEFAULT_TRUE_SETTINGS, ...DEFAULT_FALSE_SETTINGS];

const MESSAGE_TAGS = ["missing_subject_schedules"];

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
        case "System":
            if (window.matchMedia)
                swapColorSchema(window.matchMedia('(prefers-color-scheme: dark)').matches ? "Dark Mode" : "Light Mode");
            else
                window.location.reload();
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

chrome.storage.sync.get(["color_schema", "extension_badge"], result => {
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

    handleBadgeIcon(result["extension_badge"])
});

const loading = text => {
    const wrapper = popup();
    wrapper.classList.add("loading");
    const popupContainer = wrapper.querySelector("div:nth-child(2)");

    const textNode = document.createElement("div");
    popupContainer.appendChild(textNode);
    textNode.appendChild(document.createTextNode(text));

    return wrapper;
}

const popup = settings => {
    const wrapper = document.createElement("div");
    wrapper.classList.add("popup");

    // add gray back
    const grayBack = document.createElement("div");
    wrapper.appendChild(grayBack);
    grayBack.addEventListener("click", () => wrapper.remove());

    // popup container
    const container = document.createElement("div");
    wrapper.appendChild(container);

    if (settings) {
        if (settings["title"]) {
            const title = document.createElement("div");
            container.appendChild(title);
            title.appendChild(document.createTextNode(settings["title"]));    
        }

        if (settings["close"]) {
            const close = document.createElement("div");
            container.appendChild(close);
            close.classList.add("cross", "clickable");
            for (let i = 0; i < 2; i++)
                close.appendChild(document.createElement("div"));

            close.addEventListener("click", () => wrapper.remove());
        }
    }

    return wrapper;
}

const bottomInfo = (text, subtext) => {
    const wrapper = document.createElement("div");
    wrapper.classList.add("bottom-info");

    // primary wrapper
    const primary = document.createElement("div");
    wrapper.appendChild(primary);
    const img = document.createElement("img");
    primary.appendChild(img);
    img.classList.add("icon");
    img.src = "images/icons/refresh.png";
    let degs = 0;
    setInterval(() => img.style.rotate = ((degs+=20)%360)+"deg", 75);

    const textWrapper = document.createElement("div");
    textWrapper.classList.add("primary-wrapper");
    primary.appendChild(textWrapper);
    const textNode = document.createElement("div");
    textWrapper.appendChild(textNode);
    textNode.appendChild(document.createTextNode(text));

    // close button
    const close = document.createElement("div");
    primary.appendChild(close);
    close.classList.add("cross", "clickable");
    for (let i = 0; i < 2; i++)
        close.appendChild(document.createElement("div"));
    
    wrapper.addEventListener("click", e => {
        if (e.target.closest(".cross")) {
            wrapper.remove();
            chrome.storage.sync.get("messages", result => {
                const messages = result["messages"] || {};
                messages["missing_subject_schedules"] = false;
                chrome.storage.sync.set({"messages": messages});
            });
        }
    });

    // secondary wrapper
    let secondary;
    if (subtext) {
        secondary = document.createElement("div");
        secondary.style.display = "none";
        secondary.classList.add("secondary-wrapper");
        wrapper.appendChild(secondary);
        const secondaryText = document.createElement("div");
        secondary.appendChild(secondaryText);
        secondaryText.appendChild(document.createTextNode(subtext));
    }

    if (secondary) {
        wrapper.addEventListener("mouseover", () => secondary.style.removeProperty("display"));
        wrapper.addEventListener("mouseout", () => secondary.style.display = "none");
    }


    return wrapper;
}

if (urlParams.get('bottom_info')) {
    if (document.querySelector(".bottom-info"))
        document.querySelector(".bottom-info").remove();
    document.querySelector("#main").appendChild(bottomInfo(urlParams.get('bottom_info')));
}

let progressCounter = 0;
let failedCounter = 0;
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.loadingCode) {
        if (request.success) progressCounter++;
        else failedCounter++;

        if (document.querySelector(".bottom-info"))
            document.querySelector(".bottom-info").remove();
        
        let message = request.success ? " Loaded schedule for subject "+request.loadingCode : " Failed to load schedule for subject "+request.loadingCode;
        message += " ("+progressCounter+"/"+request.total+")";
        const bottom = bottomInfo(message);
        document.querySelector("#main").appendChild(bottom);

        // progress bar
        const progress = document.createElement("div");
        bottom.children[0].insertBefore(progress, bottom.children[0].childNodes[1]);
        progress.classList.add("progress");
        const bar = document.createElement("div");
        progress.appendChild(bar);
        bar.classList.add("bar");
        if (!request.success)
            bar.classList.add("failed");
        bar.style.width = (((progressCounter+failedCounter)/request.total)*100)+"%";

        sendResponse({code: request.loadingCode});

        if (progressCounter+failedCounter == request.total) {
            if (failedCounter > 0) {
                if (document.querySelector(".bottom-info"))
                    document.querySelector(".bottom-info").remove();

                document.querySelector("#main").appendChild(bottomInfo("Failed to load "+failedCounter+" subjects"));
            }

            const timer = failedCounter > 0 ? 3000 : 1000;

            setTimeout(() => {
                if (document.querySelector(".bottom-info"))
                    document.querySelector(".bottom-info").remove();

                failedCounter = 0;
                progressCounter = 0;
            }, timer);
        }
    }
});