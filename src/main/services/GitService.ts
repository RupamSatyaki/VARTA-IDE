import simpleGit, { SimpleGit, SimpleGitOptions } from 'simple-git'
import { BrowserWindow } from 'electron'
import { GitChannel }    from '../../shared/ipc'
import {
  GitStatus, GitBranch, GitCommit, GitDiff,
  GitDiffHunk, GitDiffLine, GitFileChange, GitFileStatus,
  CommitOptions, PushOptions, PullOptions, CloneOptions, StashEntry,
} from '../../shared/types/git.types'
import { VartaError, VartaErrorCode } from '../../shared/errors'
import { logger } from '../utils/logger'

export class GitService {
  private git:        SimpleGit | null = null
  private repoRoot:   string | null    = null
  private mainWindow: BrowserWindow | null = null

  init(mainWindow: BrowserWindow): void {
    this.mainWindow = mainWindow
    logger.info('GitService', 'Initialized')
  }

  destroy(): void {
    this.git        = null
    this.repoRoot   = null
    this.mainWindow = null
    logger.info('GitService', 'Destroyed')
  }

  // ── Repo detection ────────────────────────────────────────────────────────

  /**
   * Try to open a git repo at the given folder.
   * Returns null gracefully if it's not a git repo — never throws.
   */
  async openRepo(folderPath: string): Promise<string | null> {
    try {
      const options: Partial<SimpleGitOptions> = {
        baseDir:  folderPath,
        binary:   'git',
        maxConcurrentProcesses: 6,
        trimmed:  false,
      }
      const git = simpleGit(options)
      const isRepo = await git.checkIsRepo()

      if (!isRepo) {
        this.git      = null
        this.repoRoot = null
        logger.info('GitService', `Not a git repo: ${folderPath}`)
        return null
      }

      const root = await git.revparse(['--show-toplevel'])
      this.git      = git
      this.repoRoot = root.trim()
      logger.info('GitService', `Opened repo: ${this.repoRoot}`)

      // Push initial status to renderer
      this.pushChangedEvent()
      return this.repoRoot
    } catch {
      // Not a git repo or git not installed — graceful null
      this.git      = null
      this.repoRoot = null
      return null
    }
  }

  isRepo(): boolean {
    return this.git !== null && this.repoRoot !== null
  }

  // ── Status ────────────────────────────────────────────────────────────────

  async status(): Promise<GitStatus> {
    const git = this.requireGit()
    try {
      const [status, stashList] = await Promise.all([
        git.status(),
        git.stashList().catch(() => ({ all: [] })),
      ])

      const toChange = (files: typeof status.modified, staged: boolean): GitFileChange[] =>
        files.map((f) => ({
          path:   f,
          status: 'modified' as GitFileStatus,
          staged,
        }))

      const staged: GitFileChange[] = [
        ...status.staged.map((f)   => ({ path: f, status: 'added'    as GitFileStatus, staged: true })),
        ...status.renamed.map((r)  => ({ path: r.to, oldPath: r.from, status: 'renamed' as GitFileStatus, staged: true })),
        ...toChange(status.modified.filter((f) => status.staged.includes(f)), true),
      ]

      const unstaged: GitFileChange[] = [
        ...toChange(status.modified.filter((f) => !status.staged.includes(f)), false),
        ...status.deleted.map((f)  => ({ path: f, status: 'deleted'  as GitFileStatus, staged: false })),
      ]

      const untracked: GitFileChange[] = status.not_added.map((f) => ({
        path: f, status: 'untracked' as GitFileStatus, staged: false,
      }))

      const conflicted: GitFileChange[] = status.conflicted.map((f) => ({
        path: f, status: 'conflicted' as GitFileStatus, staged: false,
      }))

      return {
        isRepo:     true,
        branch:     status.current,
        tracking:   status.tracking ?? undefined,
        ahead:      status.ahead,
        behind:     status.behind,
        staged,
        unstaged,
        untracked,
        conflicted,
        isClean:    status.isClean(),
        stashCount: stashList.all.length,
      }
    } catch (e) {
      throw new VartaError(VartaErrorCode.GIT_STATUS_FAILED, 'Failed to get git status', e)
    }
  }

  // ── Diff ──────────────────────────────────────────────────────────────────

  async diff(stagedOrPath: boolean | string = false, filePath?: string): Promise<string> {
    const git = this.requireGit()
    try {
      let staged = false
      let path = filePath

      if (typeof stagedOrPath === 'boolean') {
        staged = stagedOrPath
      } else {
        path = stagedOrPath
      }

      const args = staged ? ['--cached'] : []
      if (path) {
        args.push('--', path)
      }
      return await git.diff(args)
    } catch (e) {
      throw new VartaError(VartaErrorCode.GIT_DIFF_FAILED, 'Failed to get diff', e)
    }
  }

  async diffFile(filePath: string, staged = false): Promise<GitDiff> {
    const git = this.requireGit()
    try {
      const args = staged ? ['--cached', '--', filePath] : ['--', filePath]
      const raw  = await git.diff(args)
      return this.parseDiff(filePath, raw)
    } catch (e) {
      throw new VartaError(VartaErrorCode.GIT_DIFF_FAILED, `Failed to diff file: ${filePath}`, e)
    }
  }

  // ── Stage / Unstage ───────────────────────────────────────────────────────

  async stage(paths: string[]): Promise<void> {
    const git = this.requireGit()
    try {
      await git.add(paths)
      this.pushChangedEvent()
    } catch (e) {
      throw new VartaError(VartaErrorCode.GIT_STAGE_FAILED, 'Failed to stage files', e)
    }
  }

  async add(paths: string[]): Promise<void> {
    return this.stage(paths)
  }

  async unstage(paths: string[]): Promise<void> {
    const git = this.requireGit()
    try {
      await git.reset(['HEAD', '--', ...paths])
      this.pushChangedEvent()
    } catch (e) {
      throw new VartaError(VartaErrorCode.GIT_UNSTAGE_FAILED, 'Failed to unstage files', e)
    }
  }

  async stageAll(): Promise<void> {
    const git = this.requireGit()
    try {
      await git.add(['-A'])
      this.pushChangedEvent()
    } catch (e) {
      throw new VartaError(VartaErrorCode.GIT_STAGE_FAILED, 'Failed to stage all files', e)
    }
  }

  async unstageAll(): Promise<void> {
    const git = this.requireGit()
    try {
      await git.reset(['HEAD'])
      this.pushChangedEvent()
    } catch (e) {
      throw new VartaError(VartaErrorCode.GIT_UNSTAGE_FAILED, 'Failed to unstage all files', e)
    }
  }

  // ── Commit ────────────────────────────────────────────────────────────────

  async commit(optionsOrMessage: CommitOptions | string): Promise<void> {
    const git = this.requireGit()
    try {
      const options: CommitOptions = typeof optionsOrMessage === 'string'
        ? { message: optionsOrMessage }
        : optionsOrMessage

      const args: string[] = []
      if (options.amend)   { args.push('--amend') }
      if (options.signOff) { args.push('--signoff') }
      await git.commit(options.message, args)
      this.pushChangedEvent()
    } catch (e) {
      throw new VartaError(VartaErrorCode.GIT_COMMIT_FAILED, 'Commit failed', e)
    }
  }

  // ── Push / Pull / Fetch ───────────────────────────────────────────────────

  async push(options: PushOptions = {}): Promise<void> {
    const git = this.requireGit()
    try {
      const args: string[] = []
      if (options.force)        { args.push('--force') }
      if (options.setUpstream)  { args.push('--set-upstream') }
      await git.push(options.remote ?? 'origin', options.branch, args)
      this.pushChangedEvent()
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      if (msg.includes('Authentication') || msg.includes('auth')) {
        throw new VartaError(VartaErrorCode.GIT_AUTH_FAILED, 'Push failed: authentication error', e)
      }
      throw new VartaError(VartaErrorCode.GIT_PUSH_FAILED, 'Push failed', e)
    }
  }

  async pull(options: PullOptions = {}): Promise<void> {
    const git = this.requireGit()
    try {
      const args: string[] = options.rebase ? ['--rebase'] : []
      await git.pull(options.remote ?? 'origin', options.branch, args)
      this.pushChangedEvent()
    } catch (e) {
      throw new VartaError(VartaErrorCode.GIT_PULL_FAILED, 'Pull failed', e)
    }
  }

  async fetch(): Promise<void> {
    const git = this.requireGit()
    try {
      await git.fetch()
      this.pushChangedEvent()
    } catch (e) {
      throw new VartaError(VartaErrorCode.GIT_FETCH_FAILED, 'Fetch failed', e)
    }
  }

  // ── Branches ──────────────────────────────────────────────────────────────

  async branches(): Promise<GitBranch[]> {
    const git = this.requireGit()
    try {
      const result = await git.branch(['-a', '-v'])
      return Object.values(result.branches).map((b) => ({
        name:       b.name,
        isCurrent:  b.current,
        isRemote:   b.name.startsWith('remotes/'),
        lastCommit: b.commit,
      }))
    } catch (e) {
      throw new VartaError(VartaErrorCode.GIT_BRANCH_FAILED, 'Failed to list branches', e)
    }
  }

  async checkout(branch: string): Promise<void> {
    const git = this.requireGit()
    try {
      await git.checkout(branch)
      this.pushChangedEvent()
    } catch (e) {
      throw new VartaError(VartaErrorCode.GIT_CHECKOUT_FAILED, `Checkout failed: ${branch}`, e)
    }
  }

  async createBranch(name: string, checkout = true): Promise<void> {
    const git = this.requireGit()
    try {
      if (checkout) {
        await git.checkoutLocalBranch(name)
      } else {
        await git.branch([name])
      }
      this.pushChangedEvent()
    } catch (e) {
      throw new VartaError(VartaErrorCode.GIT_BRANCH_FAILED, `Failed to create branch: ${name}`, e)
    }
  }

  async deleteBranch(name: string, force = false): Promise<void> {
    const git = this.requireGit()
    try {
      await git.branch([force ? '-D' : '-d', name])
      this.pushChangedEvent()
    } catch (e) {
      throw new VartaError(VartaErrorCode.GIT_BRANCH_FAILED, `Failed to delete branch: ${name}`, e)
    }
  }

  // ── Log ───────────────────────────────────────────────────────────────────

  async log(maxCount = 50): Promise<GitCommit[]> {
    const git = this.requireGit()
    try {
      const result = await git.log({ maxCount })
      return result.all.map((c) => ({
        hash:      c.hash,
        shortHash: c.hash.slice(0, 7),
        message:   c.message,
        author:    c.author_name,
        email:     c.author_email,
        date:      new Date(c.date).getTime(),
        refs:      c.refs ? c.refs.split(', ').filter(Boolean) : [],
      }))
    } catch (e) {
      throw new VartaError(VartaErrorCode.GIT_STATUS_FAILED, 'Failed to get log', e)
    }
  }

  // ── Discard ───────────────────────────────────────────────────────────────

  async discard(paths: string[]): Promise<void> {
    const git = this.requireGit()
    try {
      await git.checkout(['--', ...paths])
      this.pushChangedEvent()
    } catch (e) {
      throw new VartaError(VartaErrorCode.GIT_DISCARD_FAILED, 'Failed to discard changes', e)
    }
  }

  // ── Stash ─────────────────────────────────────────────────────────────────

  async stash(message?: string): Promise<void> {
    const git = this.requireGit()
    try {
      const args = message ? ['push', '-m', message] : ['push']
      await git.stash(args)
      this.pushChangedEvent()
    } catch (e) {
      throw new VartaError(VartaErrorCode.GIT_STASH_FAILED, 'Stash failed', e)
    }
  }

  async stashPop(): Promise<void> {
    const git = this.requireGit()
    try {
      await git.stash(['pop'])
      this.pushChangedEvent()
    } catch (e) {
      throw new VartaError(VartaErrorCode.GIT_STASH_FAILED, 'Stash pop failed', e)
    }
  }

  async stashList(): Promise<StashEntry[]> {
    const git = this.requireGit()
    try {
      const result = await git.stashList()
      return result.all.map((s, i) => ({
        index:   i,
        message: s.message,
        date:    new Date(s.date).getTime(),
      }))
    } catch (e) {
      throw new VartaError(VartaErrorCode.GIT_STASH_FAILED, 'Failed to list stashes', e)
    }
  }

  // ── Clone ─────────────────────────────────────────────────────────────────

  async clone(options: CloneOptions): Promise<void> {
    try {
      const git = simpleGit()
      const args: string[] = []
      if (options.depth)  { args.push('--depth', String(options.depth)) }
      if (options.branch) { args.push('--branch', options.branch) }
      await git.clone(options.url, options.destination, args)
    } catch (e) {
      throw new VartaError(VartaErrorCode.GIT_CLONE_FAILED, `Clone failed: ${options.url}`, e)
    }
  }

  // ── Push changed event ────────────────────────────────────────────────────

  private pushChangedEvent(): void {
    if (!this.mainWindow || this.mainWindow.isDestroyed()) { return }
    // Fire-and-forget status update
    this.status()
      .then((s) => {
        if (!this.mainWindow || this.mainWindow.isDestroyed()) { return }
        this.mainWindow.webContents.send(GitChannel.CHANGED, s)
      })
      .catch((e) => {
        logger.error('GitService', 'Failed to push git changed event', e)
      })
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  private requireGit(): SimpleGit {
    if (!this.git) {
      throw new VartaError(VartaErrorCode.GIT_NOT_A_REPO, 'No git repository is open')
    }
    return this.git
  }

  /** Minimal unified diff parser */
  private parseDiff(filePath: string, raw: string): GitDiff {
    if (!raw.trim()) {
      return { filePath, oldContent: null, newContent: null, hunks: [], isBinary: false }
    }

    if (raw.includes('Binary files')) {
      return { filePath, oldContent: null, newContent: null, hunks: [], isBinary: true }
    }

    const hunks: GitDiffHunk[] = []
    const hunkHeaderRe = /^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@(.*)/

    let currentHunk: GitDiffHunk | null = null

    for (const line of raw.split('\n')) {
      const match = hunkHeaderRe.exec(line)
      if (match) {
        currentHunk = {
          oldStart: parseInt(match[1], 10),
          oldLines: parseInt(match[2] ?? '1', 10),
          newStart: parseInt(match[3], 10),
          newLines: parseInt(match[4] ?? '1', 10),
          header:   match[5].trim(),
          lines:    [],
        }
        hunks.push(currentHunk)
        continue
      }

      if (!currentHunk) { continue }

      if (line.startsWith('+') && !line.startsWith('+++')) {
        currentHunk.lines.push({ type: 'add',     content: line.slice(1) })
      } else if (line.startsWith('-') && !line.startsWith('---')) {
        currentHunk.lines.push({ type: 'remove',  content: line.slice(1) })
      } else if (line.startsWith(' ')) {
        currentHunk.lines.push({ type: 'context', content: line.slice(1) })
      }
    }

    return { filePath, oldContent: null, newContent: null, hunks, isBinary: false }
  }
}

export const gitService = new GitService()
