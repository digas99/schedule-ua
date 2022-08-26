const loginWrapper = document.getElementById("login-wrapper");
const send = document.getElementById("send");
if (loginWrapper && send) {
    const inputs = loginWrapper.querySelectorAll("input");
    if (inputs) {
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
                    console.log(data);
                    if (data["data"] && Object.keys(data["data"]).length > 0)
                        chrome.storage.sync.set(data["data"], () => window.location.href = "/home.html");
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