window.onload = function() {
    main();
    updateFavorites();
}
var filesPath = app.getPath("userData");

var data;
async function main() {
    data = await getShiftData("schedule/schedule.json");
    var today = new Date();
    var date = convertDateToDateArray(today);
    var filtered = filterShifts(data, {startDate: date, endDate: date});
    var sorted = sortShifts(filtered);
    console.log(sorted);
    schedule.innerHTML = "";
    for (var i = 0; i < sorted.length; i++) {
        var shift = sorted[i];
        var li = document.createElement("li");
        var startTime = convertTimeArrayToString(shift.start, false);
        var endTime = convertTimeArrayToString(shift.end, false);
        var employee = shift.employee;
        var shiftText = `${employee}: ${startTime} - ${endTime}`;
        li.innerText = shiftText;
        schedule.append(li);
    }
}

function getFavoriteLinks() {
    var fileData = fs.readFileSync(path.join(filesPath, "favoritelinks.txt"), {encoding: "utf-8"});
    return fileData;
}

async function getFavorites() {
    var response = getFavoriteLinks();
    var text = response;
    var split = text.split(",");
    if (split[0] == "") {
        return [];
    } else {
        return split;
    }
}

async function updateFavorites() {
    var favorites = await getFavorites();
    favLinks.innerHTML = "";
    console.log(favorites);
    for (var i = 0; i < favorites.length; i++) {
        var link = document.createElement("div");
        link.classList.add("favLinkCard");
        link.innerText = favorites[i];
        link.onclick = doOpenFavorite;
        favLinks.append(link);
        favLinks.append(document.createElement("br"));
    }
}

function doFavToggle() {
    favLinks.classList.toggle("expanded");
    favLinks.classList.toggle("noExpand");
    if (favLinks.classList.contains("expanded")) {
        arrowFacing.innerHTML = "&#9660;";
    } else {
        arrowFacing.innerHTML = "&#9654;";
    }
}

function doOpenFavorite(e) {
    window.location = `information/index.html?selected=${encodeURIComponent(e.target.innerText)}#inapp`;
}

function admin() {
    window.open("admin/index.html#inapp");
}