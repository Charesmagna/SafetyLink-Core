const { app, BrowserWindow } = require('electron');
function createWindow() {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    title: "SafetyLink Response Console",
    autoHideMenuBar: true,
  });
  // Connects to the live deployed URL
  win.loadURL('https://ais-pre-pwn5rlen7ru3evqchy5jfc-123406259969.europe-west2.run.app');
}
app.on('ready', createWindow);
app.on('window-all-closed', () => app.quit());
