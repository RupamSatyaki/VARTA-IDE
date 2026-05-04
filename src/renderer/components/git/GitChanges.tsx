import React, { useState } from 'react'
import { cn } from '../../utils/cn'
import { GitChangeItem } from './GitChangeItem'
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

export function GitChanges({
  changes, untracked,
  onStage, onStageAll, onDiscard, onDiscardAll,
  onOpenFile, onOpenDiff,
}: GitChangesProps) {
  const [expanded, setExpanded] = useState(true)
  const all = [...changes, ...untracked]

  if (all.length === 0) { return null }

  return (
    <div>
      {/* Section header */}
      <div
        className="flex items-center justify-between h-[26px] px-2 cursor-pointer hover:bg-[#2a2d2e] select-none group"
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="flex items-center gap-1">
          <svg
            width="8" height="8" viewBox="0 0 8 8" fill="currentColor"
            className={cn('text-[#6e6e6e] transition-transform', expanded ? 'rotate-90' : '')}
          >
            <path d="M2 1l4 3-4 3V1z"/>
          </svg>
          <span className="text-xs text-[#d4d4d4] font-medium">Changes</span>
          <span className="text-[10px] text-[#6e6e6e] ml-1">({all.length})</span>
        </div>

        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100">
          {/* Stage all */}
          <button
            onClick={(e) => { e.stopPropagation(); onStageAll() }}
            title="Stage All"
            className="w-5 h-5 flex items-center justify-center rounded text-[#6e6e6e] hover:text-[#d4d4d4] hover:bg-[#ffffff15]"
          >
            <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor"><path d="M9 4H6V1H4v3H1v2h3v3h2V6h3z"/></svg>
          </button>
          {/* Discard all */}
          <button
            onClick={(e) => { e.stopPropagation(); onDiscardAll() }}
            title="Discard All Changes"
            className="w-5 h-5 flex items-center justify-center rounded text-[#6e6e6e] hover:text-[#f44747] hover:bg-[#ffffff15]"
          >
            <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor"><path d="M5 4.293L8.146 1.146l.708.708L5.707 5l3.147 3.146-.708.708L5 5.707 1.854 8.854l-.708-.708L4.293 5 1.146 1.854l.708-.708L5 4.293z"/></svg>
          </button>
        </div>
      </div>

      {/* File list */}
      {expanded && all.map((c) => (
        <GitChangeItem
          key={c.path}
          change={c}
          staged={false}
          onStage={() => onStage(c.path)}
          onDiscard={c.status !== 'untracked' ? () => onDiscard(c.path) : undefined}
          onOpenFile={() => onOpenFile(c.path)}
          onOpenDiff={() => onOpenDiff(c.path)}
        />
      ))}
    </div>
  )
}
