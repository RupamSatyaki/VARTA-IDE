import { BrowserWindow, ipcMain } from 'electron'
import { createMainWindow }       from './createMainWindow'
import { saveWindowState }        from './windowState'
import { WindowChannel }          from '../../shared/ipc'
import { logger }                 from '../utils/logger'

export class WindowManager {
  private mainWindow: BrowserWindow | null = null

  // ── Lifecycle ──────────────────────────────────────────────────────────────

  init(): BrowserWindow {
    this.mainWindow = createMainWindow()
    this.registerIpcHandlers()
    this.registerWindowEvents()
    logger.info('WindowManager', 'Main window created')
    return this.mainWindow
  }

  destroy(): void {
    this.removeIpcHandlers()
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      saveWindowState(this.mainWindow)
      this.mainWindow.destroy()
    }
    this.mainWindow = null
    logger.info('WindowManager', 'WindowManager destroyed')
  }

  getMainWindow(): BrowserWindow | null {
    return this.mainWindow
  }

  focusMainWindow(): void {
    if (!this.mainWindow || this.mainWindow.isDestroyed()) { return }
    if (this.mainWindow.isMinimized()) { this.mainWindow.restore() }
    this.mainWindow.focus()
  }

  // ── IPC Handlers ──────────────────────────────────────────────────────────

  private registerIpcHandlers(): void {
    ipcMain.handle(WindowChannel.MINIMIZE, () => {
      this.mainWindow?.minimize()
    })

    ipcMain.handle(WindowChannel.MAXIMIZE, () => {
      this.mainWindow?.maximize()
    })

    ipcMain.handle(WindowChannel.RESTORE, () => {
      this.mainWindow?.unmaximize()
    })

    ipcMain.handle(WindowChannel.CLOSE, () => {
      this.mainWindow?.close()
    })

    ipcMain.handle(WindowChannel.TOGGLE_FULLSCREEN, () => {
      if (!this.mainWindow) { return }
      this.mainWindow.setFullScreen(!this.mainWindow.isFullScreen())
    })

    ipcMain.handle(WindowChannel.IS_MAXIMIZED, () => {
      return this.mainWindow?.isMaximized() ?? false
    })

    ipcMain.handle(WindowChannel.IS_FULLSCREEN, () => {
      return this.mainWindow?.isFullScreen() ?? false
    })

    ipcMain.handle(WindowChannel.FOCUS, () => {
      this.focusMainWindow()
    })
  }

  private removeIpcHandlers(): void {
    const channels: string[] = [
      WindowChannel.MINIMIZE,
      WindowChannel.MAXIMIZE,
      WindowChannel.RESTORE,
      WindowChannel.CLOSE,
      WindowChannel.TOGGLE_FULLSCREEN,
      WindowChannel.IS_MAXIMIZED,
      WindowChannel.IS_FULLSCREEN,
      WindowChannel.FOCUS,
    ]
    for (const ch of channels) {
      ipcMain.removeHandler(ch)
    }
  }

  // ── Window Events → push to renderer ──────────────────────────────────────

  private registerWindowEvents(): void {
    if (!this.mainWindow) { return }

    this.mainWindow.on('maximize', () => {
      this.mainWindow?.webContents.send(WindowChannel.MAXIMIZED)
    })

    this.mainWindow.on('unmaximize', () => {
      this.mainWindow?.webContents.send(WindowChannel.UNMAXIMIZED)
    })

    this.mainWindow.on('focus', () => {
      this.mainWindow?.webContents.send(WindowChannel.FOCUSED)
    })

    this.mainWindow.on('blur', () => {
      this.mainWindow?.webContents.send(WindowChannel.BLURRED)
    })

    this.mainWindow.on('close', () => {
      if (this.mainWindow) { saveWindowState(this.mainWindow) }
    })
  }
}

// Singleton
export const windowManager = new WindowManager()
