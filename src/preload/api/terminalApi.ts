import { ipcRenderer }    from 'electron'
import { TerminalChannel } from '../../shared/ipc'
import type {
  TerminalInstance, CreateTerminalOptions,
  TerminalWriteOptions, TerminalResizeOptions,
  TerminalDataEvent, TerminalExitEvent,
} from '../../shared/types/terminal.types'
import type { IPCResponse } from '../../shared/ipc'

export const terminalApi = {
  // ── Invoke wrappers ────────────────────────────────────────────────────────

  create: (options?: CreateTerminalOptions): Promise<IPCResponse<TerminalInstance>> =>
    ipcRenderer.invoke(TerminalChannel.CREATE, options ?? {}),

  destroy: (id: string): Promise<IPCResponse<null>> =>
    ipcRenderer.invoke(TerminalChannel.DESTROY, id),

  write: (options: TerminalWriteOptions): Promise<IPCResponse<null>> =>
    ipcRenderer.invoke(TerminalChannel.WRITE, options),

  resize: (options: TerminalResizeOptions): Promise<IPCResponse<null>> =>
    ipcRenderer.invoke(TerminalChannel.RESIZE, options),

  list: (): Promise<IPCResponse<TerminalInstance[]>> =>
    ipcRenderer.invoke(TerminalChannel.LIST),

  clear: (id: string): Promise<IPCResponse<null>> =>
    ipcRenderer.invoke(TerminalChannel.CLEAR, id),

  setCwd: (id: string, cwd: string): Promise<IPCResponse<null>> =>
    ipcRenderer.invoke(TerminalChannel.SET_CWD, id, cwd),

  // ── Push listeners ─────────────────────────────────────────────────────────

  /**
   * Listen for PTY data output pushed from main.
   * @returns cleanup function
   */
  onData: (cb: (event: TerminalDataEvent) => void): (() => void) => {
    const handler = (_: Electron.IpcRendererEvent, event: TerminalDataEvent) => cb(event)
    ipcRenderer.on(TerminalChannel.DATA, handler)
    return () => ipcRenderer.off(TerminalChannel.DATA, handler)
  },

  /**
   * Listen for terminal process exit events pushed from main.
   * @returns cleanup function
   */
  onExit: (cb: (event: TerminalExitEvent) => void): (() => void) => {
    const handler = (_: Electron.IpcRendererEvent, event: TerminalExitEvent) => cb(event)
    ipcRenderer.on(TerminalChannel.EXIT, handler)
    return () => ipcRenderer.off(TerminalChannel.EXIT, handler)
  },
}

export type TerminalAPI = typeof terminalApi
