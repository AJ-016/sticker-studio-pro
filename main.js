const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

let mainWindow, pyServer;

app.whenReady().then(() => {
  pyServer = spawn('python', ['api/app.py']);
  
  mainWindow = new BrowserWindow({
    width: 900, height: 750,
    webPreferences: { preload: path.join(__dirname, 'preload.js') },
    autoHideMenuBar: true
  });
  mainWindow.loadFile('ui/index.html');
});

app.on('window-all-closed', () => {
  if (pyServer) pyServer.kill();
  app.quit();
});

ipcMain.handle('select-image', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    filters: [{ name: 'Images', extensions: ['png', 'jpg', 'jpeg'] }]
  });
  return canceled ? null : filePaths[0];
});
