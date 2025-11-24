// Preload script for Electron
const { contextBridge, ipcRenderer } = require('electron');

// Expose file dialog and file system API to renderer
contextBridge.exposeInMainWorld('electronAPI', {
  selectSavePath: (defaultFilename) => ipcRenderer.invoke('select-save-path', defaultFilename),
  writeFile: (filePath, data) => ipcRenderer.invoke('write-file', filePath, data)
});
