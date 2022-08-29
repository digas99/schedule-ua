let subjects, subjectColors;

chrome.storage.sync.get(["subject_colors", "subjects", "email", "selected", "paco_buttons", "highlight_now"], result => {
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

            colorPicker.addEventListener("input", () => {
                subjectColors[subject] = colorPicker.value;
                chrome.storage.sync.set({"subject_colors": subjectColors});
            });
        });
    }

    const selected = result["selected"];
    const scheduleStartup = document.getElementById("schedule-startup");
    if (selected && scheduleStartup)
        scheduleStartup.value = selected;


    // handle checkboxes
    if (result["email"] == null) document.getElementById("remember-email").click();
    if (result["paco_buttons"] == false) document.getElementById("paco-download-upload").click();
    if (result["highlight_now"] == false) document.getElementById("highlight-now").click();
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

    if (target.closest("#paco-download-upload")) {
        const checkbox = target.closest("#paco-download-upload");
        if (checkbox.checked)
            chrome.storage.sync.set({"paco_buttons": true});
        else
            chrome.storage.sync.set({"paco_buttons": false});
    }

    if (target.closest("#highlight-now")) {
        const checkbox = target.closest("#highlight-now");
        if (checkbox.checked)
            chrome.storage.sync.set({"highlight_now": true});
        else
            chrome.storage.sync.set({"highlight_now": false});
    }
});

window.addEventListener("input", e => {
    const target = e.target;

    if (target.closest("#schedule-startup"))
        chrome.storage.sync.set({"selected": target.value});
});