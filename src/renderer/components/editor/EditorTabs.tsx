import React, { useRef, useState, useCallback } from 'react'
import { cn } from '../../utils/cn'
import { EditorTab } from './EditorTab'
import { useTabStore } from '../../store/tabStore'
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

  // Drag-to-reorder
  const handleDragStart = useCallback((idx: number) => {
    dragIdx.current = idx
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent, idx: number) => {
    e.preventDefault()
    setDragOver(idx)
  }, [])

  const handleDrop = useCallback((toIdx: number) => {
    if (dragIdx.current !== null && dragIdx.current !== toIdx) {
      reorderTabs(dragIdx.current, toIdx)
    }
    dragIdx.current = null
    setDragOver(null)
  }, [reorderTabs])

  const handleDragEnd = useCallback(() => {
    dragIdx.current = null
    setDragOver(null)
  }, [])

  if (tabs.length === 0) { return null }

  return (
    <div className="flex items-center h-[35px] bg-[#2d2d2d] border-b border-[#252525] shrink-0 overflow-hidden">
      {/* Left scroll arrow */}
      <button
        onClick={() => handleScroll('left')}
        className="shrink-0 w-6 h-full flex items-center justify-center text-[#6e6e6e] hover:text-[#d4d4d4] hover:bg-[#3c3c3c]"
        aria-label="Scroll tabs left"
      >
        <svg width="8" height="8" viewBox="0 0 8 8" fill="currentColor"><path d="M5 1L2 4l3 3V1z"/></svg>
      </button>

      {/* Tab list */}
      <div
        ref={scrollRef}
        className="flex-1 flex items-center overflow-x-auto overflow-y-hidden"
        style={{ scrollbarWidth: 'none' }}
        onDoubleClick={(e) => {
          if (e.target === e.currentTarget) { onNewUntitled() }
        }}
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
              // Double-click converts preview to permanent
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
            style={dragOver === idx ? { opacity: 0.5 } : undefined}
          />
        ))}
      </div>

      {/* Right scroll arrow */}
      <button
        onClick={() => handleScroll('right')}
        className="shrink-0 w-6 h-full flex items-center justify-center text-[#6e6e6e] hover:text-[#d4d4d4] hover:bg-[#3c3c3c]"
        aria-label="Scroll tabs right"
      >
        <svg width="8" height="8" viewBox="0 0 8 8" fill="currentColor"><path d="M3 1l3 3-3 3V1z"/></svg>
      </button>
    </div>
  )
}
