import { ipcRenderer } from 'electron'
import { GitChannel }  from '../../shared/ipc'
import type {
  GitStatus, GitBranch, GitCommit, GitDiff,
  CommitOptions, PushOptions, PullOptions, CloneOptions, StashEntry,
} from '../../shared/types/git.types'
import type { IPCResponse } from '../../shared/ipc'

export const gitApi = {
  // ── Invoke wrappers ────────────────────────────────────────────────────────

  status: (): Promise<IPCResponse<GitStatus | null>> =>
    ipcRenderer.invoke(GitChannel.STATUS),

  diff: (filePath?: string): Promise<IPCResponse<string>> =>
    ipcRenderer.invoke(GitChannel.DIFF, filePath),

  diffFile: (filePath: string, staged?: boolean): Promise<IPCResponse<GitDiff>> =>
    ipcRenderer.invoke(GitChannel.DIFF_FILE, filePath, staged ?? false),

  stage: (paths: string[]): Promise<IPCResponse<null>> =>
    ipcRenderer.invoke(GitChannel.STAGE, paths),

  unstage: (paths: string[]): Promise<IPCResponse<null>> =>
    ipcRenderer.invoke(GitChannel.UNSTAGE, paths),

  stageAll: (): Promise<IPCResponse<null>> =>
    ipcRenderer.invoke(GitChannel.STAGE_ALL),

  unstageAll: (): Promise<IPCResponse<null>> =>
    ipcRenderer.invoke(GitChannel.UNSTAGE_ALL),

  commit: (options: CommitOptions): Promise<IPCResponse<null>> =>
    ipcRenderer.invoke(GitChannel.COMMIT, options),

  push: (options?: PushOptions): Promise<IPCResponse<null>> =>
    ipcRenderer.invoke(GitChannel.PUSH, options ?? {}),

  pull: (options?: PullOptions): Promise<IPCResponse<null>> =>
    ipcRenderer.invoke(GitChannel.PULL, options ?? {}),

  fetch: (): Promise<IPCResponse<null>> =>
    ipcRenderer.invoke(GitChannel.FETCH),

  branches: (): Promise<IPCResponse<GitBranch[]>> =>
    ipcRenderer.invoke(GitChannel.BRANCHES),

  checkout: (branch: string): Promise<IPCResponse<null>> =>
    ipcRenderer.invoke(GitChannel.CHECKOUT, branch),

  createBranch: (name: string, checkout?: boolean): Promise<IPCResponse<null>> =>
    ipcRenderer.invoke(GitChannel.CREATE_BRANCH, name, checkout ?? true),

  deleteBranch: (name: string, force?: boolean): Promise<IPCResponse<null>> =>
    ipcRenderer.invoke(GitChannel.DELETE_BRANCH, name, force ?? false),

  log: (maxCount?: number): Promise<IPCResponse<GitCommit[]>> =>
    ipcRenderer.invoke(GitChannel.LOG, maxCount ?? 50),

  stash: (message?: string): Promise<IPCResponse<null>> =>
    ipcRenderer.invoke(GitChannel.STASH, message),

  stashPop: (): Promise<IPCResponse<null>> =>
    ipcRenderer.invoke(GitChannel.STASH_POP),

  discard: (paths: string[]): Promise<IPCResponse<null>> =>
    ipcRenderer.invoke(GitChannel.DISCARD, paths),

  clone: (options: CloneOptions): Promise<IPCResponse<null>> =>
    ipcRenderer.invoke(GitChannel.CLONE, options),

  openRepo: (folderPath: string): Promise<IPCResponse<string | null>> =>
    ipcRenderer.invoke(GitChannel.INIT, folderPath),

  showFile: (filePath: string, revision?: string): Promise<IPCResponse<string>> =>
    ipcRenderer.invoke(GitChannel.SHOW_FILE, filePath, revision),

  // ── Push listeners ─────────────────────────────────────────────────────────

  /**
   * Listen for git status change events pushed from main after any git op.
   * @returns cleanup function
   */
  onChanged: (cb: (status: GitStatus) => void): (() => void) => {
    const handler = (_: Electron.IpcRendererEvent, status: GitStatus) => cb(status)
    ipcRenderer.on(GitChannel.CHANGED, handler)
    return () => ipcRenderer.off(GitChannel.CHANGED, handler)
  },
}

export type GitAPI = typeof gitApi
