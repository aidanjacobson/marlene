const {ipcRenderer} = require("electron");
function addShift() {
    window.open(`addshift/index.html?start=${today.join(",")}#inapp`);
}
function addRule() {
    window.open(`addrule/index.html?start=${today.join(",")}#inapp`);
}

var data, shifts, today, params;
async function start() {
    params = new URLSearchParams(location.search);
    today = params.get("start").split(",").map(v=>+v);
    data = await getWeeklyData();
    shifts = compileRules(data, today);
    updateDisplays();
}

window.onload = start;

function updateDisplays() {
    updateShifts();
    updateRules();
}

function updateShifts() {
    var sorted = sortWeeklyShifts(data.rules);
    shiftsDisplay.innerHTML = "";
    for (var i = 0; i < sorted.length; i++) {
        var shift = sorted[i];
        var shiftElement = document.createElement("li");
        shiftElement.innerHTML = `${shift.employee}: ${dayNames[shift.day]} ${convertTimeArrayToString(shift.start, false)} - ${convertTimeArrayToString(shift.end, false)} <button onclick="removeShift(${i})">Delete</button>`;
        shiftsDisplay.append(shiftElement);
    }
}

function updateRules() {
    rulesDisplay.innerHTML = "";
    for (var i = 0; i < data.exceptions.length; i++) {
        var current = data.exceptions[i];
        var ruleElement = document.createElement("li");
        ruleElement.innerHTML = `${current.type == "add" ? "Schedule" : "Do not schedule"} ${current.shift.employee} (${dayNames[current.shift.day]} ${convertTimeArrayToString(current.shift.start, false)} - ${convertTimeArrayToString(current.shift.end, false)}) starting ${convertDateArrayToString(current.startDate)}, ${current.weeks==-1?"indefinitely":`for ${current.weeks} weeks`} <button onclick="removeRule(${i})">Delete</button>`;
        rulesDisplay.append(ruleElement);
    }
}

function sortWeeklyShifts(shifts) {
    return shifts.sort(function(a, b) {
        if (a.day < b.day) {
            return -1;
        }
        if (a.day > b.day) {
            return 1;
        }
        if (a.start[0] < b.start[0]) {
            return -1;
        }
        if (a.start[0] > b.start[0]) {
            return 1;
        }
        if (a.start[1] < b.start[1]) {
            return -1;
        }
        if (a.start[1] > b.start[1]) {
            return 1;
        }
        return 0;
    });
}


function removeShift(index) {
    data.rules.splice(index, 1);
    saveRules(data);
    start();
}

function removeRule(index) {
    data.exceptions.splice(index, 1);
    saveRules(data);
    start();
}

ipcRenderer.on("reload", function() {
    start();
});

function goBack(e) {
    e.preventDefault();
    e.stopPropagation();
    window.location = `../index.html?offset=${params.get("offset")}`;
}