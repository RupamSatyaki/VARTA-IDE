/**
 * IPC registration hub — registers ALL handlers in one call.
 * Called from main/index.ts after window is created.
 */
import { BrowserWindow } from 'electron'
import { registerFileHandlers,     removeFileHandlers }     from './fileHandlers'
import { registerDialogHandlers,   removeDialogHandlers }   from './dialogHandlers'
import { registerTerminalHandlers, removeTerminalHandlers } from './terminalHandlers'
import { registerGitHandlers,      removeGitHandlers }      from './gitHandlers'
import { registerSearchHandlers,   removeSearchHandlers }   from './searchHandlers'
import { registerSettingsHandlers, removeSettingsHandlers } from './settingsHandlers'
import { registerThemeHandlers,    removeThemeHandlers }    from './themeHandlers'
import { registerAIHandlers,       removeAIHandlers }       from './aiHandlers'
import { registerAppHandlers,      removeAppHandlers }      from './appHandlers'
import { registerMCPHandlers,      removeMCPHandlers }      from './mcpHandlers'
import { logger } from '../utils/logger'

export function registerAllHandlers(mainWindow: BrowserWindow): void {
  registerFileHandlers()
  registerDialogHandlers(mainWindow)
  registerTerminalHandlers()
  registerGitHandlers()
  registerSearchHandlers()
  registerSettingsHandlers()
  registerThemeHandlers()
  registerAIHandlers()
  registerAppHandlers()
  registerMCPHandlers()
  logger.info('IPC', 'All handlers registered')
}

export function removeAllHandlers(): void {
  removeFileHandlers()
  removeDialogHandlers()
  removeTerminalHandlers()
  removeGitHandlers()
  removeSearchHandlers()
  removeSettingsHandlers()
  removeThemeHandlers()
  removeAIHandlers()
  removeAppHandlers()
  removeMCPHandlers()
  logger.info('IPC', 'All handlers removed')
}
