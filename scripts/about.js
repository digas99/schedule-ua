fetch("../manifest.json")
    .then(response => response.json())
    .then(manifest => document.getElementById("version").innerText = `v${manifest["version"]}`);

const mdToHTML = lineText => {
    // maintain the original value to add padding bellow, in needed
    let line = lineText;

    // start at 1 to ignore h1
    let hCounter = 1;
    // counter number of # in a row
    for (let i = 0; i < 3; i++) {
        if (line.charAt(0) == '#') {
            hCounter++;
            line = line.substring(1);
        }
        else break;
    }

    let elem;
    if (hCounter == 1)
        elem = document.createElement("p");
    else
        elem = document.createElement("h"+hCounter);

    // detect links headers
    let insideLink = false;
    let newLine = "";
    for (let i = 0; i < line.length; i++) {
        if (line.charAt(i) == ']') {
            line = newLine;
            break;
        }
        
        if (insideLink) newLine+=line.charAt(i);

        if (line.charAt(i) == '[') {
            if (i !== 1) break;

            insideLink = true;
        }
    }

    if (line == "---") line = "";

    if (lineText.charAt(0) === ' ')
        elem.style.paddingLeft = "10px";

    if (line.slice(0, 3) === "***") {
        elem.classList.add("md-extra-highlighted");
    }

    console.log(line);
    line = line.replaceAll('*', '');

    console.log(line);

    elem.appendChild(document.createTextNode(line));

    return elem;
}

const changelogWrapper = document.getElementById("changelog");
if (changelogWrapper) {
    const readme = document.createElement("div");
    changelogWrapper.appendChild(readme);
    readme.style.marginTop = "20px";
    const readmeNavbar = document.createElement("div");
    readme.appendChild(readmeNavbar);
    readmeNavbar.classList.add("readme-navbar");
    const readmeContent = document.createElement("div");
    readme.appendChild(readmeContent);
    readmeContent.classList.add("readme");
    fetch('../CHANGELOG.md')
        .then(response => response.text())
        .then(text => {
            text.split("\n").forEach(line => readmeContent.appendChild(mdToHTML(line)));
            readmeContent.getElementsByTagName("h2")[0].style.removeProperty("margin-top");
    
            Array.from(readmeContent.getElementsByTagName("h2"))
                .forEach((h2, i) => {
                    // fill navbar
                    const navbarSection = document.createElement("div");
                    readmeNavbar.appendChild(navbarSection);
                    navbarSection.classList.add("clickable");
                    navbarSection.appendChild(document.createTextNode(h2.innerText.split("v")[1]));
                    navbarSection.addEventListener("click", () => {
                        Array.from(document.getElementsByClassName("readme-navbar-selected")).forEach(elem => elem.classList.remove("readme-navbar-selected"));
                        navbarSection.classList.add("readme-navbar-selected");
                        readmeContent.scrollTo(0, h2.offsetTop-readmeNavbar.offsetTop-h2.offsetHeight-8);
                    });
                    if (i == 0) navbarSection.classList.add("readme-navbar-selected");
                });
        });
}