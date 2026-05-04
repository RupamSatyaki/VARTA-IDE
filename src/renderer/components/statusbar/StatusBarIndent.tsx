import React from 'react'
import { useSettingsStore } from '../../store/settingsStore'
import { useTabStore } from '../../store/tabStore'

export function StatusBarIndent() {
  const { settings } = useSettingsStore()
  const { tabs, activeTabId } = useTabStore()
  const activeTab = tabs.find((t) => t.id === activeTabId)
  if (!activeTab) { return null }

  const { tabSize, indentStyle } = settings.editor
  const label = indentStyle === 'tabs' ? `Tab Size: ${tabSize}` : `Spaces: ${tabSize}`

  return (
    <button
      title="Select Indentation"
      className="flex items-center px-2 h-full hover:bg-white/20 transition-colors text-xs"
    >
      {label}
    </button>
  )
}
