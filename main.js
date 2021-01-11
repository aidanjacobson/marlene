const { app, BrowserWindow, ipcMain, BrowserView, dialog } = require('electron')
const {autoUpdater} = require("electron-updater");
const fs = require("fs");
const path = require('path')
const os = require('os')
var win;

app.on('ready', function()  {
  autoUpdater.checkForUpdatesAndNotify();
});

updateAppData();

function createWindow () {
  win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      enableRemoteModule: true,
    }
  })
  win.maximize();

  win.loadFile('index.html')
  win.webContents.on('new-window', function(e, url) {
    if (url.indexOf("#inapp") == -1) {
      e.preventDefault();
      require('electron').shell.openExternal(url);
    }
  });
}

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

ipcMain.on("reload", function() {
  console.log("reload");
  win.webContents.send("reload");
})

ipcMain.on("print", function(e) {
  console.log("print");
  e.sender.print({}, function(...args) {
    console.log("done");
    console.log(...args);
  });
})

function updateAppData() {
  var appDataPath = app.getPath("userData");
  var directoryPath = appDataPath;
  if (!fs.existsSync(directoryPath)) {
    fs.mkdirSync(directoryPath);
  }
  var files = ["data.txt", "favoritelinks.txt", "schedule.json", "weeklydata.json"];
  files.forEach(doUpdateFileIfNotExists);
}

function doUpdateFileIfNotExists(fileName) {
  var appDataPath = app.getPath("userData");
  var filePath = path.join(appDataPath, fileName);
  if (!fs.existsSync(filePath)) {
    var destination = filePath;
    var origin = path.join("orig", `${fileName}.orig`);
    var fileData = fs.readFileSync(origin);
    fs.writeFileSync(destination, fileData);
  }
}

/*

setInterval(function() {
  autoUpdater.checkForUpdates();
}, 60000);

autoUpdater.on('update-downloaded', (event, releaseNotes, releaseName) => {
  const dialogOpts = {
    type: 'info',
    buttons: ['Restart', 'Later'],
    title: 'Application Update',
    message: process.platform === 'win32' ? releaseNotes : releaseName,
    detail: 'A new version has been downloaded. Restart the application to apply the updates.'
  }

  dialog.showMessageBox(dialogOpts).then((returnValue) => {
    if (returnValue.response === 0) autoUpdater.quitAndInstall()
  })
})

autoUpdater.on('error', message => {
  console.error('There was a problem updating the application')
  console.error(message)
})
*/