import React from 'react'
import { Select, type SelectOption } from '../ui/Select'

export interface SettingsSelectProps {
  value:    string
  options:  SelectOption[]
  onChange: (v: string) => void
}

export function SettingsSelect({ value, options, onChange }: SettingsSelectProps) {
  return (
    <Select
      value={value}
      options={options}
      onChange={(e) => onChange(e.target.value)}
      className="w-56 h-9 px-3 text-[12px] bg-[#12101a] border-[#2a1f30] rounded-xl hover:border-[#7c3aed]/30 transition-all shadow-inner"
    />
  )
}
