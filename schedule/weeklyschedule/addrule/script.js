window.onload = async function() {
    await Promise.all([updateEmployeeSelect(), updateShiftList()])
}
var {ipcRenderer} = require("electron");

async function updateEmployeeSelect() {
    var shiftData = await getShiftData();
    var employees = shiftData.employees;
    for (var employee of employees) {
        var option = document.createElement("option");
        option.value = employee;
        option.innerText = employee;
        employeeSelect.append(option);
    }
}

var data;
async function updateShiftList() {
    data = await getWeeklyData();
    var shifts = data.rules;
    for (var i = 0; i < shifts.length; i++) {
        var current = shifts[i];
        var shiftText = `${current.employee}: ${dayNames[current.day]} ${convertTimeArrayToString(current.start,false)} - ${convertTimeArrayToString(current.end,false)}`;
        var option = document.createElement("option");
        option.value = i;
        option.innerText = shiftText;
        shiftSelect.append(option);
    }
}

function doUpdateForm() {
    employeeSelectContainer.removeAttribute("hidden");
    shiftSelectContainer.removeAttribute("hidden");
    timeSelectContainer.removeAttribute("hidden");
    lengthSelectContainer.removeAttribute("hidden");
    saveButton.removeAttribute("disabled");
    if (ruleType.selectedIndex == 0) {
        doVisibilityChange(0);
        return;
    } else {
        if (ruleType.selectedIndex == 1) {
            shiftSelectContainer.setAttribute("hidden", true);
            shiftSelect.selectedIndex = 0;
        } else {
            employeeSelectContainer.setAttribute("hidden", true);
            employeeSelect.selectedIndex = 0;
        }
    }
    if ((ruleType.selectedIndex == 1 && employeeSelect.selectedIndex == 0) || (ruleType.selectedIndex == 2 && shiftSelect.selectedIndex == 0)) {
        doVisibilityChange(1);
        return;
    }
    if (daySelect.value == "") {
        doVisibilityChange(2);
        return;
    }
    if (getRadioValue("lengthTypeSelect") == null) {
        doVisibilityChange(3);
        return;
    }
}
function doVisibilityChange(index) {
    switch(index) {
        case 0:
            employeeSelect.selectedIndex = 0;
            shiftSelect.selectedIndex = 0;
            employeeSelectContainer.setAttribute("hidden", true);
            shiftSelectContainer.setAttribute("hidden", true);
        case 1:
            timeSelectContainer.setAttribute("hidden", true);
            daySelect.value = "";
        case 2:
            lengthSelectContainer.setAttribute("hidden", true);
            deselectRadio("lengthTypeSelect");
        case 3:
            saveButton.setAttribute("disabled", true);
    }
}

function cancel() {
    window.close();
}

function getRadioValue(name) {
    var els = document.getElementsByName(name);
    if (els.length == 0) return undefined;
    for (var i = 0; i < els.length; i++) {
        if (els[i].checked) {
            return els[i].value;
        }
    }
    return null;
}

function deselectRadio(name) {
    var els = document.getElementsByName(name);
    for (var i = 0; i < els.length; i++) {
        els[i].removeAttribute("checked");
    }
}

function save() {
    var object = {};
    var startDate = convertDateToDateArray(convertDateInputToDate(daySelect.value));
    var weekAmount = -1;
    if (ruleType.selectedIndex == 1) {
        if (weeks.checked) {
            weekAmount = +weekInput.value;
        }
        object = {
            type: "add",
            shift: {
                employee: employeeSelect.options[employeeSelect.selectedIndex].value,
                day: startDaySelect.selectedIndex,
                start: getStartTimeArray(),
                end: getEndTimeArray()
            },
            startDate: startDate,
            weeks: weekAmount
        };
    } else {
        if (weeks.checked) {
            weekAmount = +weekInput.value;
        }
        object = {
            type: "remove",
            shift: data.rules[+shiftSelect.options[shiftSelect.selectedIndex].value],
            startDate: startDate,
            weeks: weekAmount
        }
    }
    data.exceptions.push(object);
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