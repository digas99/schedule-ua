let subjects, subjectColors;

chrome.storage.sync.get(SETTINGS_KEYS, result => {
    subjectColors = result["subject_colors"];
    subjects = result["subjects"];
    const subjectColorsElem = document.getElementById("subjects-colors");
    if (subjectColors && subjectColorsElem) {
        Object.entries(subjectColors).forEach(([subject, color]) => {
            // create color picker
            const colorPickerWrapper = document.createElement("div");
            subjectColorsElem.appendChild(colorPickerWrapper);
            colorPickerWrapper.classList.add("subject-color-picker", "clickable");
            const subjectName = document.createElement("div");
            colorPickerWrapper.appendChild(subjectName);
            subjectName.appendChild(document.createTextNode(subject));
            const colorPicker = document.createElement("input");
            colorPickerWrapper.appendChild(colorPicker);
            colorPicker.title = "Select new color for "+subject;
            colorPicker.type = "color";
            colorPicker.value = color;

            let choosingColor = false;
            colorPicker.addEventListener("click", () => choosingColor = true);

            colorPicker.addEventListener("input", () => subjectColors[subject] = colorPicker.value);

            colorPicker.addEventListener("mouseout", () => {
                if (choosingColor) {
                    chrome.storage.sync.set({"subject_colors": subjectColors});
                    choosingColor = false;
                }
            });
        });
    }

    const selected = result["selected"];
    const scheduleStartup = document.getElementById("schedule-startup");
    if (selected && scheduleStartup)
        scheduleStartup.value = selected;


    // handle checkboxes
    if (result["email"] == null) document.getElementById("remember-email").click();

    DEFAULT_TRUE_SETTINGS.forEach(key => {
        if (result[key] == false) document.getElementById(key.replaceAll("_", "-"))?.click();
    });

    DEFAULT_FALSE_SETTINGS.forEach(key => {
        if (result[key] == true) document.getElementById(key.replaceAll("_", "-"))?.click();
    });

    // handle color schema selector
    const colorSchema = document.querySelector("#color-schema");
    if (colorSchema)
        colorSchema.value = result["color_schema"] !== undefined ? result["color_schema"] : "System";
});

window.addEventListener("click", e => {
    const target = e.target;

    if (subjects && subjectColors) {
        if (target.closest("#subjects-colors-refresh")) {
            subjectColors = shuffleColors(subjects, SUBJECT_COLORS);
            chrome.storage.sync.set({"subject_colors": subjectColors});

            // update colors in popup
            const colorPickers = document.querySelectorAll(".subject-color-picker");
            if (colorPickers) {
                colorPickers.forEach(colorPicker => {
                    const subject = colorPicker.children[0].innerText;
                    colorPicker.children[1].value = subjectColors[subject];
                });
            }
        }
    }

    // checkbox animation
    if (target.closest("input[type='checkbox']")) {
        const checkbox = target.closest("input[type='checkbox']");
        const checkboxWrapper = checkbox.parentElement;
        if (checkboxWrapper) {
            if (!checkbox.checked)
                checkboxWrapper.classList.remove("checkbox-enabled");
            else
                checkboxWrapper.classList.add("checkbox-enabled");
        }
    }
    else if (target.closest(".checkbox_wrapper")) target.closest(".checkbox_wrapper").children[0].click();

    if (target.closest("#remember-email")) {
        const checkbox = target.closest("#remember-email");
        if (checkbox.checked)
            chrome.storage.sync.set({"email": ""});
        else
            chrome.storage.sync.remove("email");
    }

    // add click listeners to regular checkboxes
    [...DEFAULT_TRUE_SETTINGS, ...DEFAULT_FALSE_SETTINGS].forEach(key => {
        const id = "#"+key.replaceAll("_", "-");
        if (target.closest(id))
            chrome.storage.sync.set({[key]: target.closest(id).checked});
    });
});

window.addEventListener("input", e => {
    const target = e.target;

    if (target.closest("#schedule-startup"))
        chrome.storage.sync.set({"selected": target.value});

    if (target.closest("#color-schema"))
        swapColorSchema(target.value);

    if (target.closest("#closest-class-icon")) {
        if (!target.checked) {
            chrome.action.setBadgeText({text: ''});
            chrome.alarms.clear("update-class-badge");
        }
        else {
            chrome.storage.sync.get(["schedule", "subject_colors", "closest_class_icon"], result => {      
                // put closest class in the badge text
                if (result["schedule"] && result["closest_class_icon"] !== false) {
                    const now = new Date();
                    const todaySubjects = result["schedule"][getDayFromIndex(now.getDay(), DAYS_INDEX)];
                    updateClassBadge(todaySubjects, result["subject_colors"], parseInt(now.getHours()), parseInt(now.getMinutes()));

                    chrome.alarms.create("update-class-badge", {
                        delayInMinutes: 1,
                        periodInMinutes: 1
                    });
                }
            });                
        }
    }
});