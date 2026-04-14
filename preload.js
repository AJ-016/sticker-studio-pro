const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('api', {
  selectImage: () => ipcRenderer.invoke('select-image')
});
