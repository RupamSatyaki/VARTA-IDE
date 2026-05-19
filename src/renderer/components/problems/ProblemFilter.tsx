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
    <div className="flex items-center gap-2 px-3 py-1.5 border-b border-varta-border bg-varta-bg-secondary shrink-0">
      {/* Filter toggles */}
      <div className="flex items-center gap-1">
        <FilterBtn
          active={showErrors}
          onClick={onToggleErrors}
          color="var(--varta-error)"
          label="Errors"
          icon={<svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor"><path d="M8 1a7 7 0 100 14A7 7 0 008 1zm0 1a6 6 0 110 12A6 6 0 018 2zm-.5 3v5h1V6h-1zm0 6v1h1v-1h-1z"/></svg>}
        />
        <FilterBtn
          active={showWarnings}
          onClick={onToggleWarnings}
          color="var(--varta-warning)"
          label="Warnings"
          icon={<svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor"><path d="M7.56 1h.88l6.54 12.26-.44.74H1.44L1 13.26 7.56 1zM8 2.28L2.28 13H13.72L8 2.28zM8.625 12v-1h-1.25v1h1.25zm-1.25-2V6h1.25v4h-1.25z"/></svg>}
        />
        <FilterBtn
          active={showInfo}
          onClick={onToggleInfo}
          color="var(--varta-info)"
          label="Info"
          icon={<svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor"><path d="M8 1a7 7 0 100 14A7 7 0 008 1zm0 1a6 6 0 110 12A6 6 0 018 2zm-.5 3v1h1V6h-1zm0 2v5h1V8h-1z"/></svg>}
        />
      </div>

      <div className="w-px h-4 bg-varta-border mx-1" />

      {/* Search */}
      <div className="relative flex-1 max-w-xs">
        <input
          value={searchText}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Filter (e.g. text, **/*.ts)"
          className="w-full h-6 pl-7 pr-2 text-xs bg-varta-bg-tertiary text-varta-text border border-varta-border focus:border-varta-accent rounded-sm outline-none placeholder:text-varta-text-faint transition-colors"
        />
        <svg
          width="12"
          height="12"
          viewBox="0 0 16 16"
          fill="currentColor"
          className="absolute left-2 top-1/2 -translate-y-1/2 text-varta-text-faint"
        >
          <path d="M11.83 11.12l3.42 3.43-.71.71-3.43-3.42a6 6 0 11.72-.72zM6.5 11a4.5 4.5 0 100-9 4.5 4.5 0 000 9z" />
        </svg>
      </div>

      <div className="flex-1" />

      {/* This file only */}
      <button
        onClick={onToggleThisFile}
        title="Show only current file"
        className={cn(
          'text-[11px] px-2 h-6 rounded-sm border transition-colors flex items-center gap-1.5',
          thisFileOnly
            ? 'border-varta-accent text-varta-accent bg-varta-accent/10'
            : 'border-transparent text-varta-text-muted hover:text-varta-text hover:bg-white/5',
        )}
      >
        <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
          <path d="M13.5 1h-11l-.5.5v13l.5.5h11l.5-.5v-13l-.5-.5zM13 14H3V2h10v12zM4 4h8v1H4V4zm0 3h8v1H4V7zm0 3h5v1H4v-1z"/>
        </svg>
        <span>Active File Only</span>
      </button>
    </div>
  )
}

function FilterBtn({ active, onClick, color, label, icon }: {
  active: boolean; onClick: () => void; color: string; label: string; icon: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      title={label}
      className={cn(
        'flex items-center gap-1.5 px-2 h-6 rounded-sm transition-colors text-[11px]',
        active
          ? 'text-[#d4d4d4] bg-white/10'
          : 'text-[#969696] hover:text-[#d4d4d4] hover:bg-white/5 opacity-60 hover:opacity-100',
      )}
    >
      <span style={{ color: active ? color : undefined }}>{icon}</span>
      <span>{label}</span>
    </button>
  )
}
