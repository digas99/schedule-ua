fetch("../manifest.json")
    .then(response => response.json())
    .then(manifest => document.getElementById("version").innerText = `v${manifest["version"]}`);