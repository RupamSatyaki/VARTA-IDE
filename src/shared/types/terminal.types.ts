/** Terminal / PTY types shared between main and renderer */

export type ShellType = 'bash' | 'zsh' | 'fish' | 'powershell' | 'cmd' | 'custom'

export interface TerminalProfile {
  id:          string
  name:        string
  shell:       string       // absolute path to shell binary
  shellType:   ShellType
  args?:       string[]
  env?:        Record<string, string>
  cwd?:        string
  icon?:       string
}

export interface TerminalInstance {
  id:          string       // unique per session
  profileId:   string
  pid:         number
  title:       string
  cwd:         string
  isAlive:     boolean
  createdAt:   number       // unix ms
}

export interface CreateTerminalOptions {
  profileId?:  string       // use default profile if omitted
  cwd?:        string
  env?:        Record<string, string>
  cols?:       number
  rows?:       number
}

export interface TerminalWriteOptions {
  id:   string
  data: string
}

export interface TerminalResizeOptions {
  id:   string
  cols: number
  rows: number
}

export interface TerminalDataEvent {
  id:   string
  data: string
}

export interface TerminalExitEvent {
  id:       string
  exitCode: number | null
  signal?:  string
}
