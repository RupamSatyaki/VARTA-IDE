import React from 'react'
import { useTabStore } from '../../store/tabStore'
import { useUIStore } from '../../store/uiStore'

export function StatusBarLanguage() {
  const { tabs, activeTabId } = useTabStore()
  const { openCommandPalette } = useUIStore()

  const activeTab = tabs.find((t) => t.id === activeTabId)
  if (!activeTab) { return null }

  const lang = activeTab.language ?? 'plaintext'
  const display = lang.charAt(0).toUpperCase() + lang.slice(1)
    .replace('typescriptreact', 'TypeScript JSX')
    .replace('javascriptreact', 'JavaScript JSX')
    .replace('typescript', 'TypeScript')
    .replace('javascript', 'JavaScript')
    .replace('plaintext', 'Plain Text')

  return (
    <button
      onClick={openCommandPalette}
      title="Select Language Mode"
      className="flex items-center px-2 h-full hover:bg-white/20 transition-colors text-xs"
    >
      {display}
    </button>
  )
}
