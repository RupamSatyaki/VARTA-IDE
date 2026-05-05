import React from 'react'
import { cn } from '../../utils/cn'
import { IconButton } from '../ui/IconButton'

export interface OutlineToolbarProps {
  followCursor: boolean
  onToggleFollow: () => void
  onCollapseAll:  () => void
  searchText:     string
  onSearchChange: (v: string) => void
}

export function OutlineToolbar({
  followCursor, onToggleFollow, onCollapseAll, searchText, onSearchChange,
}: OutlineToolbarProps) {
  return (
    <div className="flex items-center gap-1 px-2 py-1.5 border-b border-[#333333] shrink-0">
      <input
        value={searchText}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder="Filter symbols…"
        className="flex-1 h-6 px-2 text-xs bg-[#3c3c3c] text-[#d4d4d4] border border-[#3c3c3c] focus:border-[#569cd6] rounded outline-none placeholder:text-[#6e6e6e]"
      />
      <IconButton
        tooltip="Follow Cursor"
        size="sm"
        active={followCursor}
        onClick={onToggleFollow}
        aria-label="Follow cursor"
      >
        <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
          <path d="M8 1a7 7 0 100 14A7 7 0 008 1zm0 1a6 6 0 110 12A6 6 0 018 2zm0 3a1 1 0 100 2 1 1 0 000-2zm-.5 3v5h1V8h-1z"/>
        </svg>
      </IconButton>
      <IconButton
        tooltip="Collapse All"
        size="sm"
        onClick={onCollapseAll}
        aria-label="Collapse all"
      >
        <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
          <path d="M9 9H4v1h5V9zm0-4H4v1h5V5zM4 7h5V6H4v1zm9 4l-4-4 4-4v8z"/>
        </svg>
      </IconButton>
    </div>
  )
}
