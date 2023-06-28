chrome.action.setBadgeText({text: ''});

const loadingData = loading("Loading data...");
document.body.appendChild(loadingData);

chrome.storage.sync.get([...SCHEDULE_CONFIGS, "email"], result => {
    // if schedule does not exist
    if (!SCHEDULE_CONFIGS.some(key => Object.keys(result).includes(key))) {
        loadingData.remove();
        document.body.style.removeProperty("height");
        document.querySelector("#main")?.style.removeProperty("display");

        const loginWrapper = document.getElementById("login-wrapper");
        const send = document.getElementById("send");
        if (loginWrapper && send) {
            const inputs = loginWrapper.querySelectorAll("input");
            if (inputs) {
                // put email if it is saved
                if (result["email"] !== undefined) {
                    inputs[0].value = result["email"];
                    document.getElementById("remember-email").querySelector("input").checked = true;
                }

                // activate send button
                Array.from(inputs).forEach(elem => {
                    elem.addEventListener("input", () => {
                        if (inputsFilled(inputs) && send.classList.contains("button-inactive")) send.classList.remove("button-inactive");
                        else if (!inputsFilled(inputs) && !send.classList.contains("button-inactive")) send.classList.add("button-inactive");
                    });
                });

                send.addEventListener("click", () => {
                    // check if all inputs are not empty
                    if (inputs.length == 2 && inputsFilled(inputs)) {
                        // add loading
                        document.body.appendChild(loading("Loading schedule..."));

                        // make sure password is always hidden on loading
                        inputs[1].type = "password";

                        const email = inputs[0].value;
                        const password = inputs[1].value;
                        const encoded = btoa(email+":"+password);
                        fetch("https://pacoua-api.pt/schedule", {
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Basic ${encoded}`
                            }
                        }).then(response => {
                            let message;
                            switch(response.status) {
                                case 500:
                                case 504:
                                    message = "Server Error. Please try again.";
                                    break;
                                case 403:
                                    message = "Wrong credentials. Please try again.";
                                    break;
                            }

                            const text = document.querySelector("#main > div > div");
                            if (text && message) {
                                text.innerText = message;
                                text.style.color = "#f56161";
                            }

                            return response.json();
                        })
                        .then(result => {
                            let data = {};
                            const success = result["data"] && Object.keys(result["data"]).length > 0;
                            if (success)
                                data = result["data"];

                            // save email if asked
                            const remember = document.getElementById("remember-email")?.querySelector("input").checked;
                            if (remember) data["email"] = email;
                            else chrome.storage.sync.remove("email");

                            chrome.storage.sync.set(data, () => {
                                if (success) {
                                    const subjectCodes = Array.from(new Set(Object.entries(data["schedule"]).map(([_, classes]) => classes.map(data => data["subject"]["code"])).flat(1)));
                                    chrome.runtime.sendMessage({codes: subjectCodes, auth: encoded}, response => console.log(response));
                                    setTimeout(() => {
                                        document.querySelector(".loading").remove();
                                        window.location.href = "/home.html?bottom_info=Waiting for subject schedules to be loaded...";
                                    }, 1000);
                                }
                            });
                        })
                        .catch(() => {
                            document.querySelector(".loading").remove();
                            const text = document.querySelector("#main > div > div");
                            if (text) {
                                text.innerText = "Something went wrong! Please try again.";
                                text.style.color = "#f56161";
                            }

                            // save email if asked
                            const remember = document.getElementById("remember-email")?.querySelector("input").checked;
                            if (remember) data["email"] = email;
                            else chrome.storage.sync.remove("email");
                        });
                    }
                });
            }
        }

        document.addEventListener("keydown", e => {
            const key = e.key;

            // use Enter to click Send
            if (key === 'Enter') send?.click();
        });

        const inputsFilled = (inputs) => Array.from(inputs).every(elem => elem.value);
    }
    else
        window.location.href = "/home.html";
});

window.addEventListener("click", e => {
    const target = e.target;

    if (target.closest("#show-pwd")) {
        const passwordInput = document.getElementById("login-wrapper")?.getElementsByTagName("input")[1];
        if (passwordInput.getAttribute("type") === "password") {
            passwordInput.setAttribute("type", "text");
            target.src = "images/icons/not-view.png";
        }
        else {
            passwordInput.setAttribute("type", "password");
            target.src = "images/icons/view.png";
        }
    }

    if (target.closest("#darkmode"))
        swapColorSchema(target.closest("#darkmode").title);
});

// DROP ZONE

const dropZone = document.getElementById("drop-zone");
const dropZoneContent = dropZone.querySelector("div");
const dropZoneFileInput = document.querySelector("#drop-zone input");

const errorMessage = msg => {
    document.querySelector("#file-drop-error")?.remove();
    
    const errorMsg = document.createElement("div");
    errorMsg.id = "file-drop-error";
    errorMsg.style.color = "#f56161";
    errorMsg.style.textAlign = "center";
    errorMsg.appendChild(document.createTextNode(msg));
    
    dropZone.style.setProperty("background", "#f56161", "important");
    setTimeout(() => dropZone.style.removeProperty("background"), 1000);

    return errorMsg;
}

// https://gist.github.com/andjosh/7867934
const handleJSONFile = file => {
    if (file && file.type.match('application/json')) {
        const reader = new FileReader();

        // Closure to capture the file information.
        reader.onload = (() => {
            return function (e) {
                data = JSON.parse(e.target.result);
                if (Object.keys(data).some(key => ["schedule", "school_year", "semester", "subjectColors"].includes(key))) {
                    chrome.storage.sync.set(data, () => window.location.href = "/home.html");
                }
                else
                    dropZone.parentElement.appendChild(errorMessage("Missing keys in JSON file!"));
            };
        })(file);
    
        reader.readAsText(file);
    }
    else
        dropZone.parentElement.appendChild(errorMessage("Couldn't read the file!"));
}

const handleJSONDrop = e => {
    e.stopPropagation();
    e.preventDefault();
    
    const file = e.dataTransfer.files[0];
    handleJSONFile(file);
}

const handleDragOver = e => {
    handleHover();

    e.stopPropagation();
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy'; // Explicitly show this is a copy.
}

const handleHover = () => {
    dropZone.style.background = "#3e94ef";

    dropZoneContent.innerText = "+";
    dropZoneContent.style.fontSize = "40px";
}

const handleOut = () => {
    dropZone.style.removeProperty("background");

    dropZoneContent.style.removeProperty("font-size");
    dropZoneContent.innerText = "";
    const img = document.createElement("img");
    dropZoneContent.appendChild(img);
    img.src = "../images/icons/file.png";
    dropZoneContent.appendChild(document.createTextNode("Drop File Here"));
}

// Setup the dnd listeners.
dropZone.addEventListener('dragover', handleDragOver, false);
dropZone.addEventListener('dragleave', handleOut, false);
dropZone.addEventListener('drop', handleJSONDrop, false);
dropZone.addEventListener('mouseover', handleHover);
dropZone.addEventListener('mouseout', handleOut);
dropZone.addEventListener('click', () => {
    if (dropZoneFileInput)
        dropZoneFileInput.click();
});

dropZoneFileInput.addEventListener('input', () => handleJSONFile(dropZoneFileInput.files[0]), false);