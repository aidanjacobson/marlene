var {ipcRenderer} = require("electron");
var params = new URLSearchParams(location.search);
window.onload = function() {
    window.resizeTo(screen.availWidth, screen.availHeight);
    switch(params.get("print")) {
        case "1":
            render1();
            break;
        case "2":
            render2(true);
            break;
        case "3":
            render2(false);
            break;
    }
    setTimeout(function() {
        window.print();
    }, 1000);
}

function render1() {
    var offset = params.get("offset");
    var iframe = document.createElement("iframe");
    iframe.style.width = "100%";
    iframe.style.height = "49%";
    iframe.src = `../index.html?print=true&offset=${offset}`;
    document.body.append(iframe);
}

function render2(forward=true) {
    var offset1, offset2;
    if (params.get("print") == "2") {
        offset1 = params.get("offset");
        offset2 = +params.get("offset") + 1;
        offset2 = offset2.toString();
    } else {
        offset2 = params.get("offset");
        offset1 = +params.get("offset") - 1;
        offset1 = offset1.toString();
    }
    var iframe1 = document.createElement("iframe");
    iframe1.style.width = "100%";
    iframe1.style.height = "49%";
    iframe1.src = `../index.html?print=true&offset=${offset1}`;
    document.body.append(iframe1);
    var iframe2 = document.createElement("iframe");
    iframe2.style.width = "100%";
    iframe2.style.height = "49%";
    iframe2.src = `../index.html?print=true&offset=${offset2}`;
    document.body.append(iframe2);
}