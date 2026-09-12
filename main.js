const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const https = require('https');
const { spawn } = require('child_process');

// Single Instance Lock: prevents duplicate processes and installer conflicts
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
  process.exit(0);
}

let mainWindow;

function getActiveHtmlPath() {
  const userHtmlPath = path.join(app.getPath('userData'), 'update', 'index.html');
  if (fs.existsSync(userHtmlPath)) {
    try {
      const stat = fs.statSync(userHtmlPath);
      if (stat.size > 5000) {
        return userHtmlPath;
      }
    } catch (e) {}
  }
  return path.join(__dirname, 'index.html');
}

function getWindowIcon() {
  const candidates = [
    path.join(__dirname, 'app_icon.ico'),
    path.join(__dirname, 'app_icon.png'),
    path.join(__dirname, 'favicon.png'),
    path.join(process.resourcesPath || '', 'app_icon.ico'),
    path.join(process.resourcesPath || '', 'app_icon.png')
  ];
  for (const c of candidates) {
    try { if (fs.existsSync(c)) return c; } catch(e) {}
  }
  return undefined;
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1320,
    height: 900,
    minWidth: 950,
    minHeight: 650,
    backgroundColor: '#06080d',
    icon: getWindowIcon(),
    title: 'DreamsLab Cyber Launcher',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true // Security Hardening: Enable standard SOP and web security
    }
  });

  mainWindow.loadFile(getActiveHtmlPath());

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    try {
      const parsed = new URL(url);
      if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
        shell.openExternal(url);
      }
    } catch(e) {}
    return { action: 'deny' };
  });
}

function checkBackgroundUpdate() {
  const updateUrl = 'https://raw.githubusercontent.com/abdullahinayat24-lang/link-launcher/main/index.html?t=' + Date.now();
  https.get(updateUrl, (res) => {
    if (res.statusCode !== 200) return;
    let rawData = '';
    res.on('data', chunk => rawData += chunk);
    res.on('end', () => {
      try {
        if (!rawData || rawData.length < 5000) return;
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

        if (currentContent.trim() !== rawData.trim()) {
          fs.writeFileSync(userHtmlPath, rawData, 'utf8');
          console.log('Background update saved to user data directory!');
          if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('background-update-ready', { message: 'Latest update downloaded in background!' });
          }
        }
      } catch (e) {
        console.error('Background update check notice:', e.message);
      }
    });
  }).on('error', () => {});
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });

  // Background auto-update check 4s after startup
  setTimeout(() => {
    checkBackgroundUpdate();
  }, 4000);
});

app.on('second-instance', () => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// Chrome path resolution helper
function findChromeExecutable() {
  const localAppData = process.env.LOCALAPPDATA || '';
  const progFiles = process.env.ProgramFiles || 'C:\\Program Files';
  const progFilesX86 = process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)';

  const candidatePaths = [
    path.join(progFiles, 'Google', 'Chrome', 'Application', 'chrome.exe'),
    path.join(progFilesX86, 'Google', 'Chrome', 'Application', 'chrome.exe'),
    path.join(localAppData, 'Google', 'Chrome', 'Application', 'chrome.exe')
  ];

  for (const p of candidatePaths) {
    try {
      if (fs.existsSync(p)) return p;
    } catch(e) {}
  }
  return null;
}

function findChromeUserDataDir() {
  const localAppData = process.env.LOCALAPPDATA || '';
  const appData = process.env.APPDATA || '';
  const candidates = [
    path.join(localAppData, 'Google', 'Chrome', 'User Data'),
    path.join(appData, 'Google', 'Chrome', 'User Data')
  ];
  for (const c of candidates) {
    try {
      if (fs.existsSync(c)) return c;
    } catch(e) {}
  }
  return null;
}

// IPC: Chrome launch (with dynamic email-to-folder resolution and safe spawn)
ipcMain.handle('launch-chrome-profile', async (event, { folder, url, email }) => {
  let profileDir = 'Default';
  const userDataDir = findChromeUserDataDir();

  // If email is provided, dynamically resolve local Chrome folder from Local State
  if (email && typeof email === 'string' && email.trim() && userDataDir) {
    try {
      const localStatePath = path.join(userDataDir, 'Local State');
      if (fs.existsSync(localStatePath)) {
        const localStateRaw = fs.readFileSync(localStatePath, 'utf8');
        const localState = JSON.parse(localStateRaw);
        const profileInfoCache = localState.profile?.info_cache || {};
        const targetEmail = email.toLowerCase().trim();
        let matched = false;
        for (const [fName, info] of Object.entries(profileInfoCache)) {
          const uEmail = (info.user_name || info.hosted_domain || '').toLowerCase().trim();
          if (uEmail && uEmail === targetEmail) {
            profileDir = fName;
            matched = true;
            console.log(`Matched email ${email} to Chrome profile folder: ${profileDir}`);
            break;
          }
        }
        if (!matched && folder && !folder.startsWith('Profile')) {
          profileDir = folder;
        }
      }
    } catch(e) {
      console.warn('Email resolution warning:', e.message);
    }
  } else if (folder) {
    profileDir = folder;
  }

  const chromeExe = findChromeExecutable() || 'chrome.exe';
  const targetUrl = (url && typeof url === 'string' && url.trim()) ? url.trim() : 'chrome://newtab';

  // Sanitize target URL
  try {
    const parsed = new URL(targetUrl);
    if (!['http:', 'https:', 'chrome:'].includes(parsed.protocol)) {
      return { success: false, error: 'Invalid URL protocol' };
    }
  } catch(e) {
    if (!targetUrl.startsWith('chrome://')) {
      return { success: false, error: 'Invalid URL format' };
    }
  }

  // Security Hardening: Use spawn with argument array rather than shell string concatenation
  const args = [`--profile-directory=${profileDir}`, targetUrl];
  console.log('Launching Chrome securely with spawn:', chromeExe, args);

  return new Promise((resolve) => {
    try {
      const child = spawn(chromeExe, args, {
        detached: true,
        stdio: 'ignore'
      });
      child.unref();
      resolve({ success: true, folder: profileDir });
    } catch (error) {
      console.error('Chrome spawn error:', error.message);
      resolve({ success: false, error: error.message });
    }
  });
});

// IPC: Chrome profile detection with structured diagnostics
ipcMain.handle('detect-local-chrome-profiles', async () => {
  try {
    const chromeExe = findChromeExecutable();
    const chromeUserData = findChromeUserDataDir();

    if (!chromeExe && !chromeUserData) {
      return {
        success: false,
        status: 'CHROME_NOT_INSTALLED',
        profiles: [],
        error: 'Google Chrome is not installed on this computer.'
      };
    }

    if (!chromeUserData) {
      return {
        success: false,
        status: 'NO_PROFILES',
        profiles: [],
        error: 'Chrome User Data directory not found.'
      };
    }

    const localStatePath = path.join(chromeUserData, 'Local State');
    if (!fs.existsSync(localStatePath)) {
      return {
        success: false,
        status: 'NO_PROFILES',
        profiles: [],
        error: 'Chrome Local State file not found (Chrome has not been initialized on this user profile yet).'
      };
    }

    let localState;
    try {
      const localStateRaw = fs.readFileSync(localStatePath, 'utf8');
      localState = JSON.parse(localStateRaw);
    } catch(parseErr) {
      return {
        success: false,
        status: 'DETECTION_FAILED',
        profiles: [],
        error: 'Failed to parse Chrome Local State: ' + parseErr.message
      };
    }

    const profileInfoCache = localState.profile?.info_cache || {};
    const detectedProfiles = [];
    let hasProfilesWithEmail = false;

    for (const [folderName, info] of Object.entries(profileInfoCache)) {
      const email = (info.user_name || info.hosted_domain || '').toLowerCase().trim();
      const name = info.name || folderName;
      if (email) hasProfilesWithEmail = true;
      detectedProfiles.push({
        folder: folderName,
        name: name,
        email: email,
        avatarIcon: info.avatar_icon || ''
      });
    }

    if (detectedProfiles.length === 0) {
      return {
        success: true,
        status: 'NO_PROFILES',
        profiles: [],
        error: 'No Chrome profiles found in Local State.'
      };
    }

    if (!hasProfilesWithEmail) {
      return {
        success: true,
        status: 'NO_EMAILS',
        profiles: detectedProfiles,
        error: 'Chrome profiles were detected, but none are signed into a Google Account.'
      };
    }

    return {
      success: true,
      status: 'PROFILES_FOUND',
      profiles: detectedProfiles
    };
  } catch (err) {
    return {
      success: false,
      status: 'DETECTION_FAILED',
      profiles: [],
      error: err.message
    };
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
          if (!rawData || rawData.length < 5000) {
            return resolve({ success: false, error: 'Received invalid update package' });
          }
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
            return resolve({ success: true, updated: false, version: 'v1.0.6', message: 'You are already running the latest version (v1.0.6)' });
          }

          fs.writeFileSync(userHtmlPath, rawData, 'utf8');
          resolve({ success: true, updated: true, version: 'v1.0.6', message: 'Successfully updated to latest version v1.0.6!' });
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

// IPC: Reset Local Vault & Backup
ipcMain.handle('reset-local-vault', async () => {
  try {
    const docs = app.getPath('documents');
    const backupPath = path.join(docs, 'DreamsLab Backup', 'DreamsLab_Vault_Backup.json');
    if (fs.existsSync(backupPath)) {
      fs.unlinkSync(backupPath);
      console.log('Local documents backup deleted on reset:', backupPath);
    }
    return { success: true };
  } catch (e) {
    return { success: false, error: e.message };
  }
});

// Security Hardening: Validate protocol in open-external
ipcMain.handle('open-external', async (event, url) => {
  try {
    if (!url || typeof url !== 'string') return false;
    const parsed = new URL(url);
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      shell.openExternal(url);
      return true;
    }
  } catch(e) {}
  return false;
});
