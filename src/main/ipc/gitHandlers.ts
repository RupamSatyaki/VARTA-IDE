import { ipcMain }   from 'electron'
import { GitChannel, ipcOk, ipcErr } from '../../shared/ipc'
import { VartaError, VartaErrorCode } from '../../shared/errors'
import { gitService }  from '../services/GitService'
import { logger }      from '../utils/logger'
import type {
  CommitOptions, PushOptions, PullOptions, CloneOptions,
} from '../../shared/types/git.types'

function handleErr(e: unknown) {
  const err = VartaError.from(e, VartaErrorCode.UNKNOWN)
  return ipcErr(err.toPayload())
}

export function registerGitHandlers(): void {

  ipcMain.handle(GitChannel.STATUS, async () => {
    try {
      if (!gitService.isRepo()) { return ipcOk(null) }
      return ipcOk(await gitService.status())
    } catch (e) { return handleErr(e) }
  })

  ipcMain.handle(GitChannel.DIFF, async (_e, filePath?: string) => {
    try {
      return ipcOk(await gitService.diff(filePath))
    } catch (e) { return handleErr(e) }
  })

  ipcMain.handle(GitChannel.DIFF_FILE, async (_e, filePath: string, staged = false) => {
    try {
      return ipcOk(await gitService.diffFile(filePath, staged))
    } catch (e) { return handleErr(e) }
  })

  ipcMain.handle(GitChannel.STAGE, async (_e, paths: string[]) => {
    try {
      await gitService.stage(paths)
      return ipcOk(null)
    } catch (e) { return handleErr(e) }
  })

  ipcMain.handle(GitChannel.UNSTAGE, async (_e, paths: string[]) => {
    try {
      await gitService.unstage(paths)
      return ipcOk(null)
    } catch (e) { return handleErr(e) }
  })

  ipcMain.handle(GitChannel.STAGE_ALL, async () => {
    try {
      await gitService.stageAll()
      return ipcOk(null)
    } catch (e) { return handleErr(e) }
  })

  ipcMain.handle(GitChannel.UNSTAGE_ALL, async () => {
    try {
      await gitService.unstageAll()
      return ipcOk(null)
    } catch (e) { return handleErr(e) }
  })

  ipcMain.handle(GitChannel.COMMIT, async (_e, options: CommitOptions) => {
    try {
      await gitService.commit(options)
      return ipcOk(null)
    } catch (e) { return handleErr(e) }
  })

  ipcMain.handle(GitChannel.PUSH, async (_e, options: PushOptions = {}) => {
    try {
      await gitService.push(options)
      return ipcOk(null)
    } catch (e) { return handleErr(e) }
  })

  ipcMain.handle(GitChannel.PULL, async (_e, options: PullOptions = {}) => {
    try {
      await gitService.pull(options)
      return ipcOk(null)
    } catch (e) { return handleErr(e) }
  })

  ipcMain.handle(GitChannel.FETCH, async () => {
    try {
      await gitService.fetch()
      return ipcOk(null)
    } catch (e) { return handleErr(e) }
  })

  ipcMain.handle(GitChannel.BRANCHES, async () => {
    try {
      return ipcOk(await gitService.branches())
    } catch (e) { return handleErr(e) }
  })

  ipcMain.handle(GitChannel.CHECKOUT, async (_e, branch: string) => {
    try {
      await gitService.checkout(branch)
      return ipcOk(null)
    } catch (e) { return handleErr(e) }
  })

  ipcMain.handle(GitChannel.CREATE_BRANCH, async (_e, name: string, checkout = true) => {
    try {
      await gitService.createBranch(name, checkout)
      return ipcOk(null)
    } catch (e) { return handleErr(e) }
  })

  ipcMain.handle(GitChannel.DELETE_BRANCH, async (_e, name: string, force = false) => {
    try {
      await gitService.deleteBranch(name, force)
      return ipcOk(null)
    } catch (e) { return handleErr(e) }
  })

  ipcMain.handle(GitChannel.LOG, async (_e, maxCount = 50) => {
    try {
      return ipcOk(await gitService.log(maxCount))
    } catch (e) { return handleErr(e) }
  })

  ipcMain.handle(GitChannel.STASH, async (_e, message?: string) => {
    try {
      await gitService.stash(message)
      return ipcOk(null)
    } catch (e) { return handleErr(e) }
  })

  ipcMain.handle(GitChannel.STASH_POP, async () => {
    try {
      await gitService.stashPop()
      return ipcOk(null)
    } catch (e) { return handleErr(e) }
  })

  ipcMain.handle(GitChannel.DISCARD, async (_e, paths: string[]) => {
    try {
      await gitService.discard(paths)
      return ipcOk(null)
    } catch (e) { return handleErr(e) }
  })

  ipcMain.handle(GitChannel.CLONE, async (_e, options: CloneOptions) => {
    try {
      await gitService.clone(options)
      return ipcOk(null)
    } catch (e) { return handleErr(e) }
  })

  ipcMain.handle(GitChannel.INIT, async (_e, folderPath: string) => {
    try {
      const root = await gitService.openRepo(folderPath)
      return ipcOk(root)
    } catch (e) { return handleErr(e) }
  })

  logger.info('IPC', 'Git handlers registered')
}

export function removeGitHandlers(): void {
  const channels = [
    GitChannel.STATUS, GitChannel.DIFF, GitChannel.DIFF_FILE,
    GitChannel.STAGE, GitChannel.UNSTAGE, GitChannel.STAGE_ALL, GitChannel.UNSTAGE_ALL,
    GitChannel.COMMIT, GitChannel.PUSH, GitChannel.PULL, GitChannel.FETCH,
    GitChannel.BRANCHES, GitChannel.CHECKOUT, GitChannel.CREATE_BRANCH, GitChannel.DELETE_BRANCH,
    GitChannel.LOG, GitChannel.STASH, GitChannel.STASH_POP, GitChannel.DISCARD,
    GitChannel.CLONE, GitChannel.INIT,
  ]
  for (const ch of channels) { ipcMain.removeHandler(ch) }
}
