import React from 'react'
import { cn } from '../../utils/cn'
import { Tooltip } from '../ui/Tooltip'

const COMING_SOON = 'Debug support coming in v2'

export function DebugToolbar() {
  const btnClass = 'w-7 h-7 flex items-center justify-center rounded text-[#6e6e6e] opacity-40 cursor-not-allowed'

  return (
    <div className="flex items-center gap-0.5 px-2 py-1 border-b border-[#333333] shrink-0">
      {[
        { icon: '▶', label: 'Continue' },
        { icon: '⏸', label: 'Pause' },
        { icon: '⤼', label: 'Step Over' },
        { icon: '⤵', label: 'Step Into' },
        { icon: '⤴', label: 'Step Out' },
        { icon: '↺', label: 'Restart' },
        { icon: '⏹', label: 'Stop' },
      ].map(({ icon, label }) => (
        <Tooltip key={label} content={`${label} — ${COMING_SOON}`} placement="bottom">
          <button className={btnClass} disabled aria-label={label}>
            <span className="text-sm">{icon}</span>
          </button>
        </Tooltip>
      ))}
    </div>
  )
}
