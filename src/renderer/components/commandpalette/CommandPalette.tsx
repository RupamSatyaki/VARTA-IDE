import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { CommandInput } from './CommandInput'
import { CommandList, type FileResult } from './CommandList'
import { registry } from '../../lib/commandRegistry'
import { useUIStore } from '../../store/uiStore'
import { useFileTreeStore } from '../../store/fileTreeStore'
import { useTabStore } from '../../store/tabStore'
import type { Command } from '../../lib/commandRegistry'

export function CommandPalette() {
  const { commandPaletteOpen, closeCommandPalette } = useUIStore()
  const { nodes, rootPath } = useFileTreeStore()
  const { tabs } = useTabStore()

  const [query,       setQuery]       = useState('')
  const [mode,        setMode]        = useState<'files' | 'commands'>('commands')
  const [selectedIdx, setSelectedIdx] = useState(0)

  // Reset on open
  useEffect(() => {
    if (!commandPaletteOpen) { return }
    setQuery('')
    setSelectedIdx(0)
  }, [commandPaletteOpen])

  // Detect mode from query prefix
  useEffect(() => {
    if (query.startsWith('>')) {
      setMode('commands')
    } else {
      setMode('files')
    }
    setSelectedIdx(0)
  }, [query])

  // ── File results ──────────────────────────────────────────────────────────
  const fileResults = useMemo((): FileResult[] => {
    if (mode !== 'files') { return [] }
    const q = query.toLowerCase().trim()

    // Flatten file tree
    const allFiles: FileResult[] = []
    const flatten = (nodeList: typeof nodes) => {
      for (const n of nodeList) {
        if (n.type === 'file') {
          allFiles.push({
            path:     n.path,
            filename: n.name,
          })
        }
        if (n.children) { flatten(n.children) }
      }
    }
    flatten(nodes)

    // Open tabs first
    const openPaths = new Set(tabs.map((t) => t.filePath))
    const sorted = [
      ...allFiles.filter((f) => openPaths.has(f.path)),
      ...allFiles.filter((f) => !openPaths.has(f.path)),
    ]

    if (!q) { return sorted.slice(0, 50) }

    return sorted
      .filter((f) => f.filename.toLowerCase().includes(q) || f.path.toLowerCase().includes(q))
      .slice(0, 50)
  }, [query, mode, nodes, tabs])

  // ── Command results ───────────────────────────────────────────────────────
  const commandResults = useMemo((): Command[] => {
    if (mode !== 'commands') { return [] }
    const q = query.replace(/^>/, '').trim()
    if (!q) { return registry.getAll() }
    return registry.search(q)
  }, [query, mode])

  const recentCmds = useMemo(() => registry.getRecentlyUsed(), [commandPaletteOpen])

  const totalItems = mode === 'files' ? fileResults.length : commandResults.length

  // ── Keyboard navigation ───────────────────────────────────────────────────
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') { closeCommandPalette(); return }

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIdx((i) => Math.min(i + 1, totalItems - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIdx((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      executeSelected(selectedIdx)
    }
  }, [selectedIdx, totalItems, closeCommandPalette])

  const executeSelected = useCallback((idx: number) => {
    if (mode === 'files') {
      const file = fileResults[idx]
      if (!file) { return }
      registry.execute('file.openPath')
      // Open file via a special command
      import('../../hooks/useEditor').then(({ contentCache }) => {
        import('../../store/tabStore').then(({ useTabStore: ts }) => {
          import('../../../shared/constants/languages').then(({ detectLanguage }) => {
            window.varta.fs.readFile(file.path).then((res) => {
              if (!res.success) { return }
              const tabId = `tab-${Date.now()}`
              contentCache.set(tabId, res.data.content)
              ts.getState().addTab({
                id: tabId, filePath: file.path, title: file.filename,
                language: detectLanguage(file.path),
                isDirty: false, isPreview: false, isPinned: false,
              })
            })
          })
        })
      })
    } else {
      const cmd = commandResults[idx]
      if (!cmd) { return }
      registry.execute(cmd.id)
    }
    closeCommandPalette()
  }, [mode, fileResults, commandResults, closeCommandPalette])

  if (!commandPaletteOpen) { return null }

  return (
    <div
      className="fixed inset-0 z-[8500] flex items-start justify-center pt-[15vh]"
      onClick={(e) => { if (e.target === e.currentTarget) { closeCommandPalette() } }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" />

      {/* Panel */}
      <div className="relative w-[600px] max-w-[90vw] rounded-lg border border-[#454545] bg-[#252526] shadow-2xl overflow-hidden animate-slide-down">
        <CommandInput
          value={query}
          onChange={setQuery}
          onKeyDown={handleKeyDown}
          mode={mode}
        />

        {totalItems > 0 ? (
          <CommandList
            mode={mode}
            commands={commandResults}
            files={fileResults}
            recentCmds={recentCmds}
            selectedIdx={selectedIdx}
            rootPath={rootPath ?? undefined}
            onSelect={setSelectedIdx}
            onExecute={executeSelected}
          />
        ) : (
          <div className="flex items-center justify-center py-8 text-sm text-[#6e6e6e]">
            No results for "{query.replace(/^>/, '').trim()}"
          </div>
        )}

        {/* Footer hint */}
        <div className="flex items-center gap-4 px-4 py-2 border-t border-[#333333] text-[10px] text-[#6e6e6e]">
          <span>↑↓ navigate</span>
          <span>↵ select</span>
          <span>ESC close</span>
          <span className="ml-auto">
            {mode === 'files' ? 'Type > for commands' : 'Remove > for files'}
          </span>
        </div>
      </div>
    </div>
  )
}
