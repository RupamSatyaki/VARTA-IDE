import React from 'react'
import { cn } from '../../utils/cn'
import { TerminalTab } from './TerminalTab'
import { TerminalToolbar } from './TerminalToolbar'
import { useTerminalStore } from '../../store/terminalStore'
import { useUIStore } from '../../store/uiStore'

export interface TerminalTabsProps {
  onNewTerminal:     () => void
  onDestroyTerminal: (id: string) => void
  onClearTerminal:   () => void
}

export function TerminalTabs({
  onNewTerminal,
  onDestroyTerminal,
  onClearTerminal,
}: TerminalTabsProps) {
  const { instances, activeTerminalId, setActive } = useTerminalStore()
  const { panelHeight, setPanelHeight, setPanelVisible } = useUIStore()

  const instanceList = Array.from(instances.values())

  const isMaximized = panelHeight > 500

  const handleMaximize = () => {
    if (isMaximized) {
      setPanelHeight(200)
    } else {
      setPanelHeight(600)
    }
  }

  return (
    <div className="flex items-center h-[30px] bg-[#252526] border-b border-[#333333] shrink-0">
      {/* Tab list */}
      <div className="flex items-center flex-1 overflow-x-auto overflow-y-hidden" style={{ scrollbarWidth: 'none' }}>
        {instanceList.map((inst) => (
          <TerminalTab
            key={inst.id}
            instance={inst}
            isActive={inst.id === activeTerminalId}
            onClick={() => setActive(inst.id)}
            onClose={() => onDestroyTerminal(inst.id)}
          />
        ))}

        {/* New terminal button */}
        <button
          onClick={onNewTerminal}
          aria-label="New Terminal"
          className="flex items-center justify-center w-7 h-[30px] text-[#6e6e6e] hover:text-[#d4d4d4] hover:bg-[#2a2d2e] transition-colors shrink-0"
          title="New Terminal"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
            <path d="M11 5H7V1H5v4H1v2h4v4h2V7h4z"/>
          </svg>
        </button>
      </div>

      {/* Toolbar */}
      <TerminalToolbar
        onClear={onClearTerminal}
        onKill={() => activeTerminalId && onDestroyTerminal(activeTerminalId)}
        onMaximize={handleMaximize}
        isMaximized={isMaximized}
      />

      {/* Close panel button */}
      <button
        onClick={() => setPanelVisible(false)}
        aria-label="Close panel"
        className="flex items-center justify-center w-7 h-[30px] text-[#6e6e6e] hover:text-[#d4d4d4] hover:bg-[#2a2d2e] transition-colors shrink-0 mr-1"
        title="Close Panel"
      >
        <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
          <path d="M5 4.293L8.646.646l.708.708L5.707 5l3.647 3.646-.708.708L5 5.707 1.354 9.354l-.708-.708L4.293 5 .646 1.354l.708-.708L5 4.293z"/>
        </svg>
      </button>
    </div>
  )
}
