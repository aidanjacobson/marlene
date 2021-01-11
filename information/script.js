var data = {};
var favorites = [];
const fs = require("fs");
const path = require('path');
window.onload = async function() {
    favorites = await getFavorites();
    var testData = await getJSON("1234");
    if (!testData.decrypted) {
        testData = await getJSON(await requestPassword());
        if (!testData.decrypted) {
            console.log("Incorrect password");
            location.reload();
        }
    } else {
        console.log("Default Password Works");
    }
    backbtn.classList.add("behind");
    data = testData;
    for (var i = 0; i < data.cards.length; i++) {
        var card = data.cards[i];
        var div = document.createElement("div");
        div.classList.add("card");
        var title = document.createElement("h2");
        title.innerText = card.name;
        var desc = document.createElement("p");
        desc.innerText = card.description;
        div.appendChild(title);
        div.appendChild(desc);
        cards.appendChild(div);
        var id = document.createElement("input");
        id.type = "hidden";
        id.value = i;
        div.appendChild(id);
        div.addEventListener("click", handleCardClickPopup);
    }

    closer.addEventListener("click", function(e) {
        e.preventDefault();
        popup.setAttribute("hidden", "hidden");
        overlay.setAttribute("hidden", "hidden");
    });

    overlay.addEventListener("click", function(e) {
        e.preventDefault();
        popup.setAttribute("hidden", "hidden");
        overlay.setAttribute("hidden", "hidden");
    });
    var params = new URLSearchParams(location.search);
    if (params.has("selected")) {
        console.log(params.get("selected"));
        for (var i = 0; i < cards.children.length; i++) {
            var card = cards.children[i];
            var title = card.children[0].innerText;
            console.log(decodeURIComponent(params.get("selected")), title);
            if (decodeURIComponent(params.get("selected")) == title) {
                card.click();
                break;
            }
        }
    }
}

function handleCardClickPopup() {
    var id = this.children[2].value;
    var card = data.cards[id];
    popupTitle.innerText = card.name;
    popupDesc.innerText = card.description;
    fields.innerHTML = externals.innerHTML = "";

    // process fields
    for (var i = 0; i < card.fields.length; i++) {
        var field = card.fields[i];
        var text = document.createElement("span");
        text.innerText = `${field.key}: `;
        var input = document.createElement("input");
        input.setAttribute("readonly", "readonly");
        input.value = field.value;
        var button = document.createElement("button");
        button.innerText = "Copy";
        button.addEventListener("click", doSelectAndCopy);
        fields.append(text);
        fields.append(input);
        fields.append(button);
        fields.append(document.createElement("br"));
    }

    // process externals
    for (var i = 0; i < card.externals.length; i++) {
        var current = card.externals[i];
        switch(current.type) {
            case "link":
                var a = document.createElement("a");
                a.innerText = current.name;
                a.href = current.value;
                a.target = "_blank";
                if (typeof current.confirmation !== "undefined") {
                    a.confirmation = current.confirmation;
                    a.onclick = function() {
                        return confirm(this.confirmation);
                    }
                }
                externals.append(a);
                externals.append(document.createElement("br"));
                if (typeof current.immediate !== "undefined" && current.immediate) {
                    a.click();
                }
                break;
            case "text":
                var span = document.createElement("span");
                span.innerHTML = current.value;
                externals.append(span);
                externals.append(document.createElement("br"));
        }
    }
    // process favorite
    if (favorites.indexOf(popupTitle.innerText) > -1) {
        favorite.checked = true;
    } else {
        favorite.checked = false;
    }
    overlay.removeAttribute("hidden");
    popup.removeAttribute("hidden");
}

function doSelectAndCopy() {
    var input = this.previousElementSibling;
    input.select();
    document.execCommand("copy");
    this.innerText = "Copied!";
    setTimeout(function(scope) {
        scope.innerText = "Copy";
    }, 1000, this);
}

function requestPassword() {
    return new Promise(function(resolve, reject) {
        showPasswordPopup();
        form1.onsubmit = async function(e) {
            e.preventDefault();
            testData = await getJSON(pass.value);
            state.innerText = "Please wait...";
            setTimeout(function() {
                if (testData.decrypted) {
                    resolve(pass.value);
                    overlay.setAttribute("hidden", "hidden");
                    askpass.setAttribute("hidden", "hidden");
                } else {
                    state.innerText = "Incorrect password!";
                }
            }, 200);
            return false;
        }
    });
}

function showPasswordPopup() {
    overlay.removeAttribute("hidden");
    askpass.removeAttribute("hidden");
    pass.focus();
}

function encrypt(password, ldata=data) {
    var encrypted = CryptoJS.AES.encrypt(JSON.stringify(ldata), password).toString();
    return encrypted;
}

function updateSearch() {
    //console.log("update");
    for (var i = 0; i < cards.children.length; i++) {
        var currentChild = cards.children[i];
        if (search.value == "" || currentChild.children[0].innerText.toLowerCase().indexOf(search.value.toLowerCase()) > -1 || currentChild.children[1].innerText.toLowerCase().indexOf(search.value.toLowerCase()) > -1) {
            currentChild.style.display = "inline-block";
            //console.log("show", i);
        } else {
            currentChild.style.display = "none";
            //console.log("hidden", i);
        }
    }
}
setInterval(updateSearch, 20);

async function doUpdateFavorite() {
    if (favorite.checked) {
        favorites.push(popupTitle.innerText);
    } else {
        favorites = favorites.filter(v=>v!=popupTitle.innerText);
    }
    saveFavorites(favorites);
    favorites = await getFavorites();
}

function saveFile(file, contents) {
    /*
    try {
        fs.writeFileSync(path.join(__dirname, file), contents);
    } catch(e) {
        alert("Error writing to the file.");
    }
    */
   fs.writeFileSync(path.join(app.getPath("userData"), file), contents);
}

function getFile(file) {
    return fs.readFileSync(path.join(app.getPath("userData"), file), {encoding: "utf-8"});
}

async function getFavorites() {
    var response = getFile("favoritelinks.txt");
    var text = response;
    var split = text.split(",");
    if (split[0] == "") {
        return [];
    } else {
        return split;
    }
}

function saveFavorites(favs) {
    console.log(favs);
    var text = favs.join(",");
    saveFile("favoritelinks.txt", text);
}

window.onkeydown = function(e) {
    if (e.key === "Escape") {
        popup.setAttribute("hidden", "hidden");
        overlay.setAttribute("hidden", "hidden");
    }
}