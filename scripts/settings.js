let subjects, subjectColors;

chrome.storage.sync.get(["subject_colors", "subjects"], result => {
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
            colorPicker.type = "color";
            colorPicker.value = color;

            colorPicker.addEventListener("input", () => {
                subjectColors[subject] = colorPicker.value;
                chrome.storage.sync.set({"subject_colors": subjectColors});
            });
        });
    }
});

window.addEventListener("click", e => {
    const target = e.target;

    if (subjects && subjectColors) {
        if (target.closest("#subjects-colors-refresh")) {
            console.log("a");
            let indexes = [], counter = 0;
            while (indexes.length < subjects.length) {
                const index = Math.floor(Math.random() * SUBJECT_COLORS.length-1) + 1;
                if (indexes.indexOf(index) === -1) {
                    indexes.push(index);
                    subjectColors[subjects[counter++]] = SUBJECT_COLORS[index];
                }
            }
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
});