import { useCallback, useEffect, useRef } from 'react'
import { useGitStore }         from '../store/gitStore'
import { useNotificationStore } from '../store/notificationStore'
import { useFileTreeStore }    from '../store/fileTreeStore'
import { useAIStore }          from '../store/aiStore'
import { isIPCSuccess }        from '../../shared/ipc'
import { contentCache }        from './useEditor'
import { detectLanguage }      from '../../shared/constants/languages'
import type { GitDiffHunk }    from '../../shared/types/git.types'

let gitWatcherCleanup: (() => void) | null = null
let autoRefreshTimer: ReturnType<typeof setInterval> | null = null

export function useGit() {
  const store    = useGitStore()
  const { add: notify } = useNotificationStore()
  const { rootPath }    = useFileTreeStore()

  const storeRef  = useRef(store);   storeRef.current  = store
  const notifyRef = useRef(notify);  notifyRef.current = notify
  const rootRef   = useRef(rootPath);rootRef.current   = rootPath

  // ── Refresh ───────────────────────────────────────────────────────────────

  const refresh = useCallback(async () => {
    storeRef.current.setLoading(true)
    try {
      const res = await window.varta.git.status()
      if (isIPCSuccess(res)) {
        storeRef.current.setStatus(res.data)
      } else {
        storeRef.current.setStatus(null)
      }
    } catch {
      storeRef.current.setStatus(null)
    } finally {
      storeRef.current.setLoading(false)
    }
  }, [])

  // ── Stage / Unstage ───────────────────────────────────────────────────────

  const stageFile = useCallback(async (path: string) => {
    const res = await window.varta.git.stage([path])
    if (!isIPCSuccess(res)) {
      notifyRef.current({ type: 'error', message: `Stage failed: ${res.error.message}` })
    }
    await refresh()
  }, [refresh])

  const unstageFile = useCallback(async (path: string) => {
    const res = await window.varta.git.unstage([path])
    if (!isIPCSuccess(res)) {
      notifyRef.current({ type: 'error', message: `Unstage failed: ${res.error.message}` })
    }
    await refresh()
  }, [refresh])

  const stageAll = useCallback(async () => {
    await window.varta.git.stageAll()
    await refresh()
  }, [refresh])

  const unstageAll = useCallback(async () => {
    await window.varta.git.unstageAll()
    await refresh()
  }, [refresh])

  // ── Discard ───────────────────────────────────────────────────────────────

  const discardFile = useCallback(async (path: string) => {
    const filename = path.replace(/\\/g, '/').split('/').pop() ?? path
    const confirmRes = await window.varta.dialog.confirm(
      `Discard changes to '${filename}'?`,
      'This action cannot be undone.',
    )
    if (!isIPCSuccess(confirmRes) || !confirmRes.data.confirmed) { return }

    const res = await window.varta.git.discard([path])
    if (!isIPCSuccess(res)) {
      notifyRef.current({ type: 'error', message: `Discard failed: ${res.error.message}` })
      return
    }

    // Reload file in open tabs
    await reloadTabIfOpen(path)
    await refresh()
  }, [refresh])

  const discardAll = useCallback(async () => {
    const confirmRes = await window.varta.dialog.confirm(
      'Discard ALL changes?',
      'This will revert all modified files. This action cannot be undone.',
    )
    if (!isIPCSuccess(confirmRes) || !confirmRes.data.confirmed) { return }

    const { status } = storeRef.current
    if (!status) { return }

    const allPaths = [...status.unstaged, ...status.untracked].map((f) => f.path)
    if (allPaths.length > 0) {
      await window.varta.git.discard(allPaths)
    }

    // Reload all open dirty tabs
    const { useTabStore } = await import('../store/tabStore')
    const tabs = useTabStore.getState().tabs.filter((t) => t.isDirty)
    for (const tab of tabs) { await reloadTabIfOpen(tab.filePath) }

    await refresh()
  }, [refresh])

  // ── Commit ────────────────────────────────────────────────────────────────

  const commit = useCallback(async (message: string) => {
    const { status } = storeRef.current
    if (!status || status.staged.length === 0) {
      notifyRef.current({ type: 'warning', message: 'Stage files first before committing' })
      return
    }

    const res = await window.varta.git.commit({ message })
    if (!isIPCSuccess(res)) {
      notifyRef.current({ type: 'error', message: `Commit failed: ${res.error.message}` })
      return
    }

    notifyRef.current({ type: 'success', message: 'Committed successfully', duration: 2000 })
    storeRef.current.setGeneratedMessage(null)
    await refresh()
  }, [refresh])

  // ── Push / Pull / Fetch ───────────────────────────────────────────────────

  const push = useCallback(async () => {
    storeRef.current.setLoading(true)
    const res = await window.varta.git.push()
    if (!isIPCSuccess(res)) {
      const msg = res.error.message
      if (msg.includes('upstream') || msg.includes('no remote')) {
        const branch = storeRef.current.status?.branch ?? 'main'
        notifyRef.current({
          type: 'error',
          message: `No upstream branch. Run: git push --set-upstream origin ${branch}`,
          duration: 6000,
        })
      } else {
        notifyRef.current({ type: 'error', message: `Push failed: ${msg}` })
      }
    } else {
      notifyRef.current({ type: 'success', message: 'Pushed to remote', duration: 2000 })
    }
    await refresh()
  }, [refresh])

  const pull = useCallback(async () => {
    storeRef.current.setLoading(true)
    const res = await window.varta.git.pull()
    if (!isIPCSuccess(res)) {
      notifyRef.current({ type: 'error', message: `Pull failed: ${res.error.message}` })
    } else {
      notifyRef.current({ type: 'success', message: 'Pulled from remote', duration: 2000 })
      // Reload all open tabs — pull may have changed files
      const { useTabStore } = await import('../store/tabStore')
      for (const tab of useTabStore.getState().tabs) {
        await reloadTabIfOpen(tab.filePath)
      }
    }
    await refresh()
  }, [refresh])

  const fetchGit = useCallback(async () => {
    const res = await window.varta.git.fetch()
    if (!isIPCSuccess(res)) {
      notifyRef.current({ type: 'error', message: `Fetch failed: ${res.error.message}` })
    }
    await refresh()
  }, [refresh])

  // ── Branch operations ─────────────────────────────────────────────────────

  const checkout = useCallback(async (branch: string) => {
    const { status } = storeRef.current
    const hasDirty = (status?.unstaged.length ?? 0) > 0

    if (hasDirty) {
      const confirmRes = await window.varta.dialog.confirm(
        `Switch to '${branch}'?`,
        'You have uncommitted changes. They may be overwritten.',
      )
      if (!isIPCSuccess(confirmRes) || !confirmRes.data.confirmed) { return }
    }

    const res = await window.varta.git.checkout(branch)
    if (!isIPCSuccess(res)) {
      notifyRef.current({ type: 'error', message: `Checkout failed: ${res.error.message}` })
    }
    await refresh()
  }, [refresh])

  const createBranch = useCallback(async (name: string) => {
    const res = await window.varta.git.createBranch(name, true)
    if (!isIPCSuccess(res)) {
      notifyRef.current({ type: 'error', message: `Create branch failed: ${res.error.message}` })
    }
    await refresh()
  }, [refresh])

  const deleteBranch = useCallback(async (name: string) => {
    const confirmRes = await window.varta.dialog.confirm(
      `Delete branch '${name}'?`,
      'This action cannot be undone.',
    )
    if (!isIPCSuccess(confirmRes) || !confirmRes.data.confirmed) { return }

    const res = await window.varta.git.deleteBranch(name, false)
    if (!isIPCSuccess(res)) {
      notifyRef.current({ type: 'error', message: `Delete branch failed: ${res.error.message}` })
    }
    await refresh()
  }, [refresh])

  // ── AI commit message ─────────────────────────────────────────────────────

  const generateCommitMessage = useCallback(async () => {
    const { status } = storeRef.current
    if (!status) { return }

    const diffRes = await window.varta.git.diff()
    if (!isIPCSuccess(diffRes)) { return }

    const changedFiles = [
      ...status.staged.map((f) => f.path),
      ...status.unstaged.map((f) => f.path),
    ].slice(0, 20).join(', ')

    const prompt = [
      'Generate a concise git commit message for these changes.',
      'Format: type(scope): description',
      '',
      `Git diff (truncated):\n${diffRes.data.substring(0, 3000)}`,
      '',
      `Changed files: ${changedFiles}`,
      '',
      'Rules:',
      '- Max 72 chars for subject line',
      '- Use conventional commits format (feat/fix/refactor/docs/style/test/chore)',
      '- Be specific, not generic',
      '- No period at end',
      '- Return ONLY the commit message, nothing else',
    ].join('\n')

    const convId = `git-commit-${Date.now()}`
    const { useAIStore } = await import('../store/aiStore')
    useAIStore.getState().createConversation(convId, 'claude-haiku-3-5')

    // Listen for stream completion
    const off = window.varta.ai.onStreamEnd((event) => {
      if (event.conversationId !== convId) { return }
      off()
      const conv = useAIStore.getState().conversations.get(convId)
      const lastMsg = conv?.messages[conv.messages.length - 1]
      if (lastMsg?.content) {
        storeRef.current.setGeneratedMessage(lastMsg.content.trim())
      }
    })

    await window.varta.ai.sendMessage({
      conversationId: convId,
      message:        prompt,
    })
  }, [])

  // ── Open diff ─────────────────────────────────────────────────────────────

  const openDiff = useCallback(async (filePath: string, staged: boolean) => {
    const filename = filePath.replace(/\\/g, '/').split('/').pop() ?? filePath
    const tabId    = `diff:${filePath}:${staged ? 'staged' : 'working'}`
    const language = detectLanguage(filePath)

    let original = ''
    let modified = ''

    if (staged) {
      // For staged: compare HEAD vs Index
      const headRes = await window.varta.git.showFile(filePath, 'HEAD').catch(() => null)
      original = (headRes && isIPCSuccess(headRes)) ? headRes.data : ''

      const indexRes = await window.varta.git.showFile(filePath, 'INDEX').catch(() => null)
      modified = (indexRes && isIPCSuccess(indexRes)) ? indexRes.data : ''
    } else {
      // For unstaged: compare Index vs Working Tree
      const indexRes = await window.varta.git.showFile(filePath, 'INDEX').catch(() => null)
      original = (indexRes && isIPCSuccess(indexRes)) ? indexRes.data : ''

      // If INDEX is empty (e.g. new untracked file), try HEAD just in case, 
      // but usually untracked files have no base.
      if (!original) {
        const headRes = await window.varta.git.showFile(filePath, 'HEAD').catch(() => null)
        original = (headRes && isIPCSuccess(headRes)) ? headRes.data : ''
      }

      const modRes = await window.varta.fs.readFile(filePath)
      modified = modRes.success ? modRes.data.content : ''
    }

    const { useTabStore } = await import('../store/tabStore')
    const existing = useTabStore.getState().tabs.find((t) => t.id === tabId)
    if (existing) {
      useTabStore.getState().setActive(tabId)
      return
    }

    useTabStore.getState().addTab({
      id:        tabId,
      filePath:  filePath,
      title:     `Diff: ${filename}${staged ? ' (Staged)' : ''}`,
      language,
      isDirty:   false,
      isPreview: true,
      isPinned:  false,
      diffData:  { original, modified },
    })
  }, [])

  // ── Open file ─────────────────────────────────────────────────────────────

  const openFile = useCallback(async (filePath: string) => {
    const res = await window.varta.fs.readFile(filePath)
    if (!isIPCSuccess(res)) { return }

    const language = detectLanguage(filePath)
    const tabId    = `tab-${Date.now()}-${Math.random().toString(36).slice(2)}`

    const { useTabStore } = await import('../store/tabStore')
    const existing = useTabStore.getState().tabs.find((t) => t.filePath === filePath)
    if (existing) { useTabStore.getState().setActive(existing.id); return }

    contentCache.set(tabId, res.data.content)
    useTabStore.getState().addTab({
      id: tabId, filePath, title: res.data.stat.name,
      language, isDirty: false, isPreview: true, isPinned: false,
    })
  }, [])

  // ── Git watcher + auto-refresh ────────────────────────────────────────────

  useEffect(() => {
    // Listen for git changes pushed from main
    const offChanged = window.varta.git.onChanged((status) => {
      storeRef.current.setStatus(status)
    })
    gitWatcherCleanup = offChanged

    // Auto-refresh every 30 seconds
    autoRefreshTimer = setInterval(() => { refresh() }, 30_000)

    return () => {
      offChanged()
      if (autoRefreshTimer) { clearInterval(autoRefreshTimer); autoRefreshTimer = null }
    }
  }, [refresh])

  return {
    refresh, stageFile, unstageFile, stageAll, unstageAll,
    discardFile, discardAll, commit, push, pull, fetch: fetchGit,
    checkout, createBranch, deleteBranch,
    generateCommitMessage, openDiff, openFile,
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

async function reloadTabIfOpen(filePath: string) {
  const { useTabStore } = await import('../store/tabStore')
  const tab = useTabStore.getState().tabs.find((t) => t.filePath === filePath)
  if (!tab) { return }

  const res = await window.varta.fs.readFile(filePath)
  if (!isIPCSuccess(res)) { return }

  contentCache.set(tab.id, res.data.content)
  useTabStore.setState((s) => {
    const t = s.tabs.find((x) => x.id === tab.id)
    if (t) { t.isDirty = false }
  })
}

function buildOriginal(hunks: GitDiffHunk[]): string {
  return hunks.flatMap((h) =>
    h.lines.filter((l) => l.type !== 'add').map((l) => l.content)
  ).join('\n')
}

function buildModified(hunks: GitDiffHunk[]): string {
  return hunks.flatMap((h) =>
    h.lines.filter((l) => l.type !== 'remove').map((l) => l.content)
  ).join('\n')
}
