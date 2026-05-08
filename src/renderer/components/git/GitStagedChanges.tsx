import React, { useState } from 'react'
import { cn } from '../../utils/cn'
import { GitChangeItem } from './GitChangeItem'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faChevronDown, faChevronRight, faMinus } from '@fortawesome/free-solid-svg-icons'
import { Tooltip } from '../ui/Tooltip'
import type { GitFileChange } from '../../../shared/types/git.types'

export interface GitStagedChangesProps {
  changes:      GitFileChange[]
  onUnstage:    (path: string) => void
  onUnstageAll: () => void
  onOpenFile:   (path: string) => void
  onOpenDiff:   (path: string) => void
}

export function GitStagedChanges({ changes, onUnstage, onUnstageAll, onOpenFile, onOpenDiff }: GitStagedChangesProps) {
  const [expanded, setExpanded] = useState(true)
  if (changes.length === 0) { return null }

  return (
    <div>
      <div
        className="flex items-center justify-between h-7 px-3 cursor-pointer hover:bg-white/5 select-none group"
        onClick={() => setExpanded(v => !v)}
      >
        <div className="flex items-center gap-1.5">
          <FontAwesomeIcon
            icon={expanded ? faChevronDown : faChevronRight}
            style={{ fontSize: 8 }} className="text-[#5a4a6a]"
          />
          <span className="text-[11px] font-semibold text-[#cccccc]">Staged</span>
          <span className="text-[10px] text-[#5a4a6a]">({changes.length})</span>
        </div>
        <Tooltip content="Unstage All" placement="left">
          <button
            onClick={(e) => { e.stopPropagation(); onUnstageAll() }}
            className="opacity-0 group-hover:opacity-100 w-5 h-5 flex items-center justify-center
              rounded text-[#5a4a6a] hover:text-[#f87171] hover:bg-white/5 transition-all"
          >
            <FontAwesomeIcon icon={faMinus} style={{ fontSize: 10 }} />
          </button>
        </Tooltip>
      </div>

      {expanded && changes.map((c, i) => (
        <GitChangeItem key={`staged-${c.path}-${i}`} change={c} staged={true}
          onUnstage={() => onUnstage(c.path)}
          onOpenFile={() => onOpenFile(c.path)}
          onOpenDiff={() => onOpenDiff(c.path)}
        />
      ))}
    </div>
  )
}
