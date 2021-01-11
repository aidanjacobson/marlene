var data;
var employee;
var shifts;
var days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
window.onload = async function() {
    data = await getShiftData();
    var params = new URLSearchParams(location.search);
    employee = params.get("employee");
    header.innerText = `Shifts for ${employee}`;
    setPayWeek();
}

function updateShiftList() {
    shiftList.innerHTML = "";
    var startingDate = convertDateToDateArray(convertDateInputToDate(startDateInput.value));
    var endingDate = convertDateToDateArray(convertDateInputToDate(endDateInput.value));
    shifts = filterShifts(data, {employee:employee,startDate:startingDate,endDate:endingDate});
    shifts = sortShifts(shifts);
    for (var i = 0; i < shifts.length; i++) {
        var li = document.createElement("li");
        li.innerText = formatShift(shifts[i]);
        shiftList.append(li);
    }
    updateTotal(shifts);
}

function formatShift(shift) {
    var date = convertDateArrayToDate(shift.date);
    var dateString = `${days[date.getDay()]} ${date.getMonth()+1}/${date.getDate()}`;
    var timeStartString = convertTimeArrayToTimeString(shift.start);
    var timeEndString = convertTimeArrayToTimeString(shift.end);
    var formatted = `${dateString}: ${timeStartString} - ${timeEndString}`;
    return formatted;
}

function convertTimeArrayToTimeString(timeArray) {
    var hour = timeArray[0];
    if (hour > 12) hour -= 12;
    hour = hour.toString();
    var minute = timeArray[1].toString().padStart(2, "0");
    return `${hour}:${minute}`;
}

function updateTotal(shifts) {
    var t = 0;
    for (var i = 0; i < shifts.length; i++) {
        var diff = subtractTimes(shifts[i].end, shifts[i].start);
        t += diff;
    }
    var hourString = t != 1 ? "hours" : "hour";
    var formatted = `${t} ${hourString}`;
    total.innerText = formatted;
}

function setPayWeek() {
    var today = new Date();
    var weekNum = get2WeekNumber(today);
    var tempStartingDate = addDaysToDate(getPreviousMonday(today), -weekNum*7)
    var tempEndingDate = addDaysToDate(tempStartingDate, 13);
    startDateInput.value = formatDateForInput(tempStartingDate);
    endDateInput.value = formatDateForInput(tempEndingDate);
    updateShiftList();
}

function setThisWeek() {
    var today = new Date();
    var tempStartingDate = getPreviousMonday(today);
    var tempEndingDate = addDaysToDate(tempStartingDate, 6);
    startDateInput.value = formatDateForInput(tempStartingDate);
    endDateInput.value = formatDateForInput(tempEndingDate);
    updateShiftList();
}

function text() {
    var hours = [];
    for(var i = 0; i < shifts.length; i++) {
        var day = days[convertDateArrayToDate(shifts[i].date).getDay()];
        var sformat = convertTimeArrayToTimeString(shifts[i].start);
        var eformat = convertTimeArrayToTimeString(shifts[i].end);
        hours.push(`${day} ${sformat}-${eformat}`);
    }
    var output = `Hey ${employee} here are your hours this week:\n${hours.join("\n")}`;
    preview.innerText = output;
    var textOut = `sms:;?&body=${encodeURIComponent(output)}`;
    console.log(textOut);
    qr.src = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(textOut)}`;
    qrholder.removeAttribute("hidden");
}