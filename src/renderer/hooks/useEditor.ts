import { useCallback, useRef } from 'react'
import { useTabStore }          from '../store/tabStore'
import { useSettingsStore }     from '../store/settingsStore'
import { useNotificationStore } from '../store/notificationStore'
import { detectLanguage }       from '../../shared/constants/languages'
import { isIPCSuccess }         from '../../shared/ipc'

const MAX_OPEN_SIZE = 5 * 1024 * 1024  // 5 MB

/**
 * Per-tab content cache — lives outside React state so Monaco edits
 * don't trigger re-renders. Keyed by tabId.
 */
export const contentCache = new Map<string, string>()

let saveDebounceTimer: ReturnType<typeof setTimeout> | null = null

export function useEditor() {
  const { settings } = useSettingsStore()
  const { add: notify } = useNotificationStore()

  const settingsRef = useRef(settings)
  const notifyRef   = useRef(notify)
  settingsRef.current = settings
  notifyRef.current   = notify

  // ── Open file ─────────────────────────────────────────────────────────────

  const openFile = useCallback(async (filePath: string, preview = true) => {
    const tabStore = useTabStore.getState()

    // Untitled
    if (filePath === 'untitled') {
      const tabId = `tab-untitled-${Date.now()}`
      contentCache.set(tabId, '')
      tabStore.addTab({
        id: tabId, filePath: 'untitled', title: 'Untitled',
        language: 'plaintext', isDirty: false, isPreview: false, isPinned: false,
      })
      return
    }

    // Already open → activate
    const existing = tabStore.tabs.find((t) => t.filePath === filePath)
    if (existing) {
      tabStore.setActive(existing.id)
      return
    }

    const res = await window.varta.fs.readFile(filePath)
    if (!isIPCSuccess(res)) {
      notifyRef.current({ type: 'error', message: `Cannot open: ${res.error.message}` })
      return
    }

    const { stat, content, encoding } = res.data

    if (encoding === 'binary') {
      notifyRef.current({ type: 'warning', message: `'${stat.name}' is a binary file.` })
      return
    }

    if (stat.size > MAX_OPEN_SIZE) {
      notifyRef.current({
        type: 'warning',
        message: `'${stat.name}' is large (${(stat.size / 1024 / 1024).toFixed(1)} MB).`,
        duration: 5000,
      })
    }

    const language = detectLanguage(filePath)
    const tabId    = `tab-${Date.now()}-${Math.random().toString(36).slice(2)}`

    contentCache.set(tabId, content)
    tabStore.addTab({
      id: tabId, filePath, title: stat.name,
      language, isDirty: false, isPreview: preview, isPinned: false,
    })
  }, [])

  // ── Get content ───────────────────────────────────────────────────────────

  const getContent = useCallback((tabId: string): string => {
    return contentCache.get(tabId) ?? ''
  }, [])

  // ── Save file ─────────────────────────────────────────────────────────────

  const saveFile = useCallback(async (tabId: string) => {
    const tab = useTabStore.getState().tabs.find((t) => t.id === tabId)
    if (!tab) { return }

    // Untitled → prompt for path
    if (tab.filePath === 'untitled') {
      const res = await window.varta.dialog.saveFile({
        title: 'Save File',
        filters: [{ name: 'All Files', extensions: ['*'] }],
      })
      if (!isIPCSuccess(res) || res.data.cancelled || !res.data.path) { return }

      const newPath = res.data.path
      const content = contentCache.get(tabId) ?? ''
      const writeRes = await window.varta.fs.writeFile({ path: newPath, content, createDirs: false })
      if (!isIPCSuccess(writeRes)) {
        notifyRef.current({ type: 'error', message: `Save failed: ${writeRes.error.message}` })
        return
      }
      useTabStore.setState((s) => {
        const t = s.tabs.find((x) => x.id === tabId)
        if (t) {
          t.filePath  = newPath
          t.title     = newPath.replace(/\\/g, '/').split('/').pop() ?? 'file'
          t.isDirty   = false
          t.isPreview = false
        }
      })
      notifyRef.current({ type: 'success', message: 'Saved', duration: 1500 })
      return
    }

    const content = contentCache.get(tabId) ?? ''
    const res = await window.varta.fs.writeFile({ path: tab.filePath, content, createDirs: false })

    if (isIPCSuccess(res)) {
      useTabStore.setState((s) => {
        const t = s.tabs.find((x) => x.id === tabId)
        if (t) { t.isDirty = false }
      })
      notifyRef.current({ type: 'success', message: 'Saved', duration: 1200 })
    } else {
      notifyRef.current({ type: 'error', message: `Save failed: ${res.error.message}` })
    }
  }, [])

  // ── Save all ──────────────────────────────────────────────────────────────

  const saveAllFiles = useCallback(async () => {
    const dirty = useTabStore.getState().tabs.filter((t) => t.isDirty)
    await Promise.all(dirty.map((t) => saveFile(t.id)))
  }, [saveFile])

  // ── Close tab ─────────────────────────────────────────────────────────────

  const closeTab = useCallback((tabId: string) => {
    useTabStore.getState().removeTab(tabId)
    contentCache.delete(tabId)
  }, [])

  // ── Handle content change ─────────────────────────────────────────────────

  const handleChange = useCallback((tabId: string, newContent: string) => {
    contentCache.set(tabId, newContent)

    // Mark dirty in tabStore
    useTabStore.setState((s) => {
      const t = s.tabs.find((x) => x.id === tabId)
      if (t) { t.isDirty = true; t.isPreview = false }
    })

    // Auto-save debounce
    if (settingsRef.current.workbench.autoSave === 'afterDelay') {
      if (saveDebounceTimer) { clearTimeout(saveDebounceTimer) }
      saveDebounceTimer = setTimeout(() => {
        saveFile(tabId)
        saveDebounceTimer = null
      }, settingsRef.current.workbench.autoSaveDelay)
    }
  }, [saveFile])

  // ── Reopen last closed ────────────────────────────────────────────────────

  const reopenLastClosed = useCallback(async () => {
    const tab = useTabStore.getState().reopenLast()
    if (tab) { await openFile(tab.filePath, false) }
  }, [openFile])

  return {
    openFile,
    getContent,
    saveFile,
    saveAllFiles,
    closeTab,
    handleChange,
    reopenLastClosed,
  }
}
