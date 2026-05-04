import React from 'react'
import { cn } from '../../utils/cn'
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
  // Derive shell label from profile
  const label = SHELL_LABELS[instance.profileId] ?? 'terminal'

  return (
    <div
      role="tab"
      aria-selected={isActive}
      onClick={onClick}
      className={cn(
        'group flex items-center gap-1.5 h-[30px] px-3 min-w-[80px] max-w-[160px]',
        'border-r border-[#252525] cursor-pointer select-none shrink-0 text-xs',
        'transition-colors',
        isActive
          ? 'bg-[#1e1e1e] text-[#d4d4d4] border-t-2 border-t-[#569cd6]'
          : 'bg-[#2d2d2d] text-[#6e6e6e] border-t-2 border-t-transparent hover:bg-[#252525] hover:text-[#d4d4d4]',
      )}
    >
      {/* Shell icon */}
      <TerminalIcon className="w-3 h-3 shrink-0" />

      {/* Label */}
      <span className="flex-1 truncate">{label}</span>

      {/* Close button */}
      <button
        onClick={(e) => { e.stopPropagation(); onClose() }}
        aria-label="Close terminal"
        className="opacity-0 group-hover:opacity-100 flex items-center justify-center w-3.5 h-3.5 rounded hover:bg-[#ffffff20] text-[#6e6e6e] hover:text-[#d4d4d4] transition-opacity shrink-0"
      >
        <svg width="8" height="8" viewBox="0 0 8 8" fill="currentColor">
          <path d="M4 3.293L6.646.646l.708.708L4.707 4l2.647 2.646-.708.708L4 4.707 1.354 7.354l-.708-.708L3.293 4 .646 1.354l.708-.708L4 3.293z"/>
        </svg>
      </button>
    </div>
  )
}

function TerminalIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="currentColor">
      <path d="M6 9L1 4l1-1 4 4-4 4-1-1 4-4zm4 4H6v-1h4v1z"/>
    </svg>
  )
}
