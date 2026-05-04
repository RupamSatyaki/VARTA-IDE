import { ipcRenderer }    from 'electron'
import { SettingsChannel } from '../../shared/ipc'
import type {
  VartaSettings, SettingsUpdate,
} from '../../shared/types/settings.types'
import type { IPCResponse } from '../../shared/ipc'

export const settingsApi = {
  // ── Invoke wrappers ────────────────────────────────────────────────────────

  getAll: (): Promise<IPCResponse<VartaSettings>> =>
    ipcRenderer.invoke(SettingsChannel.GET_ALL),

  get: <K extends keyof VartaSettings>(key: K): Promise<IPCResponse<VartaSettings[K]>> =>
    ipcRenderer.invoke(SettingsChannel.GET, key),

  set: (update: SettingsUpdate): Promise<IPCResponse<null>> =>
    ipcRenderer.invoke(SettingsChannel.SET, update),

  reset: (key: keyof VartaSettings): Promise<IPCResponse<null>> =>
    ipcRenderer.invoke(SettingsChannel.RESET, key),

  resetAll: (): Promise<IPCResponse<null>> =>
    ipcRenderer.invoke(SettingsChannel.RESET_ALL),

  export: (): Promise<IPCResponse<string>> =>
    ipcRenderer.invoke(SettingsChannel.EXPORT),

  import: (json: string): Promise<IPCResponse<null>> =>
    ipcRenderer.invoke(SettingsChannel.IMPORT, json),

  // ── Push listeners ─────────────────────────────────────────────────────────

  /**
   * Listen for settings change events pushed from main after any set/reset.
   * @returns cleanup function
   */
  onChanged: (cb: (settings: VartaSettings) => void): (() => void) => {
    const handler = (_: Electron.IpcRendererEvent, settings: VartaSettings) => cb(settings)
    ipcRenderer.on(SettingsChannel.CHANGED, handler)
    return () => ipcRenderer.off(SettingsChannel.CHANGED, handler)
  },
}

export type SettingsAPI = typeof settingsApi
