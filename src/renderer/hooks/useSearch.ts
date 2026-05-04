import { useCallback, useEffect, useRef } from 'react'
import { useSearchStore }      from '../store/searchStore'
import { useFileTreeStore }    from '../store/fileTreeStore'
import { useNotificationStore } from '../store/notificationStore'
import { isIPCSuccess }        from '../../shared/ipc'
import { contentCache }        from './useEditor'
import type { SearchQuery }    from '../../shared/types/search.types'
import type * as Monaco        from 'monaco-editor'

// FIX 5: Debounce delay
const DEBOUNCE_MS = 400

let searchDebounceTimer: ReturnType<typeof setTimeout> | null = null

export function useSearch() {
  const store    = useSearchStore()
  const { rootPath } = useFileTreeStore()
  const { add: notify } = useNotificationStore()

  const storeRef  = useRef(store);   storeRef.current  = store
  const notifyRef = useRef(notify);  notifyRef.current = notify
  const rootRef   = useRef(rootPath);rootRef.current   = rootPath

  // ── FIX 6: Listen to streaming progress from main ─────────────────────────
  useEffect(() => {
    const off = window.varta.search.onProgress((event: any) => {
      if (event.done) {
        // Final result arrived
        if (event.error) {
          storeRef.current.setError(event.error.message)
        } else {
          // Merge final result into store
          storeRef.current.setResults({
            query:        event.query ?? storeRef.current.query,
            files:        event.files ?? [],
            totalMatches: event.totalMatches ?? 0,
            totalFiles:   event.totalFiles ?? 0,
            truncated:    event.truncated ?? false,
            durationMs:   event.durationMs ?? 0,
          })
        }
      } else {
        // Streaming progress update
        storeRef.current.setProgress({
          scannedFiles: event.scannedFiles ?? 0,
          matchedFiles: event.matchedFiles ?? 0,
          totalMatches: event.totalMatches ?? 0,
          currentFile:  event.currentFile  ?? '',
        })
      }
    })
    return off
  }, [])

  // ── Search ────────────────────────────────────────────────────────────────

  const search = useCallback((query: SearchQuery) => {
    const root = rootRef.current
    if (!root) {
      notifyRef.current({ type: 'warning', message: 'Open a folder first to search' })
      return
    }
    if (!query.text?.trim()) {
      storeRef.current.clearResults()
      return
    }

    // Validate regex immediately (don't wait for debounce)
    if (query.isRegex) {
      try { new RegExp(query.text) } catch {
        storeRef.current.setError(`Invalid regular expression: ${query.text}`)
        return
      }
    }

    // FIX 5: Cancel previous + debounce
    window.varta.search.cancel().catch(() => {})
    if (searchDebounceTimer) { clearTimeout(searchDebounceTimer) }

    storeRef.current.setSearching(true)
    storeRef.current.clearResults()

    searchDebounceTimer = setTimeout(async () => {
      searchDebounceTimer = null
      try {
        // FIX 6: Returns { started: true } immediately
        // Results stream via onProgress listener above
        await window.varta.search.findInFiles(root, query)
      } catch {
        storeRef.current.setError('Search failed')
      }
    }, DEBOUNCE_MS)
  }, [])

  // ── Replace All ───────────────────────────────────────────────────────────

  const replaceAll = useCallback(async () => {
    const root    = rootRef.current
    const { query, replaceText, results } = storeRef.current

    if (!root || !query.text || !results || results.totalMatches === 0) { return }

    const confirmRes = await window.varta.dialog.confirm(
      `Replace ${results.totalMatches} occurrence${results.totalMatches !== 1 ? 's' : ''} in ${results.totalFiles} file${results.totalFiles !== 1 ? 's' : ''}?`,
      `Replace "${query.text}" with "${replaceText}"`,
    )
    if (!isIPCSuccess(confirmRes) || !confirmRes.data.confirmed) { return }

    const res = await window.varta.search.replaceInFiles(root, { ...query, replaceText })
    if (!isIPCSuccess(res)) {
      notifyRef.current({ type: 'error', message: `Replace failed: ${res.error.message}` })
      return
    }

    const { filesModified, totalReplacements } = res.data

    // Reload content for open tabs that were modified
    const modifiedPaths = new Set(results.files.map((f) => f.filePath))
    const { useTabStore } = await import('../store/tabStore')
    const tabs = useTabStore.getState().tabs

    for (const tab of tabs) {
      if (!modifiedPaths.has(tab.filePath)) { continue }
      const fileRes = await window.varta.fs.readFile(tab.filePath)
      if (isIPCSuccess(fileRes)) {
        contentCache.set(tab.id, fileRes.data.content)
        useTabStore.setState((s) => {
          const t = s.tabs.find((x) => x.id === tab.id)
          if (t) { t.isDirty = false }
        })
      }
    }

    notifyRef.current({
      type:     'success',
      message:  `Replaced ${totalReplacements} occurrence${totalReplacements !== 1 ? 's' : ''} in ${filesModified} file${filesModified !== 1 ? 's' : ''}`,
      duration: 3000,
    })

    // Re-run search to show updated results
    search(query)
  }, [search])

  // ── Cancel ────────────────────────────────────────────────────────────────

  const cancelSearch = useCallback(() => {
    if (searchDebounceTimer) { clearTimeout(searchDebounceTimer); searchDebounceTimer = null }
    window.varta.search.cancel().catch(() => {})
    storeRef.current.setSearching(false)
  }, [])

  return { search, replaceAll, cancelSearch }
}

// ── Navigate to match ─────────────────────────────────────────────────────────

export function navigateToMatch(
  filePath:    string,
  lineNumber:  number,
  column:      number,
  matchLength: number,
) {
  Promise.all([
    import('../store/tabStore'),
    import('../store/editorStore'),
  ]).then(([tabMod, editorMod]) => {
    const tabStore    = tabMod.useTabStore.getState()
    const editorStore = editorMod.useEditorStore.getState()

    const existingTab = tabStore.tabs.find((t) => t.filePath === filePath)

    const revealInEditor = (tabId: string) => {
      editorStore.onEditorReady(tabId, (editorInstance: unknown) => {
        const editor = editorInstance as Monaco.editor.IStandaloneCodeEditor
        editor.revealLineInCenter(lineNumber)
        editor.setSelection({
          startLineNumber: lineNumber, startColumn: column,
          endLineNumber:   lineNumber, endColumn:   column + matchLength,
        })
        editor.focus()
      })

      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('varta:reveal-in-editor', {
          detail: { tabId, lineNumber, column, matchLength },
        }))
      }, 150)
    }

    if (existingTab) {
      tabStore.setActive(existingTab.id)
      revealInEditor(existingTab.id)
    } else {
      window.varta.fs.readFile(filePath).then(async (res) => {
        if (!isIPCSuccess(res)) { return }
        const { detectLanguage } = await import('../../shared/constants/languages')
        const language = detectLanguage(filePath)
        const tabId    = `tab-${Date.now()}-${Math.random().toString(36).slice(2)}`
        const tab = {
          id: tabId, filePath, title: res.data.stat.name,
          language, isDirty: false, isPreview: true, isPinned: false,
        }
        contentCache.set(tabId, res.data.content)
        tabMod.useTabStore.getState().addTab(tab)
        revealInEditor(tabId)
      }).catch(() => {})
    }
  })
}
