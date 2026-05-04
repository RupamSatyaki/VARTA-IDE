import React from 'react'
import { useUIStore } from '../../store/uiStore'

export function StatusBarErrors() {
  const { setActiveBottomPanel, setPanelVisible } = useUIStore()

  const handleClick = () => {
    setActiveBottomPanel('problems')
    setPanelVisible(true)
  }

  return (
    <button
      onClick={handleClick}
      title="Errors and Warnings"
      className="flex items-center gap-2 px-2 h-full hover:bg-white/20 transition-colors text-xs"
    >
      <span className="flex items-center gap-1">
        <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
          <path d="M8 1a7 7 0 100 14A7 7 0 008 1zm0 1a6 6 0 110 12A6 6 0 018 2zm-.5 3v5h1V6h-1zm0 6v1h1v-1h-1z"/>
        </svg>
        0
      </span>
      <span className="flex items-center gap-1">
        <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
          <path d="M7.56 1h.88l6.54 12.26-.44.74H1.44L1 13.26 7.56 1zM8 2.28L2.28 13H13.72L8 2.28zM8.625 12v-1h-1.25v1h1.25zm-1.25-2V6h1.25v4h-1.25z"/>
        </svg>
        0
      </span>
    </button>
  )
}
