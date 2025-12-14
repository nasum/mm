import { app, shell, BrowserWindow, ipcMain, dialog } from 'electron'
import { join } from 'path'
import path from 'path'
import fs from 'fs-extra'
import { initDatabase, getAllMedia, clearAllMedia, getAllTags, createTag, addTagToMedia, removeTagFromMedia } from './database'
import { initWatcher } from './watcher'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'

// Custom Data Path Logic
const defaultUserDataPath = app.getPath('userData');
const pointerFilePath = path.join(defaultUserDataPath, 'data-path.json');

try {
  if (fs.existsSync(pointerFilePath)) {
    const pointerData = fs.readJSONSync(pointerFilePath);
    if (pointerData.customPath) {
      console.log('Using custom user data path:', pointerData.customPath);
      app.setPath('userData', pointerData.customPath);
    }
  }
} catch (error) {
  console.error('Failed to load custom data path:', error);
}

// Register privileged scheme BEFORE app.whenReady
const { protocol } = require('electron')
protocol.registerSchemesAsPrivileged([
  {
    scheme: 'media',
    privileges: {
      secure: true,
      supportFetchAPI: true,
      bypassCSP: true,
      corsEnabled: true,
      stream: true
    }
  }
])

interface StoreSchema {
  libraryPath: string;
  windowBounds?: {
    width: number;
    height: number;
    x: number;
    y: number;
  };
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
  const bounds = store.get('windowBounds');

  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: bounds?.width || 900,
    height: bounds?.height || 670,
    x: bounds?.x,
    y: bounds?.y,
    show: false,
    autoHideMenuBar: true,
    icon,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      webSecurity: false
    }
  })

  mainWindow.on('close', () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      const bounds = mainWindow.getBounds();
      store.set('windowBounds', bounds);
    }
  });

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

  // Protocol handler for media files
  const { protocol, net } = require('electron');
  protocol.handle('media', (request) => {
    const url = request.url.replace('media://', '');
    const decodedUrl = decodeURIComponent(url);
    
    try {
      let filePath = decodedUrl;
      
      // If path starts with slash but looks like a Windows path (e.g. /C:/...), remove the slash
      if (process.platform === 'win32') {
         if (filePath.startsWith('/') && /[a-zA-Z]:/.test(filePath.slice(1, 3))) {
           filePath = filePath.slice(1);
         }
         // Fallback: if we somehow got "C/Users" (missing colon), try to fix it? 
         // But the fix in MediaGrid should prevent this. 
         // Let's just trust that the MediaGrid fix ensures we get /C:/...
      }
      
      const fileUrl = path.join(filePath);
      // Ensure file protocol has 3 slashes for Windows absolute paths
      const finalUrl = 'file:///' + fileUrl.replace(/\\/g, '/');
      

      
      return net.fetch(finalUrl);
    } catch (e) {
      console.error('Media protocol error:', e);
      return new Response('Error loading file', { status: 404 });
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
        { name: 'Media', extensions: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'mp4', 'mov', 'webm', 'mkv', 'avi'] }
      ]
    });

    if (!canceled) {
      const libraryPath = store.get('libraryPath');
      for (const filepath of filePaths) {
        const ext = path.extname(filepath).toLowerCase();
        const filename = path.basename(filepath);
        
        let subDir = '';
        if (['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'].includes(ext)) {
          subDir = 'images';
        } else if (['.mp4', '.mov', '.webm', '.mkv', '.avi'].includes(ext)) {
          subDir = 'movies';
        }

        if (subDir) {
            const destDir = path.join(libraryPath, subDir);
            await fs.ensureDir(destDir);
            const dest = path.join(destDir, filename);
            await fs.copy(filepath, dest);
        }
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

  ipcMain.handle('delete-media', async (_, filepath: string) => {
    try {
      await fs.remove(filepath);
      return true;
    } catch (error) {
      console.error('Failed to delete media:', error);
      return false;
    }
  });

  ipcMain.handle('add-dropped-files', async (_, filePaths: string[]) => {
    try {
      const libraryPath = store.get('libraryPath');
      const results: boolean[] = [];
      const imageExts = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'];
      const videoExts = ['.mp4', '.mov', '.webm', '.mkv', '.avi'];

      const processRecursive = async (sourcePath: string, relativeTargetDir: string): Promise<boolean> => {
        try {
          const stats = await fs.stat(sourcePath);
          if (stats.isDirectory()) {
            const currentDirName = path.basename(sourcePath);
            const nextRelative = path.join(relativeTargetDir, currentDirName);
            const children = await fs.readdir(sourcePath);
            for (const child of children) {
              await processRecursive(path.join(sourcePath, child), nextRelative);
            }
            return true;
          } else {
            const ext = path.extname(sourcePath).toLowerCase();
            let subDir = '';
            if (imageExts.includes(ext)) subDir = 'images';
            else if (videoExts.includes(ext)) subDir = 'movies';

            if (subDir) {
              const filename = path.basename(sourcePath);
              
              if (mainWindow) {
                mainWindow.webContents.send('import-progress', {
                  status: 'processing',
                  filename: filename
                });
              }

              const destDir = path.join(libraryPath, subDir, relativeTargetDir);
              await fs.ensureDir(destDir);
              const dest = path.join(destDir, filename);
              await fs.copy(sourcePath, dest);
              return true;
            }
            return false;
          }
        } catch (error) {
           console.error('Error processing item:', error);
           if (mainWindow) {
             mainWindow.webContents.send('import-progress', {
               status: 'error',
               filename: path.basename(sourcePath),
               error: String(error)
             });
           }
           return false;
        }
      };

      const processEntry = async (entryPath: string) => {
        const stats = await fs.stat(entryPath);
        if (stats.isDirectory()) {
          const dirName = path.basename(entryPath);
          const children = await fs.readdir(entryPath);
          for (const child of children) {
            await processRecursive(path.join(entryPath, child), dirName);
          }
          return true;
        } else {
          return await processRecursive(entryPath, '');
        }
      }

      for (const filepath of filePaths) {
         results.push(await processEntry(filepath));
      }
      return results;
    } catch (error) {
      console.error('Failed to add dropped files:', error);
      // Return false for all if catastrophic failure
      return filePaths.map(() => false);
    }
  });

  ipcMain.handle('show-item-in-folder', (_, filepath: string) => {
    shell.showItemInFolder(filepath);
  });

  ipcMain.handle('create-directory', async (_, dirPath: string) => {
    try {
      await fs.ensureDir(dirPath);
      return true;
    } catch (error) {
      console.error('Failed to create directory:', error);
      return false;
    }
  });


  ipcMain.handle('rename-media', async (_, { oldPath, newPath }: { oldPath: string, newPath: string }) => {
    try {
      await fs.rename(oldPath, newPath);
      return true;
    } catch (error) {
      console.error('Failed to rename media:', error);
      return false;
    }
  });

  // Tag IPC handlers
  ipcMain.handle('get-tags', () => {
    return getAllTags();
  });

  ipcMain.handle('create-tag', (_, name: string) => {
    return createTag(name);
  });

  ipcMain.handle('add-tag-to-media', (_, { mediaId, tagId }: { mediaId: number, tagId: number }) => {
    const result = addTagToMedia(mediaId, tagId);
    if (mainWindow) mainWindow.webContents.send('media-updated');
    return result;
  });

  ipcMain.handle('remove-tag-from-media', (_, { mediaId, tagId }: { mediaId: number, tagId: number }) => {
    const result = removeTagFromMedia(mediaId, tagId);
    if (mainWindow) mainWindow.webContents.send('media-updated');
    return result;
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

  // User Data Path Handlers
  ipcMain.handle('get-user-data-path', () => {
    return app.getPath('userData');
  });

  ipcMain.handle('open-user-data-folder', () => {
    shell.openPath(app.getPath('userData'));
  });

  ipcMain.handle('change-user-data-path', async (_, newPath: string) => {
    try {
      const currentPath = app.getPath('userData');
      
      // Don't do anything if path hasn't changed
      if (currentPath === newPath) return false;

      // Ensure new directory exists
      await fs.ensureDir(newPath);

      // Copy all files from current to new

      await fs.copy(currentPath, newPath);

      // Write pointer file to DEFAULT location
      await fs.writeJSON(pointerFilePath, { customPath: newPath });
      
      // Relaunch to apply changes
      app.relaunch();
      app.exit(0);

      return true;
    } catch (error) {
      console.error('Failed to change user data path:', error);
      return false;
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
