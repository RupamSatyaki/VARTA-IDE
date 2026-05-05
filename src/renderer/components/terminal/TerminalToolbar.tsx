import React from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faTrash, faStop, faUpRightAndDownLeftFromCenter, faDownLeftAndUpRightToCenter } from '@fortawesome/free-solid-svg-icons'
import { Tooltip } from '../ui/Tooltip'

export interface TerminalToolbarProps {
  onClear:    () => void
  onKill:     () => void
  onMaximize: () => void
  isMaximized?: boolean
}

export function TerminalToolbar({ onClear, onKill, onMaximize, isMaximized }: TerminalToolbarProps) {
  return (
    <div className="flex items-center gap-0.5 px-1 shrink-0">
      <TBtn tooltip="Clear Terminal" onClick={onClear}    icon={faTrash} />
      <TBtn tooltip="Kill Terminal"  onClick={onKill}     icon={faStop}  />
      <TBtn
        tooltip={isMaximized ? 'Restore Panel' : 'Maximize Panel'}
        onClick={onMaximize}
        icon={isMaximized ? faDownLeftAndUpRightToCenter : faUpRightAndDownLeftFromCenter}
      />
    </div>
  )
}

function TBtn({ tooltip, onClick, icon }: { tooltip: string; onClick: () => void; icon: any }) {
  return (
    <Tooltip content={tooltip} placement="top">
      <button
        onClick={onClick}
        aria-label={tooltip}
        className="w-6 h-6 flex items-center justify-center rounded
          text-[#4a4a6a] hover:text-[#9090b0] hover:bg-white/5
          transition-all duration-150"
      >
        <FontAwesomeIcon icon={icon} style={{ fontSize: 11 }} />
      </button>
    </Tooltip>
  )
}
