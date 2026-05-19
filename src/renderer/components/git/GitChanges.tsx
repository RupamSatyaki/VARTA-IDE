import React, { useState } from 'react'
import { GitChangeItem } from './GitChangeItem'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faChevronDown, faChevronRight, faPlus, faTrash } from '@fortawesome/free-solid-svg-icons'
import { Tooltip } from '../ui/Tooltip'
import type { GitFileChange } from '../../../shared/types/git.types'

export interface GitChangesProps {
  changes:      GitFileChange[]
  untracked:    GitFileChange[]
  onStage:      (path: string) => void
  onStageAll:   () => void
  onDiscard:    (path: string) => void
  onDiscardAll: () => void
  onOpenFile:   (path: string) => void
  onOpenDiff:   (path: string) => void
}

export function GitChanges({ changes, untracked, onStage, onStageAll, onDiscard, onDiscardAll, onOpenFile, onOpenDiff }: GitChangesProps) {
  const [expanded, setExpanded] = useState(true)
  const all = [...changes, ...untracked]
  if (all.length === 0) { return null }

  return (
    <div>
      <div
        className="flex items-center justify-between h-7 px-3 cursor-pointer hover:bg-white/5 select-none group"
        onClick={() => setExpanded(v => !v)}
      >
        <div className="flex items-center gap-1.5">
          <FontAwesomeIcon
            icon={expanded ? faChevronDown : faChevronRight}
            style={{ fontSize: 8 }} className="text-varta-text-faint"
          />
          <span className="text-[11px] font-semibold text-varta-text">Changes</span>
          <span className="text-[10px] text-varta-text-faint">({all.length})</span>
        </div>

        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100">
          <Tooltip content="Stage All" placement="left">
            <button
              onClick={(e) => { e.stopPropagation(); onStageAll() }}
              className="w-5 h-5 flex items-center justify-center rounded
                text-varta-text-faint hover:text-varta-success hover:bg-white/5 transition-all"
            >
              <FontAwesomeIcon icon={faPlus} style={{ fontSize: 10 }} />
            </button>
          </Tooltip>
          <Tooltip content="Discard All" placement="left">
            <button
              onClick={(e) => { e.stopPropagation(); onDiscardAll() }}
              className="w-5 h-5 flex items-center justify-center rounded
                text-varta-text-faint hover:text-varta-error hover:bg-white/5 transition-all"
            >
              <FontAwesomeIcon icon={faTrash} style={{ fontSize: 10 }} />
            </button>
          </Tooltip>
        </div>
      </div>

      {expanded && all.map((c, i) => (
        <GitChangeItem key={`unstaged-${c.path}-${i}`} change={c} staged={false}
          onStage={() => onStage(c.path)}
          onDiscard={c.status !== 'untracked' ? () => onDiscard(c.path) : undefined}
          onOpenFile={() => onOpenFile(c.path)}
          onOpenDiff={() => onOpenDiff(c.path)}
        />
      ))}
    </div>
  )
}
