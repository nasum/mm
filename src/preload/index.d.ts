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
      onImportProgress: (callback: (event: any, data: { status: string, filename: string, error?: string }) => void) => void
      showInFolder: (path: string) => Promise<void>
      createDirectory: (path: string) => Promise<boolean>
      renameMedia: (oldPath: string, newPath: string) => Promise<boolean>
      removeMediaListener: (channel: string, callback: (...args: any[]) => void) => void
      getFilePath: (file: File) => string
      // Tags
      getTags: () => Promise<{ id: number; name: string; count?: number }[]>
      createTag: (name: string) => Promise<{ id: number; name: string }>
      addTagToMedia: (mediaId: number, tagId: number) => Promise<void>
      removeTagFromMedia: (mediaId: number, tagId: number) => Promise<void>
      // Data Path
      getUserDataPath: () => Promise<string>
      openUserDataFolder: () => Promise<void>
      changeUserDataPath: (newPath: string) => Promise<boolean>
    }
  }
}
