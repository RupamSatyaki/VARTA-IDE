import React, { useState } from 'react'
import { cn } from '../../utils/cn'
import { GitChangeItem } from './GitChangeItem'
import type { GitFileChange } from '../../../shared/types/git.types'

export interface GitStagedChangesProps {
  changes:    GitFileChange[]
  onUnstage:  (path: string) => void
  onUnstageAll: () => void
  onOpenFile: (path: string) => void
  onOpenDiff: (path: string) => void
}

export function GitStagedChanges({
  changes, onUnstage, onUnstageAll, onOpenFile, onOpenDiff,
}: GitStagedChangesProps) {
  const [expanded, setExpanded] = useState(true)

  if (changes.length === 0) { return null }

  return (
    <div>
      {/* Section header */}
      <div
        className="flex items-center justify-between h-[26px] px-2 cursor-pointer hover:bg-[#2a2d2e] select-none"
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="flex items-center gap-1">
          <svg
            width="8" height="8" viewBox="0 0 8 8" fill="currentColor"
            className={cn('text-[#6e6e6e] transition-transform', expanded ? 'rotate-90' : '')}
          >
            <path d="M2 1l4 3-4 3V1z"/>
          </svg>
          <span className="text-xs text-[#d4d4d4] font-medium">
            Staged Changes
          </span>
          <span className="text-[10px] text-[#6e6e6e] ml-1">({changes.length})</span>
        </div>

        {/* Unstage all */}
        <button
          onClick={(e) => { e.stopPropagation(); onUnstageAll() }}
          title="Unstage All"
          className="opacity-0 group-hover:opacity-100 hover:opacity-100 w-5 h-5 flex items-center justify-center rounded text-[#6e6e6e] hover:text-[#d4d4d4] hover:bg-[#ffffff15]"
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor"><path d="M1 4h8v2H1z"/></svg>
        </button>
      </div>

      {/* File list */}
      {expanded && changes.map((c) => (
        <GitChangeItem
          key={c.path}
          change={c}
          staged={true}
          onUnstage={() => onUnstage(c.path)}
          onOpenFile={() => onOpenFile(c.path)}
          onOpenDiff={() => onOpenDiff(c.path)}
        />
      ))}
    </div>
  )
}
