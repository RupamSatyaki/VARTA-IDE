import React from 'react'
import { cn } from '../../utils/cn'

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string
  className?: string
}

export function Checkbox({ label, className, id, ...props }: CheckboxProps) {
  const inputId = id ?? `checkbox-${Math.random().toString(36).slice(2)}`
  return (
    <label htmlFor={inputId} className={cn('inline-flex items-center gap-2 cursor-pointer select-none', className)}>
      <input
        type="checkbox"
        id={inputId}
        className={cn(
          'w-4 h-4 rounded border border-[#555555] bg-[#3c3c3c]',
          'accent-[#569cd6] cursor-pointer',
          'focus-visible:ring-2 focus-visible:ring-[#569cd6]',
        )}
        {...props}
      />
      {label && <span className="text-sm text-[#d4d4d4]">{label}</span>}
    </label>
  )
}
