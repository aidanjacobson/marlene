const fs = require("fs");
const path = require("path");
const electron = require("electron");
const paths = {
    INFORMATION_DATA_TXT: "information/data.txt",
    SCHEDULE_JSON: "schedule/schedule.json",
    WEEKLY_JSON: "schedule/weeklyschedule/weeklydata.json",
    FAVORITE_LINKS_TXT: "information/favoritelinks.txt"
}
const dialog = electron.remote.dialog;
async function exportFile(filePath) {
    var normalPath = path.join(__dirname, "..", filePath);
    var defaultName = path.parse(normalPath).base;
    var selection = await dialog.showSaveDialog({properties: ["openFile"], defaultPath: defaultName});
    if (selection.canceled) return;
    console.log(selection);
    var savePath = selection.filePath;
    var fileData = fs.readFileSync(normalPath);
    fs.writeFileSync(savePath, fileData);
}

async function importFile(filePath) {
    var normalPath = path.join(__dirname, "..", filePath);
    var selection = await dialog.showOpenDialog({properties: ["openFile"]});
    if (selection.canceled) return;
    console.log(selection);
    var fileData = fs.readFileSync(selection.filePaths[0]);
    fs.writeFileSync(normalPath, fileData);
}