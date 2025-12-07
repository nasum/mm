import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron'
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
  removeMediaListener: (channel: string, callback: (...args: any[]) => void) => 
    ipcRenderer.removeListener(channel, callback)
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
