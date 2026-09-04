const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true,
  launchChromeProfile: (folder, url) => ipcRenderer.invoke('launch-chrome-profile', { folder, url }),
  detectLocalChromeProfiles: () => ipcRenderer.invoke('detect-local-chrome-profiles'),
  openExternal: (url) => ipcRenderer.invoke('open-external', url),
  checkAndApplyUpdate: () => ipcRenderer.invoke('check-and-apply-update'),
  saveToDocuments: (dataStr) => ipcRenderer.invoke('save-to-documents', dataStr),
  restoreFromDocuments: () => ipcRenderer.invoke('restore-from-documents')
});
