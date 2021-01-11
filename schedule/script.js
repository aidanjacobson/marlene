var ipcRenderer;
var weekOffset = 0;
var data;
var startDate, endDate;
window.onload = async function() {
    data = await getData();
    initEmployees();
    var params = new URLSearchParams(location.search);
    if (params.has("offset")) {
        weekOffset = +params.get("offset");
    }
    if (params.has("print") && params.get("print") == "true") {
        buttons.hidden = true;
        info.hidden = true;
        header.hidden = true;
        backbutton.hidden = true;
    } else {
        var {ipcRenderer} = require("electron");
        ipcRenderer.on("reload", async function() {
            data = await getData();
            renderCurrentWeek();
        })
    }
    setDateDisplay();
}
function weekBack() {
    weekOffset--;
    setDateDisplay();
}

function weekForward() {
    weekOffset++;
    setDateDisplay();
}

function setDateDisplay(weekOffset=window.weekOffset) {
    /*
    if (weekOffset == 0) {
        weekly.removeAttribute("hidden");
    } else {
        weekly.setAttribute("hidden", "hidden");
    }
    */
    var daySubtracts = [6, 0, 1, 2, 3, 4, 5];
    var date = new Date();
    date = addDaysToDate(date, weekOffset*7);
    var day = date.getDay();
    var startingDate = addDaysToDate(date, -daySubtracts[day]);
    var endingDate = addDaysToDate(startingDate, 6);
    weekDisplay.innerText = `${startingDate.getMonth()+1}/${startingDate.getDate()} - ${endingDate.getMonth()+1}/${endingDate.getDate()}`;
    startDate = [startingDate.getMonth(), startingDate.getDate(), startingDate.getFullYear()];
    endDate = [endingDate.getMonth(), endingDate.getDate(), endingDate.getFullYear()];
    renderCurrentWeek();
}

function initEmployees() {
    var employees = data.employees;
    for (var i = 0; i < employees.length; i++) {
        var tr = document.createElement("tr");
        for (var j = 0; j < 9; j++) {
            var td = document.createElement("td");
            if (j == 0) {
                td.innerText = employees[i];
                td.classList.toggle("employeeName");
                td.onclick = viewEmployee;
            }
            tr.append(td);
        }
        tbody.append(tr);
    }
}

async function getData() {
    var response = await getFileJSON("schedule.json");
    return response;
}

function renderCurrentWeek() {
    var compDate = new Date(`${startDate[0]+1}/${startDate[1]}/${startDate[2]}`);
    var dateNames = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    var today = new Date();
    var payWeekNumber = get2WeekNumber(compDate.stripTime());
    for (var i = 0; i < 7; i++) {
        var newDate = addDaysToDate(compDate, i);
        thead.children[0].children[i+1].innerText = `${dateNames[i]} ${newDate.getMonth()+1}/${newDate.getDate()}`;
        if (newDate.getMonth() == today.getMonth() && newDate.getDate() == today.getDate() && newDate.getFullYear() == today.getFullYear()) {
            thead.children[0].children[i+1].classList.add("currentDay");
        } else {
            thead.children[0].children[i+1].classList.remove("currentDay");
        }
        if (payWeekNumber == 1 && i == 6) {
            thead.children[0].children[i+1].classList.add("payWeekEnd");
        } else {
            thead.children[0].children[i+1].classList.remove("payWeekEnd");
        }
    }
    for (var i = 0; i < tbody.children.length; i++) {
        for (var j = 1; j < tbody.children[i].children.length-1; j++) {
            tbody.children[i].children[j].innerHTML = "";
        }
    }
    var tableTemp = new Array(data.employees.length).fill(0).map(e=>new Array(8).fill(0).map(j=>[]))
    numberData();
    var shifts = filterShifts(data, {startDate:startDate, endDate:endDate});
    for (var i = 0; i < shifts.length; i++) {
        var shift = shifts[i];
        var compiledDate = convertDateArrayToDate(shift.date);
        var rowIndex = data.employees.indexOf(shift.employee);
        var colIndex = compiledDate.getDay();
        if (colIndex == 0) {
            colIndex = 7;
        }

        tableTemp[rowIndex][colIndex].push([shift.start, shift.end, shift.shiftIndex]);
    }
    removeNumbers();
    for (var row = 0; row < data.employees.length; row++) {
        for (var col = 1; col < 8; col++) {
            if (tableTemp[row][col].length > 0) {
                tableTemp[row][col] = sortHours(tableTemp[row][col]);
                tableTemp[row][col].forEach(function(shift) {
                    var timeString = `${shift[0].toTimeString()} - ${shift[1].toTimeString()}`;
                    tbody.children[row].children[col].innerHTML += `<span shiftIndex="${shift[2]}" class='shiftText' onclick="modifyShift(event)">${timeString}</span><br>`;
                })
            }
            var button = document.createElement("span");
            button.classList.add("addButton");
            button.setAttribute("dateOffset", col-1);
            button.setAttribute("employeeOffset", row);
            button.onclick = openNewShiftWindow;
            button.innerText = "+";
            tbody.children[row].children[col].append(button);
        }
    }
    calculateTotals(tableTemp);
}
function sortHours(shifts) {
    return shifts.sort(function(a, b) {
        if (a[0] < b[0]) {
            return -1;
        }
        if (a[0] > b[0]) {
            return 1;
        }
        if (a[1] < b[1]) {
            return -1;
        }
        if (a[1] > b[1]) {
            return 1;
        }
        return 0;
    })
}

function convert24to12(time) {
    return [time[0] <= 12 ? time[0] : time[0]-12, time[1]];
}
Array.prototype.toTimeString = function() {
    var out = convert24to12(this);
    out[0] = out[0].toString();
    out[1] = out[1].toString();
    if (out[1].length == 1) {
        out[1] = "0" + out[1];
    }
    return out.join(":");
}

function openShiftDialogue({date=[],employee="",start=[],end=[],shiftIndex=""}={}) {
    var url = "";
    if (shiftIndex != "") {
        url = `modifyshift/index.html?shiftIndex=${shiftIndex}#inapp`;
    } else {
        url = `modifyshift/index.html?date=${date.join(",")}&employee=${employee}&start=${start.join(",")}&end=${end.join(",")}#inapp`;
    }
    window.open(url);
}

function modifyShift(e) {
    openShiftDialogue({shiftIndex:e.target.getAttribute("shiftIndex")});
}

function openNewShiftWindow(e) {
    var employeeOffset = e.target.getAttribute("employeeOffset")
    var dateOffset = e.target.getAttribute("dateOffset");
    var employee = data.employees[+employeeOffset];
    var compiledStartDate = new Date(`${startDate[0]+1}/${startDate[1]}/${startDate[2]}`);
    var newDate = addDaysToDate(compiledStartDate, +dateOffset);
    var dateArray = [newDate.getMonth(), newDate.getDate(), newDate.getFullYear()];
    openShiftDialogue({employee:employee,date:dateArray,start:[],end:[]});
}

function calculateTotals(table) {
    for (var i = 0; i < table.length; i++) {
        var total = 0;
        for (var j = 0; j < table[i].length; j++) {
            var cur = table[i][j];
            if (cur.length == 0) continue;
            for (var k = 0; k < cur.length; k++) {
                total += subtractTimes(cur[k][1], cur[k][0]);
            }
        }
        tbody.children[i].children[8].innerText = `${total} hour${total != 1 ? "s" : ""}`;
    }
}

function numberData() {
    data.shifts.forEach((e,i)=>e.shiftIndex = i)
}
function removeNumbers() {
    data.shifts.forEach(e=>delete e.shiftIndex);
}

function viewEmployee(e) {
    location.href = `employee/index.html?employee=${e.target.innerText}#inapp`;
}

/*
print parameters:
1: current week
2: Current week + 1
3: current week - 1
*/
function print1Week() {
    window.open(`printschedule/index.html?offset=${weekOffset}&print=1#inapp`);
}
function printPayWeek() {
    var param = 2;
    if (get2WeekNumber(convertDateArrayToDate(startDate)) == 1) {
        param = 3
    }
    window.open(`printschedule/index.html?offset=${weekOffset}&print=${param}#inapp`)
}

function fillWeeklySchedule() {
    if (!confirm("Are you sure you want to fill in this week? Doing so will clear the current week of shifts.")) return;
    window.open(`weeklyschedule/autofill/index.html?start=${startDate.join(",")}#inapp`);
}

function viewWeeklySchedule() {
    window.location = `weeklyschedule/index.html?start=${startDate.join(",")}&offset=${weekOffset}#inapp`;
}