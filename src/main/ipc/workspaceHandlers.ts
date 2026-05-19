import { ipcMain } from 'electron'
import { WorkspaceChannel, ipcOk, ipcErr } from '../../shared/ipc'
import { workspaceService } from '../services/WorkspaceService'
import { VartaErrorCode } from '../../shared/errors'
import { logger } from '../utils/logger'

export function registerWorkspaceHandlers(): void {
  ipcMain.handle(WorkspaceChannel.GET_LAST_PATH, async () => {
    try {
      const path = await workspaceService.getLastProjectPath()
      return ipcOk(path)
    } catch (e) {
      return ipcErr({ code: VartaErrorCode.SETTINGS_READ_FAILED, message: 'Failed to get last project path' })
    }
  })

  ipcMain.handle(WorkspaceChannel.SAVE_LAST_PATH, async (_, path: string | null) => {
    try {
      await workspaceService.saveLastProjectPath(path)
      return ipcOk(undefined)
    } catch (e) {
      return ipcErr({ code: VartaErrorCode.SETTINGS_WRITE_FAILED, message: 'Failed to save last project path' })
    }
  })

  ipcMain.handle(WorkspaceChannel.LOAD_SESSION, async (_, path: string) => {
    try {
      const session = await workspaceService.loadSession(path)
      return ipcOk(session)
    } catch (e) {
      return ipcErr({ code: VartaErrorCode.SETTINGS_READ_FAILED, message: 'Failed to load session' })
    }
  })

  ipcMain.handle(WorkspaceChannel.SAVE_LAYOUT, async (_, { path, layout }) => {
    try {
      await workspaceService.saveLayout(path, layout)
      return ipcOk(undefined)
    } catch (e) {
      return ipcErr({ code: VartaErrorCode.SETTINGS_WRITE_FAILED, message: 'Failed to save layout' })
    }
  })

  ipcMain.handle(WorkspaceChannel.SAVE_TABS, async (_, { path, tabs }) => {
    try {
      await workspaceService.saveTabs(path, tabs)
      return ipcOk(undefined)
    } catch (e) {
      return ipcErr({ code: VartaErrorCode.SETTINGS_WRITE_FAILED, message: 'Failed to save tabs' })
    }
  })

  ipcMain.handle(WorkspaceChannel.SAVE_EXPLORER, async (_, { path, explorer }) => {
    try {
      await workspaceService.saveExplorer(path, explorer)
      return ipcOk(undefined)
    } catch (e) {
      return ipcErr({ code: VartaErrorCode.SETTINGS_WRITE_FAILED, message: 'Failed to save explorer' })
    }
  })

  ipcMain.handle(WorkspaceChannel.SET_ACTIVE_FILE, async (_, path: string | null) => {
    workspaceService.setActiveFile(path)
    return ipcOk(undefined)
  })

  ipcMain.handle(WorkspaceChannel.SET_PROJECT_ROOT, async (_, path: string | null) => {
    workspaceService.setProjectRoot(path)
    return ipcOk(undefined)
  })

  logger.info('WorkspaceHandlers', 'Registered')
}

export function removeWorkspaceHandlers(): void {
  const channels = [
    WorkspaceChannel.GET_LAST_PATH,
    WorkspaceChannel.SAVE_LAST_PATH,
    WorkspaceChannel.LOAD_SESSION,
    WorkspaceChannel.SAVE_LAYOUT,
    WorkspaceChannel.SAVE_TABS,
    WorkspaceChannel.SAVE_EXPLORER,
    WorkspaceChannel.SET_ACTIVE_FILE,
    WorkspaceChannel.SET_PROJECT_ROOT,
  ]
  for (const ch of channels) { ipcMain.removeHandler(ch) }
}
