import React from 'react'
import { cn } from '../../utils/cn'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faTerminal, faXmark } from '@fortawesome/free-solid-svg-icons'
import type { TerminalInstance } from '../../../shared/types/terminal.types'

export interface TerminalTabProps {
  instance:  TerminalInstance
  isActive:  boolean
  onClick:   () => void
  onClose:   () => void
}

const SHELL_LABELS: Record<string, string> = {
  powershell: 'pwsh',
  cmd:        'cmd',
  bash:       'bash',
  zsh:        'zsh',
  fish:       'fish',
  custom:     'sh',
}

export function TerminalTab({ instance, isActive, onClick, onClose }: TerminalTabProps) {
  const label = SHELL_LABELS[instance.profileId] ?? 'terminal'

  return (
    <div
      role="tab"
      aria-selected={isActive}
      onClick={onClick}
      className={cn(
        'group relative flex items-center gap-1.5 h-[34px] px-3.5',
        'min-w-[90px] max-w-[150px] cursor-pointer select-none shrink-0',
        'text-[12px] transition-all duration-150',
        isActive
          ? 'bg-varta-active text-varta-text'
          : 'text-varta-text-faint hover:text-varta-text-muted hover:bg-white/5',
      )}
    >
      {/* Active top accent */}
      {isActive && (
        <span className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-varta-accent to-varta-accent-hover active-tab-glow" />
      )}

      {/* Right separator */}
      {!isActive && (
        <span className="absolute right-0 top-2 bottom-2 w-px bg-varta-border" />
      )}

      {/* Terminal icon */}
      <FontAwesomeIcon
        icon={faTerminal}
        style={{ fontSize: 11 }}
        className={cn('shrink-0', isActive ? 'text-varta-accent' : 'text-varta-text-faint')}
      />

      {/* Label */}
      <span className="flex-1 truncate">{label}</span>

      {/* Close */}
      <button
        onClick={(e) => { e.stopPropagation(); onClose() }}
        aria-label="Close terminal"
        className="opacity-0 group-hover:opacity-100 flex items-center justify-center w-4 h-4 rounded
          hover:bg-white/10 text-[#6e6e8a] hover:text-white transition-all shrink-0"
      >
        <FontAwesomeIcon icon={faXmark} style={{ fontSize: 10 }} />
      </button>
    </div>
  )
}
