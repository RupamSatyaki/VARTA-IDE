import { ipcMain, app, shell } from 'electron'
import { AppChannel, ipcOk, ipcErr } from '../../shared/ipc'
import { VartaError, VartaErrorCode } from '../../shared/errors'
import { logger } from '../utils/logger'

function handleErr(e: unknown) {
  return ipcErr(VartaError.from(e, VartaErrorCode.UNKNOWN).toPayload())
}

export function registerAppHandlers(): void {
  ipcMain.handle(AppChannel.GET_VERSION,  () => ipcOk(app.getVersion()))
  ipcMain.handle(AppChannel.GET_PLATFORM, () => ipcOk(process.platform))
  ipcMain.handle(AppChannel.GET_PATHS,    () => ipcOk({
    userData:  app.getPath('userData'),
    appData:   app.getPath('appData'),
    temp:      app.getPath('temp'),
    home:      app.getPath('home'),
    downloads: app.getPath('downloads'),
    documents: app.getPath('documents'),
  }))
  ipcMain.handle(AppChannel.OPEN_EXTERNAL, async (_e, url: string) => {
    try { await shell.openExternal(url); return ipcOk(null) }
    catch (e) { return handleErr(e) }
  })
  ipcMain.handle(AppChannel.RELAUNCH, () => { app.relaunch(); app.quit(); return ipcOk(null) })
  ipcMain.handle(AppChannel.QUIT,     () => { app.quit();    return ipcOk(null) })
  ipcMain.handle(AppChannel.CHECK_UPDATE,   () => ipcOk(null))
  ipcMain.handle(AppChannel.INSTALL_UPDATE, () => ipcOk(null))
  logger.info('IPC', 'App handlers registered')
}

export function removeAppHandlers(): void {
  const channels = [
    AppChannel.GET_VERSION, AppChannel.GET_PLATFORM, AppChannel.GET_PATHS,
    AppChannel.OPEN_EXTERNAL, AppChannel.RELAUNCH, AppChannel.QUIT,
    AppChannel.CHECK_UPDATE, AppChannel.INSTALL_UPDATE,
  ]
  for (const ch of channels) { ipcMain.removeHandler(ch) }
}
