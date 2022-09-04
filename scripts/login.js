chrome.action.setBadgeText({text: ''});

chrome.storage.sync.get([...STORAGE_KEYS, "email"], result => {
    // if schedule does not exist
    if (!STORAGE_KEYS.some(key => Object.keys(result).includes(key))) {
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

                            document.querySelector(".loading").remove();
                            const text = document.querySelector("#main > div > div");
                            if (text) {
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
                                if (success)
                                    window.location.href = "/home.html";
                            });
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
});

const dropZone = document.getElementById("drop-zone");

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
const handleJSONDrop = e => {
    e.stopPropagation();
    e.preventDefault();
    
    const file = e.dataTransfer.files[0];

    const reader = new FileReader();

    if (file && file.type.match('application/json')) {
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

const handleDragOver = e => {
    dropZone.style.setProperty("background", "#3e94ef", "important");

    e.stopPropagation();
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy'; // Explicitly show this is a copy.
}

// Setup the dnd listeners.
dropZone.addEventListener('dragover', handleDragOver, false);
dropZone.addEventListener('dragleave', () => dropZone.style.removeProperty("background"), false);
dropZone.addEventListener('drop', handleJSONDrop, false);