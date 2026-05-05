import React, { useRef, useState, useCallback } from 'react'
import { EditorTab } from './EditorTab'
import { useTabStore } from '../../store/tabStore'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faChevronLeft, faChevronRight, faPlus } from '@fortawesome/free-solid-svg-icons'
import type { EditorTab as EditorTabType } from '../../../shared/types/editor.types'

export interface EditorTabsProps {
  onCloseTab:    (tabId: string) => void
  onNewUntitled: () => void
}

export function EditorTabs({ onCloseTab, onNewUntitled }: EditorTabsProps) {
  const { tabs, activeTabId, setActive, reorderTabs } = useTabStore()

  const scrollRef  = useRef<HTMLDivElement>(null)
  const dragIdx    = useRef<number | null>(null)
  const [dragOver, setDragOver] = useState<number | null>(null)

  const handleTabClick = useCallback((tab: EditorTabType) => {
    setActive(tab.id)
  }, [setActive])

  const handleScroll = useCallback((dir: 'left' | 'right') => {
    if (!scrollRef.current) { return }
    scrollRef.current.scrollBy({ left: dir === 'left' ? -120 : 120, behavior: 'smooth' })
  }, [])

  const handleDragStart = useCallback((idx: number) => { dragIdx.current = idx }, [])
  const handleDragOver  = useCallback((e: React.DragEvent, idx: number) => { e.preventDefault(); setDragOver(idx) }, [])
  const handleDrop      = useCallback((toIdx: number) => {
    if (dragIdx.current !== null && dragIdx.current !== toIdx) { reorderTabs(dragIdx.current, toIdx) }
    dragIdx.current = null; setDragOver(null)
  }, [reorderTabs])
  const handleDragEnd   = useCallback(() => { dragIdx.current = null; setDragOver(null) }, [])

  if (tabs.length === 0) { return null }

  return (
    <div className="flex items-center h-[38px] bg-[#28242e] border-b border-[#2a1f30] shrink-0 overflow-hidden">

      {/* Left scroll */}
      <button
        onClick={() => handleScroll('left')}
        className="shrink-0 w-6 h-full flex items-center justify-center text-[#4a4a6a] hover:text-[#9090b0] transition-colors"
        aria-label="Scroll tabs left"
      >
        <FontAwesomeIcon icon={faChevronLeft} style={{ fontSize: 9 }} />
      </button>

      {/* Tab list */}
      <div
        ref={scrollRef}
        className="flex-1 flex items-end h-full overflow-x-auto overflow-y-hidden"
        style={{ scrollbarWidth: 'none' }}
        onDoubleClick={(e) => { if (e.target === e.currentTarget) { onNewUntitled() } }}
      >
        {tabs.map((tab, idx) => (
          <EditorTab
            key={tab.id}
            tab={tab}
            isActive={tab.id === activeTabId}
            onClick={() => handleTabClick(tab)}
            onClose={() => onCloseTab(tab.id)}
            onMiddleClick={() => onCloseTab(tab.id)}
            onDoubleClick={() => {
              if (tab.isPreview) {
                useTabStore.setState((s) => {
                  const t = s.tabs.find((x) => x.id === tab.id)
                  if (t) { t.isPreview = false }
                })
              }
            }}
            dragHandleProps={{
              draggable: true,
              onDragStart: () => handleDragStart(idx),
              onDragOver:  (e: React.DragEvent) => handleDragOver(e, idx),
              onDrop:      () => handleDrop(idx),
              onDragEnd:   handleDragEnd,
            }}
            style={dragOver === idx ? { opacity: 0.4 } : undefined}
          />
        ))}
      </div>

      {/* New tab button */}
      <button
        onClick={onNewUntitled}
        title="New File"
        className="shrink-0 w-8 h-full flex items-center justify-center text-[#4a4a6a] hover:text-[#9090b0] hover:bg-white/5 transition-colors"
        aria-label="New tab"
      >
        <FontAwesomeIcon icon={faPlus} style={{ fontSize: 11 }} />
      </button>

      {/* Right scroll */}
      <button
        onClick={() => handleScroll('right')}
        className="shrink-0 w-6 h-full flex items-center justify-center text-[#4a4a6a] hover:text-[#9090b0] transition-colors"
        aria-label="Scroll tabs right"
      >
        <FontAwesomeIcon icon={faChevronRight} style={{ fontSize: 9 }} />
      </button>

    </div>
  )
}
