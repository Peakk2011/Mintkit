const { app, BrowserWindow, Menu } = require('electron');
const path = require('node:path');
const isDev = require('electron-is-dev');

if (require('electron-squirrel-startup')) {
  app.quit();
}

if (isDev) {
  require('electron-reload')(__dirname, {
    electron: path.join(__dirname, '..', 'node_modules', 'electron', 'dist', 'electron.exe'),
    hardResetMethod: 'exit'
  });
}

app.commandLine.appendSwitch('--enable-features', 'VaapiVideoDecoder');
app.commandLine.appendSwitch('--disable-features', 'VizDisplayCompositor');
app.commandLine.appendSwitch('--enable-gpu-rasterization');
app.commandLine.appendSwitch('--enable-zero-copy');
app.commandLine.appendSwitch('--ignore-gpu-blacklist');
app.commandLine.appendSwitch('--enable-accelerated-2d-canvas');
app.commandLine.appendSwitch('--enable-native-gpu-memory-buffers');

const createWindow = () => {
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 950,
    minWidth: 420,
    minHeight: 600,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      webSecurity: true,
      backgroundThrottling: false,
      experimentalFeatures: true,
      v8CacheOptions: 'code',
    },
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'hidden',
    ...(process.platform === 'win32' && {
      titleBarOverlay: {
        color: '#141414',
        symbolColor: '#ffffff',
        height: 40
      }
    })
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:3000');
  } else {
    mainWindow.loadFile(path.join(__dirname, 'index.html'));
  }

  if (isDev) {
    mainWindow.webContents.on('did-finish-load', () => {
      console.log('Window loaded successfully');
    });

    mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
      console.error('Failed to load:', errorDescription);
    });
  }

  if (!isDev) {
    Menu.setApplicationMenu(null);
  }

  return mainWindow;
};

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('web-contents-created', (event, contents) => {
  contents.on('new-window', (navigationEvent, url) => {
    navigationEvent.preventDefault();
    console.log('Blocked new window:', url);
  });
});

app.on('before-quit', () => {
  const windows = BrowserWindow.getAllWindows();
  windows.forEach(window => {
    if (window && !window.isDestroyed()) {
      window.removeAllListeners();
    }
  });
});

if (isDev) {
  app.on('certificate-error', (event, webContents, url, error, certificate, callback) => {
    event.preventDefault();
    callback(true);
  });
}

if (!isDev) {
  app.on('render-process-gone', (event, webContents, details) => {
    console.log('Render process gone:', details);
  });
}