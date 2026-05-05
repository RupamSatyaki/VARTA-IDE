import React from 'react'
import { cn } from '../../utils/cn'

export interface ProblemFilterProps {
  showErrors:   boolean
  showWarnings: boolean
  showInfo:     boolean
  searchText:   string
  thisFileOnly: boolean
  onToggleErrors:   () => void
  onToggleWarnings: () => void
  onToggleInfo:     () => void
  onSearchChange:   (v: string) => void
  onToggleThisFile: () => void
}

export function ProblemFilter({
  showErrors, showWarnings, showInfo, searchText, thisFileOnly,
  onToggleErrors, onToggleWarnings, onToggleInfo, onSearchChange, onToggleThisFile,
}: ProblemFilterProps) {
  return (
    <div className="flex items-center gap-1.5 px-2 py-1.5 border-b border-[#333333] shrink-0">
      {/* Filter toggles */}
      <FilterBtn active={showErrors}   onClick={onToggleErrors}   color="#f44747" label="Errors" />
      <FilterBtn active={showWarnings} onClick={onToggleWarnings} color="#ff8c00" label="Warnings" />
      <FilterBtn active={showInfo}     onClick={onToggleInfo}     color="#569cd6" label="Info" />

      <div className="w-px h-4 bg-[#333333] mx-0.5" />

      {/* Search */}
      <input
        value={searchText}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder="Filter problems…"
        className="flex-1 h-6 px-2 text-xs bg-[#3c3c3c] text-[#d4d4d4] border border-[#3c3c3c] focus:border-[#569cd6] rounded outline-none placeholder:text-[#6e6e6e]"
      />

      {/* This file only */}
      <button
        onClick={onToggleThisFile}
        title="Show only current file"
        className={cn(
          'text-[10px] px-1.5 h-6 rounded border transition-colors',
          thisFileOnly
            ? 'border-[#569cd6] text-[#569cd6] bg-[#1b2d3e]'
            : 'border-[#333333] text-[#6e6e6e] hover:text-[#d4d4d4]',
        )}
      >
        This file
      </button>
    </div>
  )
}

function FilterBtn({ active, onClick, color, label }: {
  active: boolean; onClick: () => void; color: string; label: string
}) {
  return (
    <button
      onClick={onClick}
      title={label}
      className={cn(
        'text-[10px] px-1.5 h-6 rounded border transition-colors',
        active ? 'border-current' : 'border-[#333333] opacity-40',
      )}
      style={{ color }}
    >
      {label}
    </button>
  )
}
