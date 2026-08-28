const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true,
  launchChromeProfile: (folder, url) => ipcRenderer.invoke('launch-chrome-profile', { folder, url }),
  detectLocalChromeProfiles: () => ipcRenderer.invoke('detect-local-chrome-profiles'),
  openExternal: (url) => ipcRenderer.invoke('open-external', url),
  minimizeWindow: () => ipcRenderer.send('window-minimize'),
  maximizeWindow: () => ipcRenderer.send('window-maximize'),
  closeWindow: () => ipcRenderer.send('window-close')
});
