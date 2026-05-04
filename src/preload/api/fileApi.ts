import { ipcRenderer }  from 'electron'
import { FileChannel }  from '../../shared/ipc'
import type {
  ReadFileResult, FileStat, FileTreeNode,
  WriteFileOptions, RenameOptions, CopyOptions,
  MoveOptions, ReadDirOptions, WatchEvent,
} from '../../shared/types/file.types'
import type { IPCResponse } from '../../shared/ipc'

export const fileApi = {
  // ── Invoke wrappers ────────────────────────────────────────────────────────

  readFile: (filePath: string): Promise<IPCResponse<ReadFileResult>> =>
    ipcRenderer.invoke(FileChannel.READ, filePath),

  writeFile: (options: WriteFileOptions): Promise<IPCResponse<null>> =>
    ipcRenderer.invoke(FileChannel.WRITE, options),

  deleteFile: (filePath: string): Promise<IPCResponse<null>> =>
    ipcRenderer.invoke(FileChannel.DELETE, filePath),

  renameFile: (options: RenameOptions): Promise<IPCResponse<null>> =>
    ipcRenderer.invoke(FileChannel.RENAME, options),

  copyFile: (options: CopyOptions): Promise<IPCResponse<null>> =>
    ipcRenderer.invoke(FileChannel.COPY, options),

  moveFile: (options: MoveOptions): Promise<IPCResponse<null>> =>
    ipcRenderer.invoke(FileChannel.MOVE, options),

  exists: (filePath: string): Promise<IPCResponse<boolean>> =>
    ipcRenderer.invoke(FileChannel.EXISTS, filePath),

  stat: (filePath: string): Promise<IPCResponse<FileStat>> =>
    ipcRenderer.invoke(FileChannel.STAT, filePath),

  readDir: (options: ReadDirOptions): Promise<IPCResponse<FileTreeNode[]>> =>
    ipcRenderer.invoke(FileChannel.READ_DIR, options),

  createDir: (dirPath: string): Promise<IPCResponse<null>> =>
    ipcRenderer.invoke(FileChannel.CREATE_DIR, dirPath),

  deleteDir: (dirPath: string): Promise<IPCResponse<null>> =>
    ipcRenderer.invoke(FileChannel.DELETE_DIR, dirPath),

  startWatch: (watchId: string, paths: string[]): Promise<IPCResponse<null>> =>
    ipcRenderer.invoke(FileChannel.WATCH_START, watchId, paths),

  stopWatch: (watchId: string): Promise<IPCResponse<null>> =>
    ipcRenderer.invoke(FileChannel.WATCH_STOP, watchId),

  openInShell: (filePath: string): Promise<IPCResponse<null>> =>
    ipcRenderer.invoke(FileChannel.OPEN_IN_SHELL, filePath),

  // ── Push listeners ─────────────────────────────────────────────────────────

  /**
   * Listen for file system watch events pushed from main.
   * @returns cleanup function — call in useEffect return
   */
  onWatchEvent: (cb: (watchId: string, event: WatchEvent) => void): (() => void) => {
    const handler = (_: Electron.IpcRendererEvent, watchId: string, event: WatchEvent) =>
      cb(watchId, event)
    ipcRenderer.on(FileChannel.WATCH_EVENT, handler)
    return () => ipcRenderer.off(FileChannel.WATCH_EVENT, handler)
  },
}

export type FileAPI = typeof fileApi
