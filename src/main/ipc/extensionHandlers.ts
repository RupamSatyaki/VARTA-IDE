import { ipcMain } from 'electron'
import { extensionService } from '../services/ExtensionService'
import { ExtensionChannel, ipcOk, ipcErr } from '../../shared/ipc'
import { logger } from '../utils/logger'
import { VartaError } from '../../shared/errors'

export function registerExtensionHandlers(): void {
  // List all extensions
  ipcMain.handle(ExtensionChannel.LIST, async () => {
    try {
      const extensions = extensionService.list()
      return ipcOk(extensions)
    } catch (error: any) {
      logger.error('IPC:Extension', 'Failed to list extensions', error)
      return ipcErr(error instanceof VartaError ? error : { code: 'ERR_EXTENSION_LIST_FAILED', message: error.message })
    }
  })

  // Get extension details
  ipcMain.handle(ExtensionChannel.GET_DETAILS, async (_event, id: string) => {
    try {
      const details = extensionService.getDetails(id)
      return ipcOk(details)
    } catch (error: any) {
      logger.error('IPC:Extension', `Failed to get details for ${id}`, error)
      return ipcErr(error instanceof VartaError ? error : { code: 'ERR_EXTENSION_DETAILS_FAILED', message: error.message })
    }
  })

  // Enable extension
  ipcMain.handle(ExtensionChannel.ENABLE, async (_event, id: string) => {
    try {
      extensionService.enable(id)
      return ipcOk(true)
    } catch (error: any) {
      logger.error('IPC:Extension', `Failed to enable ${id}`, error)
      return ipcErr(error instanceof VartaError ? error : { code: 'ERR_EXTENSION_ENABLE_FAILED', message: error.message })
    }
  })

  // Disable extension
  ipcMain.handle(ExtensionChannel.DISABLE, async (_event, id: string) => {
    try {
      extensionService.disable(id)
      return ipcOk(true)
    } catch (error: any) {
      logger.error('IPC:Extension', `Failed to disable ${id}`, error)
      return ipcErr(error instanceof VartaError ? error : { code: 'ERR_EXTENSION_DISABLE_FAILED', message: error.message })
    }
  })

  // Uninstall extension
  ipcMain.handle(ExtensionChannel.UNINSTALL, async (_event, id: string) => {
    try {
      await extensionService.uninstall(id)
      return ipcOk(true)
    } catch (error: any) {
      logger.error('IPC:Extension', `Failed to uninstall ${id}`, error)
      return ipcErr(error instanceof VartaError ? error : { code: 'ERR_EXTENSION_UNINSTALL_FAILED', message: error.message })
    }
  })

  // Reload extension
  ipcMain.handle(ExtensionChannel.RELOAD, async (_event, id: string) => {
    try {
      await extensionService.reload(id)
      return ipcOk(true)
    } catch (error: any) {
      logger.error('IPC:Extension', `Failed to reload ${id}`, error)
      return ipcErr(error instanceof VartaError ? error : { code: 'ERR_EXTENSION_RELOAD_FAILED', message: error.message })
    }
  })

  // Execute extension command in host
  ipcMain.handle(ExtensionChannel.EXECUTE_COMMAND, async (_event, id: string, ...args: any[]) => {
    try {
      const result = await extensionService.executeCommand(id, ...args)
      return ipcOk(result)
    } catch (error: any) {
      logger.error('IPC:Extension', `Command execution failed: ${id}`, error)
      return ipcErr({ code: 'ERR_EXTENSION_COMMAND_FAILED', message: error.message })
    }
  })
}

export function removeExtensionHandlers(): void {
  ipcMain.removeHandler(ExtensionChannel.LIST)
  ipcMain.removeHandler(ExtensionChannel.GET_DETAILS)
  ipcMain.removeHandler(ExtensionChannel.ENABLE)
  ipcMain.removeHandler(ExtensionChannel.DISABLE)
  ipcMain.removeHandler(ExtensionChannel.UNINSTALL)
  ipcMain.removeHandler(ExtensionChannel.RELOAD)
}
