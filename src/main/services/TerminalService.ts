import os   from 'os'
import fs   from 'fs'
import path from 'path'
import { BrowserWindow }  from 'electron'
import * as pty           from 'node-pty'
import { TerminalChannel } from '../../shared/ipc'
import {
  TerminalInstance, TerminalProfile,
  CreateTerminalOptions, TerminalResizeOptions,
  TerminalWriteOptions, ShellType,
} from '../../shared/types/terminal.types'
import { VartaError, VartaErrorCode } from '../../shared/errors'
import { logger } from '../utils/logger'

interface ActiveTerminal {
  instance: TerminalInstance
  pty:      pty.IPty
}

export class TerminalService {
  private terminals  = new Map<string, ActiveTerminal>()
  private mainWindow: BrowserWindow | null = null
  private idCounter  = 0

  init(mainWindow: BrowserWindow): void {
    this.mainWindow = mainWindow
    logger.info('TerminalService', 'Initialized')
  }

  destroy(): void {
    for (const [id, active] of this.terminals) {
      try {
        active.pty.kill()
      } catch {
        // ignore — process may already be dead
      }
      logger.debug('TerminalService', `Killed terminal ${id}`)
    }
    this.terminals.clear()
    this.mainWindow = null
    logger.info('TerminalService', 'Destroyed')
  }

  // ── Shell detection ───────────────────────────────────────────────────────

  detectDefaultShell(): { shell: string; shellType: ShellType } {
    const platform = process.platform

    if (platform === 'win32') {
      // Windows: PowerShell 7 → PowerShell 5 → CMD
      const ps7Paths = [
        'C:\\Program Files\\PowerShell\\7\\pwsh.exe',
        'C:\\Program Files (x86)\\PowerShell\\7\\pwsh.exe',
      ]
      for (const p of ps7Paths) {
        if (fs.existsSync(p)) {
          return { shell: p, shellType: 'powershell' }
        }
      }

      const ps5 = 'C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe'
      if (fs.existsSync(ps5)) {
        return { shell: ps5, shellType: 'powershell' }
      }

      return { shell: 'cmd.exe', shellType: 'cmd' }
    }

    // macOS / Linux: $SHELL env → zsh → bash
    const envShell = process.env['SHELL']
    if (envShell && fs.existsSync(envShell)) {
      const name = path.basename(envShell)
      const shellType: ShellType =
        name === 'zsh'  ? 'zsh'  :
        name === 'fish' ? 'fish' :
        name === 'bash' ? 'bash' : 'bash'
      return { shell: envShell, shellType }
    }

    const fallbacks = ['/bin/zsh', '/bin/bash', '/usr/bin/bash']
    for (const fb of fallbacks) {
      if (fs.existsSync(fb)) {
        return { shell: fb, shellType: fb.includes('zsh') ? 'zsh' : 'bash' }
      }
    }

    throw new VartaError(VartaErrorCode.SHELL_NOT_FOUND, 'No suitable shell found on this system')
  }

  getDefaultProfile(): TerminalProfile {
    const { shell, shellType } = this.detectDefaultShell()
    return {
      id:        'default',
      name:      'Default',
      shell,
      shellType,
      args:      [],
      cwd:       os.homedir(),
    }
  }

  // ── Create ────────────────────────────────────────────────────────────────

  create(options: CreateTerminalOptions = {}): TerminalInstance {
    const profile = this.getDefaultProfile()
    const cwd     = options.cwd ?? profile.cwd ?? os.homedir()
    const cols    = options.cols ?? 80
    const rows    = options.rows ?? 24
    const id      = `term-${++this.idCounter}`

    try {
      const ptyProcess = pty.spawn(profile.shell, profile.args ?? [], {
        name:  'xterm-256color',
        cols,
        rows,
        cwd,
        env:   { ...process.env, ...options.env } as Record<string, string>,
      })

      const instance: TerminalInstance = {
        id,
        profileId:  profile.id,
        pid:        ptyProcess.pid,
        title:      profile.name,
        cwd,
        isAlive:    true,
        createdAt:  Date.now(),
      }

      // Push data to renderer
      ptyProcess.onData((data) => {
        if (!this.mainWindow || this.mainWindow.isDestroyed()) { return }
        this.mainWindow.webContents.send(TerminalChannel.DATA, { id, data })
      })

      // Push exit to renderer
      ptyProcess.onExit(({ exitCode, signal }) => {
        const active = this.terminals.get(id)
        if (active) { active.instance.isAlive = false }

        if (!this.mainWindow || this.mainWindow.isDestroyed()) { return }
        this.mainWindow.webContents.send(TerminalChannel.EXIT, { id, exitCode, signal })
        this.terminals.delete(id)
        logger.info('TerminalService', `Terminal ${id} exited (code=${exitCode})`)
      })

      this.terminals.set(id, { instance, pty: ptyProcess })
      logger.info('TerminalService', `Created terminal ${id} (shell=${profile.shell}, pid=${ptyProcess.pid})`)
      return instance
    } catch (e) {
      throw new VartaError(VartaErrorCode.TERMINAL_CREATE_FAILED, `Failed to create terminal`, e)
    }
  }

  // ── Write ─────────────────────────────────────────────────────────────────

  write(options: TerminalWriteOptions): void {
    const active = this.getActive(options.id)
    try {
      active.pty.write(options.data)
    } catch (e) {
      throw new VartaError(VartaErrorCode.TERMINAL_WRITE_FAILED, `Write failed for terminal ${options.id}`, e)
    }
  }

  // ── Resize ────────────────────────────────────────────────────────────────

  resize(options: TerminalResizeOptions): void {
    const active = this.getActive(options.id)
    try {
      active.pty.resize(options.cols, options.rows)
    } catch (e) {
      throw new VartaError(VartaErrorCode.TERMINAL_RESIZE_FAILED, `Resize failed for terminal ${options.id}`, e)
    }
  }

  // ── Destroy ───────────────────────────────────────────────────────────────

  destroyTerminal(id: string): void {
    const active = this.terminals.get(id)
    if (!active) { return }

    try {
      active.pty.kill()
    } catch {
      // already dead
    }
    this.terminals.delete(id)
    logger.info('TerminalService', `Destroyed terminal ${id}`)
  }

  // ── List ──────────────────────────────────────────────────────────────────

  list(): TerminalInstance[] {
    return Array.from(this.terminals.values()).map((a) => a.instance)
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  private getActive(id: string): ActiveTerminal {
    const active = this.terminals.get(id)
    if (!active) {
      throw new VartaError(VartaErrorCode.TERMINAL_NOT_FOUND, `Terminal not found: ${id}`)
    }
    if (!active.instance.isAlive) {
      throw new VartaError(VartaErrorCode.TERMINAL_ALREADY_DEAD, `Terminal is no longer alive: ${id}`)
    }
    return active
  }
}

export const terminalService = new TerminalService()
