const { app, BrowserWindow, ipcMain, dialog, Menu } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

let mainWindow, pyServer;

const menuTemplate = [
  {
    label: 'File',
    submenu: [{ role: 'quit', label: 'Exit Sticker Maker' }]
  },
  {
    label: 'View',
    submenu: [{ role: 'reload' }, { role: 'toggleDevTools' }]
  },
  {
    label: 'Help',
    submenu: [{ 
      label: 'About', 
      click: () => dialog.showMessageBox({ title: 'About', message: 'Local AI Sticker Maker v1.0.0\nFully offline, privacy-first.' })
    }]
  }
];

app.whenReady().then(() => {
  Menu.setApplicationMenu(Menu.buildFromTemplate(menuTemplate));
  
  pyServer = spawn('python', ['api/app.py']);
  
  mainWindow = new BrowserWindow({
    width: 1000, height: 750,
    webPreferences: { preload: path.join(__dirname, 'preload.js') }
  });
  mainWindow.loadFile('ui/index.html');
});

app.on('window-all-closed', () => {
  if (pyServer) pyServer.kill();
  app.quit();
});

ipcMain.handle('select-image', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    filters: [{ name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'webp'] }]
  });
  return canceled ? null : filePaths[0];
});
