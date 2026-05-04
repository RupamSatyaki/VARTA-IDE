import { ipcRenderer } from 'electron'
import { ThemeChannel } from '../../shared/ipc'
import type { VartaTheme, ThemeChangeEvent } from '../../shared/types/theme.types'
import type { IPCResponse } from '../../shared/ipc'

export const themeApi = {
  // ── Invoke wrappers ────────────────────────────────────────────────────────

  getAll: (): Promise<IPCResponse<VartaTheme[]>> =>
    ipcRenderer.invoke(ThemeChannel.GET_ALL),

  getActive: (): Promise<IPCResponse<VartaTheme | null>> =>
    ipcRenderer.invoke(ThemeChannel.GET_ACTIVE),

  setActive: (themeId: string): Promise<IPCResponse<null>> =>
    ipcRenderer.invoke(ThemeChannel.SET_ACTIVE, themeId),

  loadCustom: (themePath: string): Promise<IPCResponse<VartaTheme>> =>
    ipcRenderer.invoke(ThemeChannel.LOAD_CUSTOM, themePath),

  // ── Push listeners ─────────────────────────────────────────────────────────

  /**
   * Listen for theme change events pushed from main.
   * @returns cleanup function
   */
  onChanged: (cb: (event: ThemeChangeEvent) => void): (() => void) => {
    const handler = (_: Electron.IpcRendererEvent, event: ThemeChangeEvent) => cb(event)
    ipcRenderer.on(ThemeChannel.CHANGED, handler)
    return () => ipcRenderer.off(ThemeChannel.CHANGED, handler)
  },
}

export type ThemeAPI = typeof themeApi
