import React from 'react'
import { cn } from '../../utils/cn'

export interface ExtensionSearchProps {
  value:    string
  onChange: (v: string) => void
}

export function ExtensionSearch({ value, onChange }: ExtensionSearchProps) {
  return (
    <div className="px-2 py-2 border-b border-varta-border">
      <div className="relative">
        <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor"
          className="absolute left-2 top-1/2 -translate-y-1/2 text-varta-text-faint pointer-events-none">
          <path d="M6.5 1C3.467 1 1 3.467 1 6.5S3.467 12 6.5 12c1.322 0 2.538-.466 3.489-1.237l3.373 3.374.708-.707-3.374-3.373A5.47 5.47 0 0012 6.5C12 3.467 9.533 1 6.5 1zm0 1C9.033 2 11 3.967 11 6.5S9.033 11 6.5 11 2 9.033 2 6.5 3.967 2 6.5 2z"/>
        </svg>
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Search extensions…"
          className="w-full h-7 pl-7 pr-2 text-xs bg-varta-bg-tertiary text-varta-text border border-varta-border focus:border-varta-accent rounded outline-none placeholder:text-varta-text-faint"
        />
      </div>
    </div>
  )
}
