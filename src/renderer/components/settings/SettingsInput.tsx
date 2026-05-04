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
        'w-44 h-7 px-2 text-xs bg-[#3c3c3c] text-[#d4d4d4]',
        'border border-[#3c3c3c] focus:border-[#569cd6] rounded outline-none',
        'placeholder:text-[#6e6e6e]',
        className,
      )}
    />
  )
}
