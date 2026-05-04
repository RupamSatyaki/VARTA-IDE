import { ipcMain, dialog, BrowserWindow } from 'electron'
import { DialogChannel, ipcOk, ipcErr }  from '../../shared/ipc'
import { VartaError, VartaErrorCode }    from '../../shared/errors'
import { logger }                        from '../utils/logger'

function handleErr(e: unknown) {
  const err = VartaError.from(e, VartaErrorCode.UNKNOWN)
  return ipcErr(err.toPayload())
}

export function registerDialogHandlers(mainWindow: BrowserWindow): void {

  ipcMain.handle(DialogChannel.OPEN_FILE, async (_e, options: Electron.OpenDialogOptions = {}) => {
    try {
      const result = await dialog.showOpenDialog(mainWindow, {
        properties: ['openFile'],
        ...options,
      })
      return ipcOk({ cancelled: result.canceled, paths: result.filePaths })
    } catch (e) { return handleErr(e) }
  })

  ipcMain.handle(DialogChannel.OPEN_FOLDER, async (_e, options: Electron.OpenDialogOptions = {}) => {
    try {
      const result = await dialog.showOpenDialog(mainWindow, {
        properties: ['openDirectory'],
        ...options,
      })
      return ipcOk({ cancelled: result.canceled, paths: result.filePaths })
    } catch (e) { return handleErr(e) }
  })

  ipcMain.handle(DialogChannel.SAVE_FILE, async (_e, options: Electron.SaveDialogOptions = {}) => {
    try {
      const result = await dialog.showSaveDialog(mainWindow, options)
      return ipcOk({ cancelled: result.canceled, path: result.filePath ?? null })
    } catch (e) { return handleErr(e) }
  })

  ipcMain.handle(DialogChannel.SHOW_MESSAGE, async (_e, options: Electron.MessageBoxOptions) => {
    try {
      const result = await dialog.showMessageBox(mainWindow, options)
      return ipcOk({ response: result.response, checkboxChecked: result.checkboxChecked })
    } catch (e) { return handleErr(e) }
  })

  ipcMain.handle(DialogChannel.SHOW_ERROR, (_e, title: string, content: string) => {
    try {
      dialog.showErrorBox(title, content)
      return ipcOk(null)
    } catch (e) { return handleErr(e) }
  })

  ipcMain.handle(DialogChannel.SHOW_CONFIRM, async (_e, message: string, detail?: string) => {
    try {
      const result = await dialog.showMessageBox(mainWindow, {
        type:    'question',
        buttons: ['Cancel', 'OK'],
        defaultId: 1,
        cancelId:  0,
        message,
        detail,
      })
      return ipcOk({ confirmed: result.response === 1 })
    } catch (e) { return handleErr(e) }
  })

  logger.info('IPC', 'Dialog handlers registered')
}

export function removeDialogHandlers(): void {
  const channels = [
    DialogChannel.OPEN_FILE, DialogChannel.OPEN_FOLDER,
    DialogChannel.SAVE_FILE, DialogChannel.SHOW_MESSAGE,
    DialogChannel.SHOW_ERROR, DialogChannel.SHOW_CONFIRM,
  ]
  for (const ch of channels) { ipcMain.removeHandler(ch) }
}
