import { ElectronAPI } from '@electron-toolkit/preload'

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      getAllMedia: () => Promise<any[]>
      importMedia: () => Promise<void>
      getSettings: () => Promise<{ libraryPath: string }>
      setLibraryPath: (path: string) => Promise<boolean>
      selectDirectory: () => Promise<string | null>
      onMediaAdded: (callback: (event: any, data: any) => void) => void
      onMediaRemoved: (callback: (event: any, path: string) => void) => void
      deleteMedia: (filepath: string) => Promise<boolean>
      addDroppedFiles: (paths: string[]) => Promise<boolean[]>
      showInFolder: (path: string) => Promise<void>
      createDirectory: (path: string) => Promise<boolean>
      renameMedia: (oldPath: string, newPath: string) => Promise<boolean>
      removeMediaListener: (channel: string, callback: (...args: any[]) => void) => void
      getFilePath: (file: File) => string
    }
  }
}
