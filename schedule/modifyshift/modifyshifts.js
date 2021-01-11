var {ipcRenderer} = require("electron");

var existing = false;
var shiftIndex;
var data;
var unsaved = false;
async function main() {
    var params = new URLSearchParams(location.search);
    data = await getShiftData();
    fillEmployeeSelectSlot();
    var presets = {
        employee: "",
        date: "",
        start: "",
        end: ""
    }
    if (params.has("shiftIndex")) {
        var index = params.get("shiftIndex");
        existing = true;
        shiftIndex = index;
        var shift = data.shifts[index];
        presets = shift;
        deleteButton.removeAttribute("disabled");
    } else {
        presets.employee = params.get("employee");
        presets.date = params.get("date").split(",").toNumbers();
        presets.start = params.get("start").split(",").toNumbers();
        presets.end = params.get("end").split(",").toNumbers();
    }

    if (presets.employee != "") {
        employeeSelect.selectedIndex = data.employees.indexOf(presets.employee);
    }
    if (presets.date.length > 1) {
        dateInput.value = `${presets.date[2]}-${(presets.date[0]+1).toString().padStart(2, "0")}-${presets.date[1].toString().padStart(2, "0")}`;
    }

    if (presets.start.length > 1) {
        if (presets.start[0] > 12) {
            startHour.selectedIndex = presets.start[0]-13;
            startAPM.selectedIndex = 1;
        } else {
            startHour.selectedIndex = presets.start[0]-1;
            startAPM.selectedIndex = 0;
        }
        startMinute.selectedIndex = presets.start[1]/5;
    }

    if (presets.end.length > 1) {
        if (presets.end[0] > 12) {
            endHour.selectedIndex = presets.end[0]-13;
            endAPM.selectedIndex = 1;
        } else {
            endHour.selectedIndex = presets.end[0]-1;
            endAPM.selectedIndex = 0;
        }
        endMinute.selectedIndex = presets.end[1]/5;
    }
}
window.onload = function() {
    main();
}

Array.prototype.toNumbers = function() {
    return this.map(e=>+e);
}

function fillEmployeeSelectSlot() {
    for (var i = 0; i < data.employees.length; i++) {
        var option = document.createElement("option");
        option.value = data.employees[i];
        option.innerText = data.employees[i];
        employeeSelect.append(option);
    }
}

function processChange() {
    unsaved = true;
    updateUnsavedMessage();
}
function updateUnsavedMessage() {
    if (unsaved) {
        unsavedMessage.removeAttribute("hidden");
    } else {
        unsavedMessage.setAttribute("hidden", "hidden");
    }
}

function save() {
    var employee = employeeSelect.options[employeeSelect.selectedIndex].value;
    var compDate = new Date(dateInput.value);
    var date = [compDate.getMonth(), compDate.getDate()+1, compDate.getFullYear()];
    var sHour = +startHour.options[startHour.selectedIndex].value;
    var sMinute = +startMinute.options[startMinute.selectedIndex].value;
    if (startAPM.selectedIndex == 1) sHour += 12;
    var eHour = +endHour.options[endHour.selectedIndex].value;
    var eMinute = +endMinute.options[endMinute.selectedIndex].value;
    if (endAPM.selectedIndex == 1) eHour += 12;
    var start = [sHour, sMinute];
    var end = [eHour, eMinute];
    var shift = {employee, date, start, end};
    if (existing) {
        data.shifts[shiftIndex] = shift;
    } else {
        data.shifts.push(shift);
        existing = true;
        shiftIndex = data.shifts.length-1;
        deleteButton.removeAttribute("disabled");
    }
    var newData = JSON.stringify(data);
    try {
        fs.writeFileSync(path.join(app.getPath("userData"), "schedule.json"), newData);
        unsaved = false;
        updateUnsavedMessage();
    } catch(e) {
        alert("Error writing to the file.");
    }
    sendReloadMessage();
    window.close();
}

function cancel() {
    unsaved = false;
    sendReloadMessage();
    window.close();
}

function deleteShift() {
    if (!existing) return;
    if (!confirm("Are you sure you want to delete the shift?")) return;
    data.shifts.splice(shiftIndex, 1);
    var newData = JSON.stringify(data);
    try {
        fs.writeFileSync(path.join(app.getPath("userData"), "schedule.json"), newData);
        unsaved = false;
        updateUnsavedMessage();
    } catch(e) {
        alert("Error deleting the shift.");
    }
    sendReloadMessage();
    window.close();
}

window.onbeforeunload = function(e) {
    if (unsaved) {
        e.preventDefault();
        e.returnValue = "You have unsaved changes. Are you sure you want to leave?";
        resp = confirm("You have unsaved changes. Are you sure you want to leave?");
        if (resp) {
            delete e['returnValue'];
            cancel();
        }
    } else {
        delete e['returnValue'];
    }
}

function back(e) {
    e.preventDefault();
    e.stopPropagation();
    window.close();
}

function addDaysToDate(date, days) {
    var dateOffset = (24*60*60*1000)*days;
    var out = new Date();
    out.setTime(date.getTime() + dateOffset);
    return out;
}

function sendReloadMessage() {
    ipcRenderer.send("reload");
}