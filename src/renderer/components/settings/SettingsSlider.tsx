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
    <div className="flex items-center gap-2 w-44">
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="flex-1 h-1 rounded-full appearance-none cursor-pointer bg-[#3c3c3c] accent-[#569cd6]"
      />
      <span className="text-xs text-[#6e6e6e] w-10 text-right shrink-0">
        {value}{unit ?? ''}
      </span>
    </div>
  )
}
