const {ipcRenderer} = require("electron");
var employees;
var data;
window.onload = async function() {
    data = await getWeeklyData("../weeklydata.json");
    await updateEmployeeSelect();
}

async function updateEmployeeSelect() {
    employees = (await getShiftData()).employees;
    employeeSelect.innerHTML = "";
    for (var employee of employees) {
        var option = document.createElement("option");
        option.value = employee;
        option.innerText = employee;
        employeeSelect.append(option);
    }
}

function cancel() {
    window.close();
}

function save() {
    var object = {
        employee: employeeSelect.options[employeeSelect.selectedIndex].value,
        day: daySelect.selectedIndex,
        start: getStartTimeArray(),
        end: getEndTimeArray()
    }
    data.rules.push(object);
    saveRules(data);
    sendReloadMessage();
    window.close();
}

function getStartTimeArray() {
    var hour = +startHour.options[startHour.selectedIndex].value;
    if (startAPM.selectedIndex == 1) {
        hour += 12;
    }
    var minute = +startMinute.options[startMinute.selectedIndex].value;
    return [hour, minute];
}

function getEndTimeArray() {
    var hour = +endHour.options[endHour.selectedIndex].value;
    if (endAPM.selectedIndex == 1) {
        hour += 12;
    }
    var minute = +endMinute.options[endMinute.selectedIndex].value;
    return [hour, minute];
}

function sendReloadMessage() {
    ipcRenderer.send("reload");
}