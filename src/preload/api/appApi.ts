import { ipcRenderer } from 'electron'
import { AppChannel }  from '../../shared/ipc'
import type { IPCResponse } from '../../shared/ipc'

export interface AppPaths {
  userData:  string
  appData:   string
  temp:      string
  home:      string
  downloads: string
  documents: string
}

export const appApi = {
  // ── Invoke wrappers ────────────────────────────────────────────────────────

  getVersion: (): Promise<IPCResponse<string>> =>
    ipcRenderer.invoke(AppChannel.GET_VERSION),

  getPlatform: (): Promise<IPCResponse<NodeJS.Platform>> =>
    ipcRenderer.invoke(AppChannel.GET_PLATFORM),

  getPaths: (): Promise<IPCResponse<AppPaths>> =>
    ipcRenderer.invoke(AppChannel.GET_PATHS),

  openExternal: (url: string): Promise<IPCResponse<null>> =>
    ipcRenderer.invoke(AppChannel.OPEN_EXTERNAL, url),

  relaunch: (): Promise<IPCResponse<null>> =>
    ipcRenderer.invoke(AppChannel.RELAUNCH),

  quit: (): Promise<IPCResponse<null>> =>
    ipcRenderer.invoke(AppChannel.QUIT),

  checkUpdate: (): Promise<IPCResponse<null>> =>
    ipcRenderer.invoke(AppChannel.CHECK_UPDATE),

  installUpdate: (): Promise<IPCResponse<null>> =>
    ipcRenderer.invoke(AppChannel.INSTALL_UPDATE),

  // ── Push listeners ─────────────────────────────────────────────────────────

  /**
   * Listen for update-available events pushed from main.
   * @returns cleanup function
   */
  onUpdateAvailable: (cb: (version: string) => void): (() => void) => {
    const handler = (_: Electron.IpcRendererEvent, version: string) => cb(version)
    ipcRenderer.on(AppChannel.UPDATE_AVAILABLE, handler)
    return () => ipcRenderer.off(AppChannel.UPDATE_AVAILABLE, handler)
  },
}

export type AppAPI = typeof appApi
