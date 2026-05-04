import React, { useRef, useEffect } from 'react'
import { cn } from '../../utils/cn'

export interface SettingsSearchProps {
  value:    string
  onChange: (v: string) => void
}

export function SettingsSearch({ value, onChange }: SettingsSearchProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  return (
    <div className="relative">
      <svg
        width="14" height="14" viewBox="0 0 16 16" fill="currentColor"
        className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6e6e6e] pointer-events-none"
      >
        <path d="M6.5 1C3.467 1 1 3.467 1 6.5S3.467 12 6.5 12c1.322 0 2.538-.466 3.489-1.237l3.373 3.374.708-.707-3.374-3.373A5.47 5.47 0 0012 6.5C12 3.467 9.533 1 6.5 1zm0 1C9.033 2 11 3.967 11 6.5S9.033 11 6.5 11 2 9.033 2 6.5 3.967 2 6.5 2z"/>
      </svg>
      <input
        ref={inputRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search settings…"
        className={cn(
          'w-full h-9 pl-9 pr-3 text-sm bg-[#3c3c3c] text-[#d4d4d4]',
          'border border-[#3c3c3c] focus:border-[#569cd6] rounded outline-none',
          'placeholder:text-[#6e6e6e]',
        )}
      />
      {value && (
        <button
          onClick={() => onChange('')}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-[#6e6e6e] hover:text-[#d4d4d4]"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
            <path d="M6 5.293L9.646 1.646l.708.708L6.707 6l3.647 3.646-.708.708L6 6.707 2.354 10.354l-.708-.708L5.293 6 1.646 2.354l.708-.708L6 5.293z"/>
          </svg>
        </button>
      )}
    </div>
  )
}
