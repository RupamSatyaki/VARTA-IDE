import React from 'react'
import { useTabStore } from '../../store/tabStore'

export function StatusBarEncoding() {
  const { tabs, activeTabId } = useTabStore()
  const activeTab = tabs.find((t) => t.id === activeTabId)
  if (!activeTab) { return null }

  return (
    <button
      title="Select Encoding"
      className="flex items-center px-2.5 h-full hover:bg-white/5 hover:text-white transition-colors text-[11px] text-[#9090b0]"
    >
      UTF-8
    </button>
  )
}
