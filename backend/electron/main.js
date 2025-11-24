import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';
import fs from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let backendProcess = null;
let mainWindow = null;

function startBackend() {
  const backendPath = path.join(__dirname, '..', 'index.js');
  console.log('🚀 Starting backend server...');
  
  backendProcess = spawn('node', [backendPath], {
    cwd: path.join(__dirname, '..'),
    env: { ...process.env, PORT: '5001' },
    stdio: 'inherit'
  });

  backendProcess.on('error', (err) => {
    console.error('❌ Failed to start backend:', err);
  });

  backendProcess.on('exit', (code) => {
    console.log(`Backend exited with code ${code}`);
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  console.log('⏳ Waiting for backend to start...');
  setTimeout(() => {
    mainWindow.loadURL('http://localhost:5001');
    console.log('✅ Loading application...');
  }, 2000);

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

ipcMain.handle('select-save-path', async (event, defaultFilename) => {
  const result = await dialog.showSaveDialog(mainWindow, {
    title: 'Save Export File',
    defaultPath: defaultFilename,
    filters: [
      { name: 'CSV Files', extensions: ['csv'] },
      { name: 'Excel Files', extensions: ['xlsx'] },
      { name: 'JSON Files', extensions: ['json'] },
      { name: 'All Files', extensions: ['*'] }
    ]
  });
  
  return result.filePath; 
});

ipcMain.handle('write-file', async (event, filePath, data) => {
  try {
    const buffer = Buffer.from(data);
    await fs.writeFile(filePath, buffer);
    return true;
  } catch (error) {
    console.error('Error writing file:', error);
    return false;
  }
});

app.whenReady().then(() => {
  startBackend();
  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (backendProcess) {
    console.log('🛑 Stopping backend server...');
    backendProcess.kill();
    backendProcess = null;
  }
  
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  if (backendProcess) {
    backendProcess.kill();
    backendProcess = null;
  }
});
