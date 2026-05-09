import React, { useRef, useEffect } from 'react'
import { cn } from '../../utils/cn'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faMagnifyingGlass, faXmark } from '@fortawesome/free-solid-svg-icons'

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
    <div className="relative group">
      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#4a3a5a] pointer-events-none group-focus-within:text-[#7c3aed] transition-colors duration-300">
        <FontAwesomeIcon icon={faMagnifyingGlass} style={{ fontSize: 13 }} />
      </div>
      <input
        ref={inputRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search for settings, shortcuts, or themes..."
        className={cn(
          'w-full h-11 pl-11 pr-10 text-[13px] bg-[#12101a] text-[#e0e0e0]',
          'border border-[#2a1f30] focus:border-[#7c3aed]/50 rounded-2xl outline-none shadow-inner transition-all duration-300',
          'placeholder:text-[#4a3a5a] placeholder:font-medium',
        )}
      />
      {value && (
        <button
          onClick={() => onChange('')}
          className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded-lg hover:bg-[#f87171]/10 text-[#4a3a5a] hover:text-[#f87171] transition-all duration-200"
        >
          <FontAwesomeIcon icon={faXmark} style={{ fontSize: 11 }} />
        </button>
      )}
    </div>
  )
}
