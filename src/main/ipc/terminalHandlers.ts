import { ipcMain }      from 'electron'
import { TerminalChannel, ipcOk, ipcErr } from '../../shared/ipc'
import { VartaError, VartaErrorCode }     from '../../shared/errors'
import { terminalService }                from '../services/TerminalService'
import { logger }                         from '../utils/logger'
import type {
  CreateTerminalOptions, TerminalWriteOptions, TerminalResizeOptions,
} from '../../shared/types/terminal.types'

function handleErr(e: unknown) {
  const err = VartaError.from(e, VartaErrorCode.UNKNOWN)
  return ipcErr(err.toPayload())
}

export function registerTerminalHandlers(): void {

  ipcMain.handle(TerminalChannel.CREATE, (_e, options: CreateTerminalOptions = {}) => {
    try {
      const instance = terminalService.create(options)
      return ipcOk(instance)
    } catch (e) { return handleErr(e) }
  })

  ipcMain.handle(TerminalChannel.DESTROY, (_e, id: string) => {
    try {
      terminalService.destroyTerminal(id)
      return ipcOk(null)
    } catch (e) { return handleErr(e) }
  })

  ipcMain.handle(TerminalChannel.WRITE, (_e, options: TerminalWriteOptions) => {
    try {
      terminalService.write(options)
      return ipcOk(null)
    } catch (e) { return handleErr(e) }
  })

  ipcMain.handle(TerminalChannel.RESIZE, (_e, options: TerminalResizeOptions) => {
    try {
      terminalService.resize(options)
      return ipcOk(null)
    } catch (e) { return handleErr(e) }
  })

  ipcMain.handle(TerminalChannel.LIST, () => {
    try {
      return ipcOk(terminalService.list())
    } catch (e) { return handleErr(e) }
  })

  ipcMain.handle(TerminalChannel.CLEAR, (_e, id: string) => {
    // Clear is handled renderer-side (xterm.js clear()) — main just acks
    try {
      return ipcOk(null)
    } catch (e) { return handleErr(e) }
  })

  ipcMain.handle(TerminalChannel.SET_CWD, (_e, _id: string, _cwd: string) => {
    // CWD change is sent as a shell command from renderer — this is a no-op ack
    return ipcOk(null)
  })

  logger.info('IPC', 'Terminal handlers registered')
}

export function removeTerminalHandlers(): void {
  const channels = [
    TerminalChannel.CREATE, TerminalChannel.DESTROY,
    TerminalChannel.WRITE,  TerminalChannel.RESIZE,
    TerminalChannel.LIST,   TerminalChannel.CLEAR,
    TerminalChannel.SET_CWD,
  ]
  for (const ch of channels) { ipcMain.removeHandler(ch) }
}
