import { ipcMain }    from 'electron'
import { FileChannel, DialogChannel, ipcOk, ipcErr } from '../../shared/ipc'
import { VartaError, VartaErrorCode } from '../../shared/errors'
import { fileService }    from '../services/FileService'
import { watcherService } from '../services/WatcherService'
import { logger }         from '../utils/logger'
import type {
  WriteFileOptions, RenameOptions,
  CopyOptions, MoveOptions, ReadDirOptions,
} from '../../shared/types/file.types'

function handleErr(e: unknown) {
  const err = VartaError.from(e, VartaErrorCode.UNKNOWN)
  return ipcErr(err.toPayload())
}

export function registerFileHandlers(): void {

  ipcMain.handle(FileChannel.READ, async (_e, filePath: string) => {
    try {
      const result = await fileService.readFile(filePath)
      return ipcOk(result)
    } catch (e) { return handleErr(e) }
  })

  ipcMain.handle(FileChannel.WRITE, async (_e, options: WriteFileOptions) => {
    try {
      await fileService.writeFile(options)
      return ipcOk(null)
    } catch (e) { return handleErr(e) }
  })

  ipcMain.handle(FileChannel.DELETE, async (_e, filePath: string) => {
    try {
      await fileService.deleteFile(filePath)
      return ipcOk(null)
    } catch (e) { return handleErr(e) }
  })

  ipcMain.handle(FileChannel.RENAME, async (_e, options: RenameOptions) => {
    try {
      await fileService.renameFile(options)
      return ipcOk(null)
    } catch (e) { return handleErr(e) }
  })

  ipcMain.handle(FileChannel.COPY, async (_e, options: CopyOptions) => {
    try {
      await fileService.copyFile(options)
      return ipcOk(null)
    } catch (e) { return handleErr(e) }
  })

  ipcMain.handle(FileChannel.MOVE, async (_e, options: MoveOptions) => {
    try {
      await fileService.moveFile(options)
      return ipcOk(null)
    } catch (e) { return handleErr(e) }
  })

  ipcMain.handle(FileChannel.EXISTS, async (_e, filePath: string) => {
    try {
      const exists = await fileService.exists(filePath)
      return ipcOk(exists)
    } catch (e) { return handleErr(e) }
  })

  ipcMain.handle(FileChannel.STAT, async (_e, filePath: string) => {
    try {
      const stat = await fileService.stat(filePath)
      return ipcOk(stat)
    } catch (e) { return handleErr(e) }
  })

  ipcMain.handle(FileChannel.READ_DIR, async (_e, options: ReadDirOptions) => {
    try {
      const nodes = await fileService.readDir(options)
      return ipcOk(nodes)
    } catch (e) { return handleErr(e) }
  })

  ipcMain.handle(FileChannel.CREATE_DIR, async (_e, dirPath: string) => {
    try {
      await fileService.createDir(dirPath)
      return ipcOk(null)
    } catch (e) { return handleErr(e) }
  })

  ipcMain.handle(FileChannel.DELETE_DIR, async (_e, dirPath: string) => {
    try {
      await fileService.deleteDir(dirPath)
      return ipcOk(null)
    } catch (e) { return handleErr(e) }
  })

  ipcMain.handle(FileChannel.WATCH_START, async (_e, watchId: string, paths: string[]) => {
    try {
      await watcherService.startWatch(watchId, paths)
      return ipcOk(null)
    } catch (e) { return handleErr(e) }
  })

  ipcMain.handle(FileChannel.WATCH_STOP, async (_e, watchId: string) => {
    try {
      await watcherService.stopWatch(watchId)
      return ipcOk(null)
    } catch (e) { return handleErr(e) }
  })

  ipcMain.handle(FileChannel.OPEN_IN_SHELL, async (_e, filePath: string) => {
    try {
      const { shell } = await import('electron')
      await shell.openPath(filePath)
      return ipcOk(null)
    } catch (e) { return handleErr(e) }
  })

  logger.info('IPC', 'File handlers registered')
}

export function removeFileHandlers(): void {
  const channels = [
    FileChannel.READ, FileChannel.WRITE, FileChannel.DELETE,
    FileChannel.RENAME, FileChannel.COPY, FileChannel.MOVE,
    FileChannel.EXISTS, FileChannel.STAT, FileChannel.READ_DIR,
    FileChannel.CREATE_DIR, FileChannel.DELETE_DIR,
    FileChannel.WATCH_START, FileChannel.WATCH_STOP,
    FileChannel.OPEN_IN_SHELL,
  ]
  for (const ch of channels) { ipcMain.removeHandler(ch) }
}
