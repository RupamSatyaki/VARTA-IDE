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
      className="w-44 text-xs"
    />
  )
}
