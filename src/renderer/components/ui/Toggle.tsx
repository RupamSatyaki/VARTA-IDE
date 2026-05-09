import React from 'react'
import { cn } from '../../utils/cn'

export interface ToggleProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label?: string
  disabled?: boolean
  className?: string
}

export function Toggle({ checked, onChange, label, disabled = false, className }: ToggleProps) {
  return (
    <label className={cn('inline-flex items-center gap-3 cursor-pointer select-none', disabled && 'opacity-40 cursor-not-allowed', className)}>
      <button
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative w-10 h-5 rounded-full transition-all duration-300 outline-none',
          checked ? 'bg-gradient-to-r from-[#7c3aed] to-[#a855f7]' : 'bg-[#1a1620] border border-[#2a1f30]',
        )}
      >
        <span
          className={cn(
            'absolute top-[3px] left-[3px] w-3.5 h-3.5 rounded-full bg-white shadow-[0_2px_4px_rgba(0,0,0,0.2)] transition-all duration-300',
            checked ? 'translate-x-5' : 'translate-x-0',
          )}
        />
      </button>
      {label && <span className="text-[12px] font-medium text-[#e0e0e0]">{label}</span>}
    </label>
  )
}
