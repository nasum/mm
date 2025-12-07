import { app, shell, BrowserWindow, ipcMain, dialog } from 'electron'
import { join } from 'path'
import path from 'path'
import fs from 'fs-extra'
import { initDatabase, getAllMedia, clearAllMedia } from './database'
import { initWatcher } from './watcher'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'

interface StoreSchema {
  libraryPath: string;
}

let store: any; // Using any to avoid type issues with dynamic import
let watcher: any = null;
let mainWindow: BrowserWindow | null = null;

function restartWatcher(libraryPath: string) {
  if (watcher) {
    watcher.close();
  }
  if (mainWindow) {
    watcher = initWatcher(libraryPath, mainWindow);
  }
}

function createWindow(): void {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      webSecurity: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  const libraryPath = store.get('libraryPath');
  restartWatcher(libraryPath);
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(async () => {
  // Initialize electron-store dynamically
  const { default: Store } = await import('electron-store');
  store = new Store<StoreSchema>({
    defaults: {
      libraryPath: path.join(process.cwd(), 'library')
    }
  });

  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  initDatabase();

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC handlers
  ipcMain.handle('get-all-media', () => {
    return getAllMedia();
  });

  ipcMain.handle('import-media', async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      properties: ['openFile', 'multiSelections'],
      filters: [
        { name: 'Media', extensions: ['jpg', 'jpeg', 'png', 'gif', 'mp4', 'mov', 'webm'] }
      ]
    });

    if (!canceled) {
      const libraryPath = store.get('libraryPath');
      for (const filepath of filePaths) {
        const filename = path.basename(filepath);
        const dest = path.join(libraryPath, filename);
        await fs.copy(filepath, dest);
      }
    }
  });

  ipcMain.handle('get-settings', () => {
    return {
      libraryPath: store.get('libraryPath')
    };
  });

  ipcMain.handle('set-library-path', (_, newPath: string) => {
    store.set('libraryPath', newPath);
    clearAllMedia();
    restartWatcher(newPath);
    return true;
  });

  ipcMain.handle('dialog:openDirectory', async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      properties: ['openDirectory']
    });
    if (canceled) {
      return null;
    } else {
      return filePaths[0];
    }
  });

  // Verify library path on start
  const libraryPath = store.get('libraryPath');
  fs.ensureDirSync(libraryPath);

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
