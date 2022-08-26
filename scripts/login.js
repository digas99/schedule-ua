const loginWrapper = document.getElementById("login-wrapper");
const send = document.getElementById("send");
if (loginWrapper && send) {
    send.addEventListener("click", () => {
        // check if all inputs are not empty
        const inputs = loginWrapper.querySelectorAll("input");
        if (inputs.length == 2 && Array.from(inputs).every(elem => elem.value)) {
            const email = inputs[0].value;
            const password = inputs[1].value;
            const encoded = btoa(email+":"+password);
            fetch("https://pacoua-api.pt/schedule", {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Basic ${encoded}`
                }
            }).then(response => response.json())
            .then(data => chrome.storage.sync.set(data["data"], () => window.location.href = "/home.html"));
        }
    });
}