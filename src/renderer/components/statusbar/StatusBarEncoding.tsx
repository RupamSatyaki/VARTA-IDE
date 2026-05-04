import React from 'react'
import { useTabStore } from '../../store/tabStore'

export function StatusBarEncoding() {
  const { tabs, activeTabId } = useTabStore()
  const activeTab = tabs.find((t) => t.id === activeTabId)
  if (!activeTab) { return null }

  return (
    <button
      title="Select Encoding"
      className="flex items-center px-2 h-full hover:bg-white/20 transition-colors text-xs"
    >
      UTF-8
    </button>
  )
}
