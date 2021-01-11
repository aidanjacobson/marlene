var dayNames = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
async function getWeeklyData() {
    return await getFileJSON("weeklydata.json");
}



function compileRules(data, dayToTest) {
    var rules = [];
    var today = dayToTest;
    for (var i = 0; i < data.rules.length; i++) {
        rules[i] = data.rules[i];
    }
    for (var i = 0; i < data.exceptions.length; i++) {
        var current = data.exceptions[i];
        var startingDay = getPreviousMondayFromDateArray(current.startDate);
        var endingDay = addDaysToDateArray(startingDay, current.weeks*7-1);
        if ((current.weeks == -1 && isDateAfter(today, addDaysToDateArray(startingDay, current.shift.day))) || isDateWithin(addDaysToDateArray(today, current.shift.day), startingDay, endingDay)) {
            if (current.type == "add") {
                rules.push(current.shift);
            } else {
                var lookingFor = data.exceptions[i].shift;
                var shiftIndex = data.rules.findIndex(rule=>areShiftsEqual(rule, lookingFor));
                if (typeof shiftIndex !== "undefined") {
                    rules.splice(shiftIndex, 1);
                }
            }
        }
    }
    processLongtermExceptions(data);
    saveRules(data);
    return rules;
}

function processLongtermExceptions(data) {
    var today = convertDateToDateArray(new Date());
    console.log("plte", today);
    for (var i = 0; i < data.exceptions.length; i++) {
        if (data.exceptions[i].weeks != -1) {
            var startingDay = getPreviousMondayFromDateArray(data.exceptions[i].startDate);
            var endingDay = addDaysToDateArray(startingDay, data.exceptions[i].weeks*7-1);
            if (isDateAfter(today, endingDay) && !areDateArraysEqual(today, endingDay)) {
                data.exceptions.splice(i, 1);
                i--;
            }
            continue;
        }
        console.log(today, !isDateBefore(data.exceptions[i].startDate, today))
        if (!isDateBefore(data.exceptions[i].startDate, today)) continue;
        if (data.exceptions[i].type == "add") {
            data.rules.push(data.exceptions[i].shift);
        } else {
            var lookingFor = data.exceptions[i].shift;
            var shiftIndex = data.rules.findIndex(function(rule) {
                return areShiftsEqual(rule, lookingFor);
            });
            if (typeof shiftIndex !== "undefined") {
                data.rules.splice(shiftIndex, 1);
            }
        }
        data.exceptions.splice(i, 1);
        i--;
    }
}

function areShiftsEqual(a, b) {
    if (a.employee != b.employee) return false;
    if (a.day != b.day) return false;
    if (a.start[0] != b.start[0]) return false;
    if (a.start[1] != b.start[1]) return false;
    if (a.end[0] != b.end[0]) return false;
    if (a.end[1] != b.end[1]) return false;
    return true;
}

function saveRules(data) {
    saveFile("weeklydata.json", JSON.stringify(data));
}