import React, { useRef, useEffect } from 'react'
import { cn } from '../../utils/cn'

export interface CommandInputProps {
  value:       string
  onChange:    (v: string) => void
  onKeyDown:   (e: React.KeyboardEvent) => void
  mode:        'files' | 'commands'
  placeholder?: string
}

export function CommandInput({ value, onChange, onKeyDown, mode }: CommandInputProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
    inputRef.current?.select()
  }, [])

  const placeholder = mode === 'files'
    ? 'Search files by name…'
    : 'Type a command…'

  return (
    <div className="flex items-center gap-2 px-4 py-3 border-b border-[#333333]">
      {/* Mode indicator */}
      <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" className="text-[#6e6e6e] shrink-0">
        {mode === 'files'
          ? <path d="M6.5 1C3.467 1 1 3.467 1 6.5S3.467 12 6.5 12c1.322 0 2.538-.466 3.489-1.237l3.373 3.374.708-.707-3.374-3.373A5.47 5.47 0 0012 6.5C12 3.467 9.533 1 6.5 1zm0 1C9.033 2 11 3.967 11 6.5S9.033 11 6.5 11 2 9.033 2 6.5 3.967 2 6.5 2z"/>
          : <path d="M6 9L1 4l1-1 4 4-4 4-1-1 4-4zm4 4H6v-1h4v1z"/>
        }
      </svg>

      {/* ">" prefix for command mode */}
      {mode === 'commands' && (
        <span className="text-[#569cd6] text-sm font-mono shrink-0">{'>'}</span>
      )}

      <input
        ref={inputRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        spellCheck={false}
        className="flex-1 bg-transparent text-sm text-[#d4d4d4] placeholder:text-[#6e6e6e] outline-none"
      />

      <kbd className="text-[10px] text-[#6e6e6e] border border-[#555555] rounded px-1 py-0.5 shrink-0">
        ESC
      </kbd>
    </div>
  )
}
