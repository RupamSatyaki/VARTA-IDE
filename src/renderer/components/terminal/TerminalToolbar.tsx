import React from 'react'
import { cn } from '../../utils/cn'
import { IconButton } from '../ui/IconButton'
import { useUIStore } from '../../store/uiStore'

export interface TerminalToolbarProps {
  onClear:    () => void
  onKill:     () => void
  onMaximize: () => void
  isMaximized?: boolean
}

export function TerminalToolbar({ onClear, onKill, onMaximize, isMaximized }: TerminalToolbarProps) {
  return (
    <div className="flex items-center gap-0.5 px-1 shrink-0">
      <IconButton
        tooltip="Clear Terminal"
        size="sm"
        onClick={onClear}
        aria-label="Clear terminal"
      >
        <ClearIcon />
      </IconButton>

      <IconButton
        tooltip="Kill Terminal"
        size="sm"
        onClick={onKill}
        aria-label="Kill terminal"
      >
        <KillIcon />
      </IconButton>

      <IconButton
        tooltip={isMaximized ? 'Restore Panel' : 'Maximize Panel'}
        size="sm"
        onClick={onMaximize}
        aria-label={isMaximized ? 'Restore panel' : 'Maximize panel'}
      >
        {isMaximized ? <RestoreIcon /> : <MaximizeIcon />}
      </IconButton>
    </div>
  )
}

const ClearIcon    = () => <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M10 3h3v1h-1v9l-1 1H5l-1-1V4H3V3h3V2a1 1 0 011-1h2a1 1 0 011 1v1zm-5 1v8h6V4H5zm1-1h4V2H6v1z"/></svg>
const KillIcon     = () => <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M8 1a7 7 0 100 14A7 7 0 008 1zm3.5 9.5l-1 1L8 9l-2.5 2.5-1-1L7 8 4.5 5.5l1-1L8 7l2.5-2.5 1 1L9 8l2.5 2.5z"/></svg>
const MaximizeIcon = () => <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M3 3h4v1H4v3H3V3zm6 0h4v4h-1V4h-3V3zM3 9h1v3h3v1H3V9zm10 3h-3v1h4V9h-1v3z"/></svg>
const RestoreIcon  = () => <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M5 5h6v6H5V5zm1 1v4h4V6H6zM3 3h4v1H4v3H3V3zm6 0h4v4h-1V4h-3V3z"/></svg>
