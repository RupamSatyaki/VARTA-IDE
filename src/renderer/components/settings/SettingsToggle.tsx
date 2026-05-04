import React from 'react'
import { Toggle } from '../ui/Toggle'

export interface SettingsToggleProps {
  value:    boolean
  onChange: (v: boolean) => void
  disabled?: boolean
}

export function SettingsToggle({ value, onChange, disabled }: SettingsToggleProps) {
  return <Toggle checked={value} onChange={onChange} disabled={disabled} />
}
