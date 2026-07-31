const { app, BrowserWindow } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const http = require('http');

let mainWindow;
let serverProcess;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    },
    title: "SafetyLink Response Console",
    icon: path.join(__dirname, 'public/vite.svg') // Change icon path if needed
  });

  // Start the server
  const serverPath = path.join(__dirname, 'dist/server.cjs');
  serverProcess = spawn(process.execPath, [serverPath], {
    env: { ...process.env, NODE_ENV: 'production' },
    stdio: 'inherit' // Optional: for debugging
  });

  // Wait for the server to be ready
  const checkServer = () => {
    http.get('http://localhost:3000/api/health', (res) => {
      if (res.statusCode === 200) {
        mainWindow.loadURL('http://localhost:3000');
      } else {
        setTimeout(checkServer, 500);
      }
    }).on('error', () => {
      setTimeout(checkServer, 500);
    });
  };

  checkServer();

  mainWindow.on('closed', function () {
    mainWindow = null;
  });
}

app.on('ready', createWindow);

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', function () {
  if (mainWindow === null) {
    createWindow();
  }
});

app.on('quit', () => {
  if (serverProcess) {
    serverProcess.kill();
  }
});
