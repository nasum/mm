import chokidar from 'chokidar';
import path from 'path';
import fs from 'fs-extra';
import { addMedia, removeMedia } from './database';
import { BrowserWindow } from 'electron';

const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'];
const VIDEO_EXTENSIONS = ['.mp4', '.mov', '.webm', '.mkv', '.avi'];

export function initWatcher(libraryPath: string, mainWindow: BrowserWindow) {
  // Ensure library exists
  fs.ensureDirSync(libraryPath);

  const watcher = chokidar.watch(libraryPath, {
    ignored: /(^|[\/\\])\../, // ignore dotfiles
    persistent: true,
    ignoreInitial: false, // Index existing files on start
    awaitWriteFinish: {
      stabilityThreshold: 2000,
      pollInterval: 100
    }
  });

  watcher
    .on('add', (filepath) => {
      const ext = path.extname(filepath).toLowerCase();
      const filename = path.basename(filepath);
      let type = '';

      if (IMAGE_EXTENSIONS.includes(ext)) {
        type = 'image';
      } else if (VIDEO_EXTENSIONS.includes(ext)) {
        type = 'video';
      } else {
        return; // Not a media file
      }

      try {
        const stats = fs.statSync(filepath);
        addMedia(filepath, filename, type, stats.size);
        // Notify UI
        mainWindow.webContents.send('media-added', { filepath, filename, type, size: stats.size });
        console.log(`Added: ${filepath}`);
      } catch (err) {
        console.error(`Failed to add ${filepath}`, err);
      }
    })
    .on('unlink', (filepath) => {
      removeMedia(filepath);
      // Notify UI
      mainWindow.webContents.send('media-removed', filepath);
      console.log(`Removed: ${filepath}`);
    });

  return watcher;
}
