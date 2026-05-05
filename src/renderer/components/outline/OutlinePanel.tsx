import React, { useState, useEffect, useRef } from 'react'
import { OutlineToolbar } from './OutlineToolbar'
import { OutlineItem, type OutlineSymbol } from './OutlineItem'
import { useTabStore } from '../../store/tabStore'
import { Spinner } from '../ui/Spinner'

// Global ref to Monaco editor instance — set by CodeCanvas
export let globalEditorRef: { current: unknown } = { current: null }

export function OutlinePanel() {
  const { tabs, activeTabId } = useTabStore()
  const activeTab = tabs.find((t) => t.id === activeTabId)

  const [symbols,      setSymbols]      = useState<OutlineSymbol[]>([])
  const [loading,      setLoading]      = useState(false)
  const [followCursor, setFollowCursor] = useState(true)
  const [searchText,   setSearchText]   = useState('')
  const [activeLine,   setActiveLine]   = useState(0)

  // Fetch symbols when active tab changes
  useEffect(() => {
    if (!activeTab) { setSymbols([]); return }
    setLoading(true)

    // Use Monaco's document symbol provider via a custom event
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail
      if (detail?.tabId === activeTab.id) {
        setSymbols(detail.symbols ?? [])
        setLoading(false)
      }
    }
    window.addEventListener('varta:outline-symbols', handler)

    // Request symbols
    window.dispatchEvent(new CustomEvent('varta:request-outline', {
      detail: { tabId: activeTab.id },
    }))

    // Fallback: clear loading after 2s if no response
    const t = setTimeout(() => setLoading(false), 2000)

    return () => {
      window.removeEventListener('varta:outline-symbols', handler)
      clearTimeout(t)
    }
  }, [activeTab?.id])

  // Follow cursor
  useEffect(() => {
    if (!followCursor) { return }
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail
      if (detail?.line) { setActiveLine(detail.line) }
    }
    window.addEventListener('varta:cursor-moved', handler)
    return () => window.removeEventListener('varta:cursor-moved', handler)
  }, [followCursor])

  const filtered = searchText
    ? symbols.filter((s) => s.name.toLowerCase().includes(searchText.toLowerCase()))
    : symbols

  const handleSymbolClick = (line: number) => {
    window.dispatchEvent(new CustomEvent('varta:reveal-line', { detail: { line } }))
  }

  return (
    <div className="flex flex-col h-full overflow-hidden bg-[#252526]">
      {/* Header */}
      <div className="px-3 py-2 text-[10px] font-semibold uppercase tracking-widest text-[#6e6e6e] border-b border-[#333333] shrink-0">
        Outline
      </div>

      <OutlineToolbar
        followCursor={followCursor}
        onToggleFollow={() => setFollowCursor((v) => !v)}
        onCollapseAll={() => setSymbols([])}
        searchText={searchText}
        onSearchChange={setSearchText}
      />

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Spinner size="sm" />
          </div>
        ) : !activeTab ? (
          <div className="flex items-center justify-center h-full text-xs text-[#6e6e6e]">
            Open a file to see its outline
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex items-center justify-center h-full text-xs text-[#6e6e6e]">
            No symbols found
          </div>
        ) : (
          filtered.map((sym, i) => (
            <OutlineItem
              key={`${sym.name}-${sym.line}-${i}`}
              symbol={sym}
              isActive={followCursor && activeLine >= sym.line && activeLine <= (sym.line + 10)}
              onClick={handleSymbolClick}
            />
          ))
        )}
      </div>
    </div>
  )
}
