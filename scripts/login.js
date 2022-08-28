chrome.storage.sync.get([...STORAGE_KEYS, "email"], result => {
    // if schedule does not exist
    if (!STORAGE_KEYS.some(key => Object.keys(result).includes(key))) {
        const loginWrapper = document.getElementById("login-wrapper");
        const send = document.getElementById("send");
        if (loginWrapper && send) {
            const inputs = loginWrapper.querySelectorAll("input");
            if (inputs) {
                // put email if it is saved
                if (result["email"] !== null) {
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
                        }).then(response => response.json())
                        .then(data => {
                            if (data["data"] && Object.keys(data["data"]).length > 0) {
                                // save email if asked
                                const remember = document.getElementById("remember-email")?.querySelector("input").checked;
                                if (remember) data["data"]["email"] = email;
                                else chrome.storage.sync.remove("email");

                                chrome.storage.sync.set(data["data"], () => window.location.href = "/home.html");
                            }
                            else {
                                document.querySelector(".loading").remove();
                                const text = document.getElementById("main").querySelector("div");
                                if (text) {
                                    text.innerText = "Wrong credentials. Please try again.";
                                    text.style.color = "#f56161";
                                }
                            }
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