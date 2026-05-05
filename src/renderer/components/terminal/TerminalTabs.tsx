import React from 'react'
import { TerminalTab } from './TerminalTab'
import { TerminalToolbar } from './TerminalToolbar'
import { useTerminalStore } from '../../store/terminalStore'
import { useUIStore } from '../../store/uiStore'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPlus, faXmark } from '@fortawesome/free-solid-svg-icons'

export interface TerminalTabsProps {
  onNewTerminal:     () => void
  onDestroyTerminal: (id: string) => void
  onClearTerminal:   () => void
}

export function TerminalTabs({ onNewTerminal, onDestroyTerminal, onClearTerminal }: TerminalTabsProps) {
  const { instances, activeTerminalId, setActive } = useTerminalStore()
  const { panelHeight, setPanelHeight, setPanelVisible } = useUIStore()

  const instanceList = Array.from(instances.values())
  const isMaximized  = panelHeight > 500

  return (
    <div className="flex items-center h-[34px] bg-[#28242e] border-b border-[#2a1f30] shrink-0">

      {/* Tab list */}
      <div className="flex items-end h-full flex-1 overflow-x-auto overflow-y-hidden" style={{ scrollbarWidth: 'none' }}>
        {instanceList.map((inst) => (
          <TerminalTab
            key={inst.id}
            instance={inst}
            isActive={inst.id === activeTerminalId}
            onClick={() => setActive(inst.id)}
            onClose={() => onDestroyTerminal(inst.id)}
          />
        ))}

        {/* New terminal */}
        <button
          onClick={onNewTerminal}
          aria-label="New Terminal"
          title="New Terminal"
          className="flex items-center justify-center w-7 h-full text-[#4a4a6a] hover:text-[#9090b0] hover:bg-white/5 transition-colors shrink-0"
        >
          <FontAwesomeIcon icon={faPlus} style={{ fontSize: 11 }} />
        </button>
      </div>

      {/* Toolbar */}
      <TerminalToolbar
        onClear={onClearTerminal}
        onKill={() => activeTerminalId && onDestroyTerminal(activeTerminalId)}
        onMaximize={() => setPanelHeight(isMaximized ? 200 : 600)}
        isMaximized={isMaximized}
      />

      {/* Close panel */}
      <button
        onClick={() => setPanelVisible(false)}
        aria-label="Close panel"
        title="Close Panel"
        className="flex items-center justify-center w-7 h-full text-[#4a4a6a] hover:text-[#9090b0] hover:bg-white/5 transition-colors shrink-0 mr-1"
      >
        <FontAwesomeIcon icon={faXmark} style={{ fontSize: 12 }} />
      </button>
    </div>
  )
}
