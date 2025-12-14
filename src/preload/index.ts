import { contextBridge, ipcRenderer, IpcRendererEvent, webUtils } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {
  getAllMedia: () => ipcRenderer.invoke('get-all-media'),
  importMedia: () => ipcRenderer.invoke('import-media'),
  getSettings: () => ipcRenderer.invoke('get-settings'),
  setLibraryPath: (path: string) => ipcRenderer.invoke('set-library-path', path),
  selectDirectory: () => ipcRenderer.invoke('dialog:openDirectory'),
  onMediaAdded: (callback: (event: IpcRendererEvent, ...args: any[]) => void) => 
    ipcRenderer.on('media-added', callback),
  onMediaRemoved: (callback: (event: IpcRendererEvent, ...args: any[]) => void) => 
    ipcRenderer.on('media-removed', callback),
  onMediaUpdated: (callback: (event: IpcRendererEvent, ...args: any[]) => void) => 
    ipcRenderer.on('media-updated', callback),
  deleteMedia: (filepath: string) => ipcRenderer.invoke('delete-media', filepath),
  addDroppedFiles: (paths: string[]) => ipcRenderer.invoke('add-dropped-files', paths),
  onImportProgress: (callback: (event: IpcRendererEvent, data: { status: string, filename: string, error?: string }) => void) =>
      ipcRenderer.on('import-progress', callback),
  showInFolder: (path: string) => ipcRenderer.invoke('show-item-in-folder', path),
  createDirectory: (path: string) => ipcRenderer.invoke('create-directory', path),
  renameMedia: (oldPath: string, newPath: string) => ipcRenderer.invoke('rename-media', { oldPath, newPath }),
  removeMediaListener: (channel: string, callback: (...args: any[]) => void) => 
    ipcRenderer.removeListener(channel, callback),
  getFilePath: (file: File) => webUtils.getPathForFile(file),
  // Tags
  getTags: () => ipcRenderer.invoke('get-tags'),
  createTag: (name: string) => ipcRenderer.invoke('create-tag', name),
  addTagToMedia: (mediaId: number, tagId: number) => ipcRenderer.invoke('add-tag-to-media', { mediaId, tagId }),
  removeTagFromMedia: (mediaId: number, tagId: number) => ipcRenderer.invoke('remove-tag-from-media', { mediaId, tagId }),
  // Data Path
  getUserDataPath: () => ipcRenderer.invoke('get-user-data-path'),
  openUserDataFolder: () => ipcRenderer.invoke('open-user-data-folder'),
  changeUserDataPath: (newPath: string) => ipcRenderer.invoke('change-user-data-path', newPath)
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
