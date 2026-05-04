import React from 'react'
import { IconButton } from '../ui/IconButton'
import { useSearchStore } from '../../store/searchStore'

export interface SearchToolbarProps {
  onRefresh:     () => void
  onClear:       () => void
  onExpandAll:   () => void
  onCollapseAll: () => void
}

export function SearchToolbar({ onRefresh, onClear, onExpandAll, onCollapseAll }: SearchToolbarProps) {
  const { results } = useSearchStore()

  if (!results) { return null }

  return (
    <div className="flex items-center justify-between px-3 py-1 border-b border-[#333333] shrink-0">
      <span className="text-[10px] text-[#6e6e6e]">
        {results.totalMatches} result{results.totalMatches !== 1 ? 's' : ''} in {results.totalFiles} file{results.totalFiles !== 1 ? 's' : ''}
      </span>

      <div className="flex items-center gap-0.5">
        <IconButton tooltip="Refresh" size="sm" onClick={onRefresh} aria-label="Refresh search">
          <RefreshIcon />
        </IconButton>
        <IconButton tooltip="Expand All" size="sm" onClick={onExpandAll} aria-label="Expand all">
          <ExpandIcon />
        </IconButton>
        <IconButton tooltip="Collapse All" size="sm" onClick={onCollapseAll} aria-label="Collapse all">
          <CollapseIcon />
        </IconButton>
        <IconButton tooltip="Clear Results" size="sm" onClick={onClear} aria-label="Clear results">
          <ClearIcon />
        </IconButton>
      </div>
    </div>
  )
}

const RefreshIcon  = () => <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor"><path d="M13.451 5.609l-.579-.939-1.068.812-.076.094c-.335.415-.927 1.341-1.124 2.876l-.021.165.033.163.071.345c.045.218.068.438.068.66 0 2.606-2.116 4.722-4.722 4.722S1.31 12.192 1.31 9.586 3.426 4.864 6.032 4.864c.314 0 .62.031.917.09l.217.046.224-.04.345-.062c.218-.039.44-.059.664-.059"/></svg>
const ExpandIcon   = () => <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor"><path d="M1 3h14v1H1V3zm0 4h14v1H1V7zm0 4h14v1H1v-1z"/></svg>
const CollapseIcon = () => <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor"><path d="M9 9H4v1h5V9zm0-4H4v1h5V5zM4 7h5V6H4v1zm9 4l-4-4 4-4v8z"/></svg>
const ClearIcon    = () => <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor"><path d="M8 7.293L12.646 2.646l.708.708L8.707 8l4.647 4.646-.708.708L8 8.707l-4.646 4.647-.708-.708L7.293 8 2.646 3.354l.708-.708L8 7.293z"/></svg>
