const { app, BrowserWindow } = require('electron');
function createWindow() {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    title: "SafetyLink Response Console",
    autoHideMenuBar: true,
  });
  // Connects to the live deployed URL
  win.loadURL('https://ais-pre-7giumhpixkkmwnncr4week-170895240953.europe-west1.run.app');
}
app.on('ready', createWindow);
app.on('window-all-closed', () => app.quit());
