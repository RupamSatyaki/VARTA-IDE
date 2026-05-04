import { ipcMain }       from 'electron'
import { SettingsChannel, ipcOk, ipcErr } from '../../shared/ipc'
import { VartaError, VartaErrorCode }     from '../../shared/errors'
import { settingsService }                from '../services/SettingsService'
import { logger }                         from '../utils/logger'
import type { SettingsUpdate, VartaSettings } from '../../shared/types/settings.types'

function handleErr(e: unknown) {
  const err = VartaError.from(e, VartaErrorCode.UNKNOWN)
  return ipcErr(err.toPayload())
}

export function registerSettingsHandlers(): void {

  ipcMain.handle(SettingsChannel.GET_ALL, () => {
    try {
      return ipcOk(settingsService.getAll())
    } catch (e) { return handleErr(e) }
  })

  ipcMain.handle(SettingsChannel.GET, (_e, key: keyof VartaSettings) => {
    try {
      return ipcOk(settingsService.get(key))
    } catch (e) { return handleErr(e) }
  })

  ipcMain.handle(SettingsChannel.SET, (_e, update: SettingsUpdate) => {
    try {
      settingsService.set(update)
      return ipcOk(null)
    } catch (e) { return handleErr(e) }
  })

  ipcMain.handle(SettingsChannel.RESET, (_e, key: keyof VartaSettings) => {
    try {
      settingsService.reset(key)
      return ipcOk(null)
    } catch (e) { return handleErr(e) }
  })

  ipcMain.handle(SettingsChannel.RESET_ALL, () => {
    try {
      settingsService.resetAll()
      return ipcOk(null)
    } catch (e) { return handleErr(e) }
  })

  ipcMain.handle(SettingsChannel.EXPORT, () => {
    try {
      return ipcOk(settingsService.export())
    } catch (e) { return handleErr(e) }
  })

  ipcMain.handle(SettingsChannel.IMPORT, (_e, json: string) => {
    try {
      settingsService.import(json)
      return ipcOk(null)
    } catch (e) { return handleErr(e) }
  })

  logger.info('IPC', 'Settings handlers registered')
}

export function removeSettingsHandlers(): void {
  const channels = [
    SettingsChannel.GET_ALL, SettingsChannel.GET,
    SettingsChannel.SET,     SettingsChannel.RESET,
    SettingsChannel.RESET_ALL, SettingsChannel.EXPORT,
    SettingsChannel.IMPORT,
  ]
  for (const ch of channels) { ipcMain.removeHandler(ch) }
}
