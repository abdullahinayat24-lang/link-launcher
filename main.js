const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const https = require('https');
const { exec } = require('child_process');

let mainWindow;

function getActiveHtmlPath() {
  const userHtmlPath = path.join(app.getPath('userData'), 'update', 'index.html');
  if (fs.existsSync(userHtmlPath)) {
    return userHtmlPath;
  }
  return path.join(__dirname, 'index.html');
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1320,
    height: 900,
    minWidth: 950,
    minHeight: 650,
    backgroundColor: '#06080d',
    title: 'DREAMSLABSTUDIO // Cyber Link Launcher v1.0.3',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false
    }
  });

  mainWindow.loadFile(getActiveHtmlPath());

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

// IPC: Chrome launch
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

  const targetUrl = url || 'chrome://newtab';
  const cmd = `start "" ${chromePath} --profile-directory="${profileDir}" "${targetUrl}"`;
  
  return new Promise((resolve) => {
    exec(cmd, (error) => {
      if (error) {
        resolve({ success: false, error: error.message });
      } else {
        resolve({ success: true });
      }
    });
  });
});

// IPC: Chrome profiles
ipcMain.handle('detect-local-chrome-profiles', async () => {
  try {
    const localAppData = process.env.LOCALAPPDATA || '';
    const chromeUserData = path.join(localAppData, 'Google', 'Chrome', 'User Data');
    const localStatePath = path.join(chromeUserData, 'Local State');

    if (!fs.existsSync(localStatePath)) {
      return { success: false, error: 'Chrome Local State not found' };
    }

    const localStateRaw = fs.readFileSync(localStatePath, 'utf8');
    const localState = JSON.parse(localStateRaw);
    const profileInfoCache = localState.profile?.info_cache || {};

    const detectedProfiles = [];

    for (const [folderName, info] of Object.entries(profileInfoCache)) {
      const email = info.user_name || info.hosted_domain || '';
      const name = info.name || folderName;
      detectedProfiles.push({
        folder: folderName,
        name: name,
        email: email
      });
    }

    return { success: true, profiles: detectedProfiles };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// IPC: Live Self-Updating from GitHub (Writes to UserData/update for ASAR compatibility)
ipcMain.handle('check-and-apply-update', async () => {
  return new Promise((resolve) => {
    const updateUrl = 'https://raw.githubusercontent.com/abdullahinayat24-lang/link-launcher/main/index.html?t=' + Date.now();
    https.get(updateUrl, (res) => {
      if (res.statusCode !== 200) {
        return resolve({ success: false, error: 'GitHub returned HTTP ' + res.statusCode });
      }
      let rawData = '';
      res.on('data', chunk => rawData += chunk);
      res.on('end', () => {
        try {
          const updateDir = path.join(app.getPath('userData'), 'update');
          if (!fs.existsSync(updateDir)) fs.mkdirSync(updateDir, { recursive: true });
          const userHtmlPath = path.join(updateDir, 'index.html');

          let currentContent = '';
          if (fs.existsSync(userHtmlPath)) {
            currentContent = fs.readFileSync(userHtmlPath, 'utf8');
          } else {
            const bundledPath = path.join(__dirname, 'index.html');
            if (fs.existsSync(bundledPath)) {
              try { currentContent = fs.readFileSync(bundledPath, 'utf8'); } catch(e) {}
            }
          }

          if (currentContent.trim() === rawData.trim()) {
            return resolve({ success: true, updated: false, version: 'v1.0.3', message: 'You are running the latest version (v1.0.3)' });
          }

          fs.writeFileSync(userHtmlPath, rawData, 'utf8');
          resolve({ success: true, updated: true, version: 'v1.0.3', message: 'Successfully updated to latest version v1.0.3!' });
        } catch (e) {
          resolve({ success: false, error: e.message });
        }
      });
    }).on('error', (err) => {
      resolve({ success: false, error: err.message });
    });
  });
});

// IPC: Documents Auto-Backup
ipcMain.handle('save-to-documents', async (event, dataStr) => {
  try {
    const docs = app.getPath('documents');
    const backupDir = path.join(docs, 'DreamsLab Backup');
    if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });
    const backupPath = path.join(backupDir, 'DreamsLab_Vault_Backup.json');
    fs.writeFileSync(backupPath, dataStr, 'utf8');
    return { success: true, path: backupPath };
  } catch (e) {
    return { success: false, error: e.message };
  }
});

// IPC: Documents Auto-Restore
ipcMain.handle('restore-from-documents', async () => {
  try {
    const docs = app.getPath('documents');
    const backupPath = path.join(docs, 'DreamsLab Backup', 'DreamsLab_Vault_Backup.json');
    if (fs.existsSync(backupPath)) {
      const content = fs.readFileSync(backupPath, 'utf8');
      return { success: true, content, path: backupPath };
    }
    return { success: false, error: 'No backup found in Documents\\DreamsLab Backup' };
  } catch (e) {
    return { success: false, error: e.message };
  }
});

ipcMain.handle('open-external', async (event, url) => {
  shell.openExternal(url);
  return true;
});
