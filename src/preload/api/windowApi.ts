import { ipcRenderer }   from 'electron'
import { WindowChannel }  from '../../shared/ipc'
import type { IPCResponse } from '../../shared/ipc'

export const windowApi = {
  // ── Invoke wrappers ────────────────────────────────────────────────────────

  minimize: (): Promise<void> =>
    ipcRenderer.invoke(WindowChannel.MINIMIZE),

  maximize: (): Promise<void> =>
    ipcRenderer.invoke(WindowChannel.MAXIMIZE),

  restore: (): Promise<void> =>
    ipcRenderer.invoke(WindowChannel.RESTORE),

  close: (): Promise<void> =>
    ipcRenderer.invoke(WindowChannel.CLOSE),

  toggleFullscreen: (): Promise<void> =>
    ipcRenderer.invoke(WindowChannel.TOGGLE_FULLSCREEN),

  isMaximized: (): Promise<boolean> =>
    ipcRenderer.invoke(WindowChannel.IS_MAXIMIZED),

  isFullscreen: (): Promise<boolean> =>
    ipcRenderer.invoke(WindowChannel.IS_FULLSCREEN),

  focus: (): Promise<void> =>
    ipcRenderer.invoke(WindowChannel.FOCUS),

  // ── Push listeners ─────────────────────────────────────────────────────────

  /** @returns cleanup function */
  onMaximized: (cb: () => void): (() => void) => {
    const handler = () => cb()
    ipcRenderer.on(WindowChannel.MAXIMIZED, handler)
    return () => ipcRenderer.off(WindowChannel.MAXIMIZED, handler)
  },

  /** @returns cleanup function */
  onUnmaximized: (cb: () => void): (() => void) => {
    const handler = () => cb()
    ipcRenderer.on(WindowChannel.UNMAXIMIZED, handler)
    return () => ipcRenderer.off(WindowChannel.UNMAXIMIZED, handler)
  },

  /** @returns cleanup function */
  onFocused: (cb: () => void): (() => void) => {
    const handler = () => cb()
    ipcRenderer.on(WindowChannel.FOCUSED, handler)
    return () => ipcRenderer.off(WindowChannel.FOCUSED, handler)
  },

  /** @returns cleanup function */
  onBlurred: (cb: () => void): (() => void) => {
    const handler = () => cb()
    ipcRenderer.on(WindowChannel.BLURRED, handler)
    return () => ipcRenderer.off(WindowChannel.BLURRED, handler)
  },
}

export type WindowAPI = typeof windowApi
