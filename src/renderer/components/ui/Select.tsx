import React from 'react'
import { cn } from '../../utils/cn'

export interface SelectOption {
  value: string
  label: string
  disabled?: boolean
}

export interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'children'> {
  options: SelectOption[]
  placeholder?: string
  error?: boolean
  className?: string
}

export function Select({ options, placeholder, error = false, className, ...props }: SelectProps) {
  return (
    <div className="relative">
      <select
        className={cn(
          'w-full h-7 pl-2 pr-7 rounded border bg-[#3c3c3c] text-sm text-[#d4d4d4]',
          'appearance-none outline-none cursor-pointer transition-colors',
          error
            ? 'border-[#f44747] focus:border-[#f44747]'
            : 'border-[#3c3c3c] focus:border-[#569cd6]',
          className,
        )}
        {...props}
      >
        {placeholder && <option value="" disabled>{placeholder}</option>}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} disabled={opt.disabled}>
            {opt.label}
          </option>
        ))}
      </select>
      <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[#6e6e6e]">
        <svg width="10" height="6" viewBox="0 0 10 6" fill="currentColor">
          <path d="M0 0l5 6 5-6z"/>
        </svg>
      </span>
    </div>
  )
}
