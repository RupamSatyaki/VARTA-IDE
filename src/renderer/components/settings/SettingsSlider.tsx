import React from 'react'
import { cn } from '../../utils/cn'

export interface SettingsSliderProps {
  value:    number
  min:      number
  max:      number
  step?:    number
  onChange: (v: number) => void
  unit?:    string
}

export function SettingsSlider({ value, min, max, step = 1, onChange, unit }: SettingsSliderProps) {
  return (
    <div className="flex items-center gap-4 w-56">
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className={cn(
          "flex-1 h-1.5 rounded-full appearance-none cursor-pointer bg-[#12101a] border border-[#2a1f30] shadow-inner",
          "accent-[#7c3aed]"
        )}
      />
      <span className="text-[11px] font-mono font-bold text-[#c084fc] min-w-[32px] text-right">
        {value}{unit ?? ''}
      </span>
    </div>
  )
}
