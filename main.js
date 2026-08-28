const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 850,
    minWidth: 800,
    minHeight: 600,
    backgroundColor: '#06080d',
    title: 'DREAMSLABSTUDIO // Cyber Link Launcher',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false
    }
  });

  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// IPC handler: Launch Chrome Profile natively
ipcMain.handle('launch-chrome-profile', async (event, { folder, url }) => {
  const profileDir = folder || 'Default';
  let chromePath = 'chrome.exe';

  const localAppData = process.env.LOCALAPPDATA || '';
  const progFiles = process.env.ProgramFiles || 'C:\\Program Files';
  const progFilesX86 = process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)';

  const candidatePaths = [
    path.join(progFiles, 'Google', 'Chrome', 'Application', 'chrome.exe'),
    path.join(progFilesX86, 'Google', 'Chrome', 'Application', 'chrome.exe'),
    path.join(localAppData, 'Google', 'Chrome', 'Application', 'chrome.exe')
  ];

  for (const p of candidatePaths) {
    if (fs.existsSync(p)) {
      chromePath = `"${p}"`;
      break;
    }
  }

  const cmd = `start "" ${chromePath} --profile-directory="${profileDir}" "${url}"`;
  
  return new Promise((resolve) => {
    exec(cmd, (error) => {
      if (error) {
        console.error('Launch error:', error);
        resolve({ success: false, error: error.message });
      } else {
        resolve({ success: true });
      }
    });
  });
});

// IPC handler: Auto-detect Chrome profiles from local machine
ipcMain.handle('detect-local-chrome-profiles', async () => {
  try {
    const localAppData = process.env.LOCALAPPDATA || '';
    const localStatePath = path.join(localAppData, 'Google', 'Chrome', 'User Data', 'Local State');
    
    if (!fs.existsSync(localStatePath)) {
      return { success: false, message: 'Chrome User Data not found on this machine' };
    }

    const raw = fs.readFileSync(localStatePath, 'utf8');
    const parsed = JSON.parse(raw);
    const infoCache = parsed?.profile?.info_cache || {};

    const profiles = Object.keys(infoCache).map((folderName) => {
      const pInfo = infoCache[folderName];
      return {
        folder: folderName,
        name: pInfo.name || folderName,
        userName: pInfo.user_name || '',
        avatarIcon: pInfo.avatar_icon || ''
      };
    });

    return { success: true, profiles };
  } catch (err) {
    console.error('Detect profiles error:', err);
    return { success: false, message: err.message };
  }
});

ipcMain.handle('open-external', async (event, url) => {
  await shell.openExternal(url);
  return true;
});

ipcMain.on('window-minimize', () => { if (mainWindow) mainWindow.minimize(); });
ipcMain.on('window-maximize', () => {
  if (mainWindow) {
    if (mainWindow.isMaximized()) mainWindow.unmaximize();
    else mainWindow.maximize();
  }
});
ipcMain.on('window-close', () => { if (mainWindow) mainWindow.close(); });
