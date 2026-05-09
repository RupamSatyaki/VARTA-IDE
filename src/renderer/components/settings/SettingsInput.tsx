import React, { useState, useEffect, useRef } from 'react'
import { cn } from '../../utils/cn'

export interface SettingsInputProps {
  value:       string | number
  onChange:    (v: string) => void
  type?:       'text' | 'password' | 'number'
  placeholder?: string
  min?:        number
  max?:        number
  className?:  string
}

export function SettingsInput({
  value, onChange, type = 'text', placeholder, min, max, className,
}: SettingsInputProps) {
  const [local, setLocal] = useState(String(value))
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Sync when external value changes
  useEffect(() => { setLocal(String(value)) }, [value])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value
    setLocal(v)
    if (debounceRef.current) { clearTimeout(debounceRef.current) }
    debounceRef.current = setTimeout(() => {
      if (type === 'number') {
        const n = Number(v)
        if (!isNaN(n)) {
          const clamped = min !== undefined ? Math.max(min, n) : n
          const final   = max !== undefined ? Math.min(max, clamped) : clamped
          onChange(String(final))
        }
      } else {
        onChange(v)
      }
    }, 500)
  }

  return (
    <input
      type={type}
      value={local}
      onChange={handleChange}
      placeholder={placeholder}
      min={min}
      max={max}
      className={cn(
        'w-56 h-9 px-4 text-[13px] bg-[#12101a] text-[#e0e0e0]',
        'border border-[#2a1f30] focus:border-[#7c3aed]/50 rounded-xl outline-none',
        'placeholder:text-[#4a3a5a] transition-all duration-300 shadow-inner',
        className,
      )}
    />
  )
}
