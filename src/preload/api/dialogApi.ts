import { ipcRenderer }  from 'electron'
import { DialogChannel } from '../../shared/ipc'
import type {
  OpenDialogResult, SaveDialogResult,
} from '../../shared/types/file.types'
import type { IPCResponse } from '../../shared/ipc'

export interface MessageBoxOptions {
  type?:      'none' | 'info' | 'error' | 'question' | 'warning'
  title?:     string
  message:    string
  detail?:    string
  buttons?:   string[]
  defaultId?: number
  cancelId?:  number
}

export interface MessageBoxResult {
  response:        number
  checkboxChecked: boolean
}

export interface ConfirmResult {
  confirmed: boolean
}

export const dialogApi = {
  // ── Invoke wrappers ────────────────────────────────────────────────────────

  openFile: (options?: {
    title?:       string
    defaultPath?: string
    filters?:     Array<{ name: string; extensions: string[] }>
    multiSelections?: boolean
  }): Promise<IPCResponse<OpenDialogResult>> =>
    ipcRenderer.invoke(DialogChannel.OPEN_FILE, options ?? {}),

  openFolder: (options?: {
    title?:       string
    defaultPath?: string
  }): Promise<IPCResponse<OpenDialogResult>> =>
    ipcRenderer.invoke(DialogChannel.OPEN_FOLDER, options ?? {}),

  saveFile: (options?: {
    title?:       string
    defaultPath?: string
    filters?:     Array<{ name: string; extensions: string[] }>
  }): Promise<IPCResponse<SaveDialogResult>> =>
    ipcRenderer.invoke(DialogChannel.SAVE_FILE, options ?? {}),

  showMessage: (options: MessageBoxOptions): Promise<IPCResponse<MessageBoxResult>> =>
    ipcRenderer.invoke(DialogChannel.SHOW_MESSAGE, options),

  showError: (title: string, content: string): Promise<IPCResponse<null>> =>
    ipcRenderer.invoke(DialogChannel.SHOW_ERROR, title, content),

  confirm: (message: string, detail?: string): Promise<IPCResponse<ConfirmResult>> =>
    ipcRenderer.invoke(DialogChannel.SHOW_CONFIRM, message, detail),
}

export type DialogAPI = typeof dialogApi
