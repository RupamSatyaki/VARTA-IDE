import React from 'react'
import { useTabStore } from '../../store/tabStore'

export function StatusBarLineCol() {
  const { tabs, activeTabId } = useTabStore()
  const activeTab = tabs.find((t) => t.id === activeTabId)

  const line = activeTab?.cursorLine ?? 1
  const col  = activeTab?.cursorCol  ?? 1

  if (!activeTab) { return null }

  return (
    <button
      title="Go to Line"
      className="flex items-center px-2 h-full hover:bg-white/20 transition-colors text-xs"
    >
      Ln {line}, Col {col}
    </button>
  )
}
