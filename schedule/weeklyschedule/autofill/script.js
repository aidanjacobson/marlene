const {ipcRenderer} = require("electron");
function cancel() {
    window.close();
}

var weeklyData, scheduleData, rules, newRules=[], startDate;
window.onload = async function() {
    scheduleData = await getShiftData();
    weeklyData = await getWeeklyData();
    shiftDisplay.innerHTML = "";
    var params = new URLSearchParams(location.search);
    startDate = params.get("start").split(",").map(v=>+v);
    rules = compileRules(weeklyData, startDate);
    for (var rule of rules) {
        var employee = rule.employee;
        //var date = convertDateArrayToString(addDaysToDateArray(startDate, rule.day), false);
        var date = dayNames[rule.day];
        var start = convertTimeArrayToString(rule.start, false);
        var end = convertTimeArrayToString(rule.end, false);
        var li = document.createElement("li");
        li.innerText = `${employee}: ${date} ${start} - ${end}`;
        shiftDisplay.append(li);
        newRules.push({
            employee: employee,
            date: addDaysToDateArray(startDate, rule.day),
            start: rule.start,
            end: rule.end
        })
    }
}

function apply() {
    // clear current shifts
    for (var i = 0; i < scheduleData.shifts.length; i++) {
        if (isDateWithin(scheduleData.shifts[i].date, startDate, addDaysToDateArray(startDate, 6))) {
            scheduleData.shifts.splice(i, 1);
            i--;
        }
    }
    // add new shifts
    for (var rule of newRules) {
        scheduleData.shifts.push(rule);
    }
    saveFile("schedule.json", JSON.stringify(scheduleData));
    sendReloadMessage();
    window.close();
}

function sendReloadMessage() {
    ipcRenderer.send("reload");
}