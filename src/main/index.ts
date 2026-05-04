import { app, BrowserWindow } from 'electron'
import { windowManager }      from './window/WindowManager'
import { registerAllHandlers, removeAllHandlers } from './ipc/index'
import { buildAppMenu }       from './menu/AppMenu'
import { fileService }        from './services/FileService'
import { watcherService }     from './services/WatcherService'
import { terminalService }    from './services/TerminalService'
import { gitService }         from './services/GitService'
import { searchService }      from './services/SearchService'
import { settingsService }    from './services/SettingsService'
import { aiService }          from './services/AIService'
import { extensionService }   from './services/ExtensionService'
import { logger }             from './utils/logger'

// ── Single instance lock ────────────────────────────────────────────────────
const gotLock = app.requestSingleInstanceLock()

if (!gotLock) {
  // Another instance is already running — quit immediately
  logger.info('App', 'Another instance is running — quitting')
  app.quit()
} else {
  // If a second instance tries to open, focus our existing window
  app.on('second-instance', (_event, _argv, _workingDir) => {
    const win = windowManager.getMainWindow()
    if (win) {
      if (win.isMinimized()) { win.restore() }
      win.focus()
      logger.info('App', 'Second instance detected — focused existing window')
    }
  })

  // ── App ready ─────────────────────────────────────────────────────────────
  app.whenReady().then(async () => {
    logger.info('App', `Starting Varta v${app.getVersion()} (${process.platform})`)

    // Load React DevTools in development
    if (process.env.NODE_ENV === 'development') {
      try {
        // Dynamic import with fallback — devtools installer is optional
        const devtoolsModule = await import('electron-devtools-installer').catch(() => null)
        if (devtoolsModule) {
          const installExtension = devtoolsModule.default ?? devtoolsModule
          const REACT_DEVELOPER_TOOLS = devtoolsModule.REACT_DEVELOPER_TOOLS
          await installExtension(REACT_DEVELOPER_TOOLS, {
            loadExtensionOptions: { allowFileAccess: true },
          })
          logger.info('App', 'React DevTools installed')
        }
      } catch (e) {
        logger.warn('App', 'Could not install React DevTools', e)
      }
    }

    // Create window
    const mainWindow = windowManager.init()

    // Init services (order matters — settings first, then window-dependent ones)
    fileService.init()
    settingsService.init(mainWindow)
    watcherService.init(mainWindow)
    terminalService.init(mainWindow)
    gitService.init(mainWindow)
    searchService.init(mainWindow)
    aiService.init(mainWindow)
    extensionService.init()

    // Register all IPC handlers
    registerAllHandlers(mainWindow)

    // Build native app menu
    buildAppMenu(mainWindow)

    logger.info('App', 'All services initialized')
  }).catch((e) => {
    logger.error('App', 'Fatal error during app startup', e)
    app.quit()
  })

  // ── Window all closed ──────────────────────────────────────────────────────
  app.on('window-all-closed', () => {
    // On macOS, apps stay alive until Cmd+Q even with no windows
    if (process.platform !== 'darwin') {
      app.quit()
    }
  })

  // ── macOS: re-create window when dock icon is clicked ─────────────────────
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      const mainWindow = windowManager.init()
      settingsService.init(mainWindow)
      watcherService.init(mainWindow)
      terminalService.init(mainWindow)
      gitService.init(mainWindow)
      searchService.init(mainWindow)
      aiService.init(mainWindow)
      registerAllHandlers(mainWindow)
      buildAppMenu(mainWindow)
    } else {
      windowManager.focusMainWindow()
    }
  })

  // ── Cleanup before quit ────────────────────────────────────────────────────
  app.on('before-quit', () => {
    logger.info('App', 'Shutting down…')
    removeAllHandlers()
    watcherService.destroy()
    terminalService.destroy()
    aiService.destroy()
    extensionService.destroy()
    gitService.destroy()
    searchService.destroy()
    settingsService.destroy()
    fileService.destroy()
    windowManager.destroy()
    logger.info('App', 'Shutdown complete')
  })

  // ── Global unhandled rejection guard ──────────────────────────────────────
  process.on('unhandledRejection', (reason) => {
    logger.error('App', 'Unhandled promise rejection', reason)
  })

  process.on('uncaughtException', (err) => {
    logger.error('App', 'Uncaught exception', err)
  })
}
