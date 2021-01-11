const app = require("electron").remote.app;
const path = require("path");
const fs = require("fs");

var filesPath = app.getPath("userData");
async function getShiftData() {
    /*
    var response = await fetch(path);
    return await response.json();
    */
   var output = JSON.parse(fs.readFileSync(path.join(filesPath, "schedule.json"), {encoding:"utf-8"}));
   console.log(output);
   return output;
}

/*
Shift {
    employee: String,
    date: DateArray,
    start: TimeArray,
    end: TimeArray
}

DateArray [
    month: Number (in .getMonth() format),
    date: Number,
    year: Number (in .getFullYear() format)
]

TimeArray [
    hour: Number (24 hour format)
    minute: Number
]
*/

function filterShifts(data, {employee="*",startDate="*",endDate="*"}={}) {
    var shifts = data.shifts;
    if (startDate == "*" || isDateBefore(startDate, data.archives.archiveStartDate)) {
        shifts = shifts.concat(data.archives.archived);
    }
    return shifts.filter(function(shift) {
        if (employee != "*" && employee != shift.employee) {
            return false;
        }
        // at this point, employee matches
        return testDate(shift.date, startDate, endDate);
    })
}

// dates are of format [month(0-11), date(1-31), year(4digits)]

function testDate(date, startDate, endDate) {
    if (startDate == "*" && endDate == "*") {
        return true;
    }
    if (startDate == "*" && endDate != "*") {
        return isDateBefore(date, endDate);
    }
    if (startDate != "*" && endDate == "*") {
        return isDateAfter(date, startDate);
    }
    if (startDate != "*" && endDate != "*") {
        return isDateWithin(date, startDate, endDate);
    }
}

function isDateBefore(date, testAgainst) {
    if (areDateArraysEqual(date, testAgainst)) {
        return true;
    }
    if (date[2] > testAgainst[2]) {
        return false;
    }
    if (date[2] < testAgainst[2]) {
        return true;
    }
    if (date[0] > testAgainst[0]) {
        return false;
    }
    if (date[0] < testAgainst[0]) {
        return true;
    }
    if (date[1] > testAgainst[1]) {
        return false;
    }
    if (date[1] < testAgainst[1]) {
        return true;
    }
}

function isDateAfter(date, testAgainst) {
    return (!isDateBefore(date, testAgainst) || areDateArraysEqual(date, testAgainst));
}

function isDateWithin(date, testFirst, testSecond) {
    return isDateBefore(date, testSecond) && isDateAfter(date, testFirst);
}

function areDateArraysEqual(date1, date2) {
    if (date1[0] == date2[0] && date1[1] == date2[1] && date1[2] == date2[2]) {
        return true;
    } else {
        return false;
    }
}

function sortShifts(shifts) {
    return shifts.sort(function(a, b) {
        var aDate = convertDateArrayToDate(a.date).stripTime();
        var bDate = convertDateArrayToDate(b.date).stripTime();
        if (aDate < bDate) {
            return -1;
        }
        if (aDate > bDate) {
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
    })
}

function addDaysToDate(date, days) {
    var dateOffset = (24*60*60*1000)*days;
    var out = new Date();
    out.setTime(date.getTime() + dateOffset);
    return out;
}

function addDaysToDateArray(dateArray, days) {
    var date = convertDateArrayToDate(dateArray);
    var dateOffset = (24*60*60*1000)*days;
    var out = new Date();
    out.setTime(date.getTime() + dateOffset);
    return convertDateToDateArray(out);
}

function getPreviousMonday(date) {
    var daySubtracts = [6, 0, 1, 2, 3, 4, 5];
    var day = date.getDay();
    return addDaysToDate(date, -daySubtracts[day]);
}

function getPreviousMondayFromDateArray(dateArray) {
    var d = convertDateArrayToDate(dateArray);
    var m = getPreviousMonday(d);
    return convertDateToDateArray(m);
}

function get2WeekNumber(date) {
    var startingDate = getPreviousMonday(date).stripTime();
    var firstMonday = new Date("12/14/2020");
    var difference = startingDate - firstMonday;
    var weekDiff = difference / (7*24*60*60*1000);
    return Math.abs(weekDiff % 2);
}

function formatDateForInput(date) {
    var month = (date.getMonth()+1).toString().padStart(2, "0");
    var day = date.getDate().toString().padStart(2, "0");
    var year = date.getFullYear().toString().padStart(4, "0");
    return `${year}-${month}-${day}`;
}

function convertDateInputToDate(dateInputValue) {
    var date = new Date(dateInputValue);
    return addDaysToDate(date, 1).stripTime();
}

function convertDateToDateArray(date) {
    var month = date.getMonth();
    var day = date.getDate();
    var year = date.getFullYear();
    return [month, day, year];
}

function convertDateArrayToDate(dateArray) {
    return new Date(`${dateArray[0]+1}/${dateArray[1]}/${dateArray[2]}`);
}

function convertDateArrayToString(dateArray, includeYear=true) {
    if (includeYear) {
        return `${dateArray[0]+1}/${dateArray[1]}/${dateArray[2]}`;
    } else {
        return `${dateArray[0]+1}/${dateArray[1]}`;
    }
}

function subtractTimes(time1, time2) {
    var hour1 = time1[0];
    hour1 += time1[1]/60;
    var hour2 = time2[0];
    hour2 += time2[1]/60;
    return hour1 - hour2;
}

Date.prototype.stripTime = function() {
    return new Date(`${this.getMonth()+1}/${this.getDate()}/${this.getFullYear()}`);
}

function convertTimeArrayToString(timeArray, includeAPM=true) {
    var hour = timeArray[0];
    var apm = "AM";
    if (hour > 12) {
        hour -= 12;
        apm = "PM";
    }
    var minute = timeArray[1];
    hour = hour.toString();
    minute = minute.toString().padStart(2, "0");
    return `${hour}:${minute}${includeAPM ? ` ${apm}` : ""}`;
}

function saveFile(file, contents) {
    /*
    try {
        fs.writeFileSync(path.join(__dirname, file), contents);
    } catch(e) {
        alert("Error writing to the file.");
        console.trace(`Error writing to the file: ${file}`)
    }
    */
   fs.writeFileSync(path.join(filesPath, file), contents);
}

async function getFileJSON(file) {
    var response = await getFileText(file);
    return JSON.parse(response);
}

async function getFileText(file) {
    var response = fs.readFileSync(path.join(filesPath, file), {encoding:"utf-8"});
    return response;
}