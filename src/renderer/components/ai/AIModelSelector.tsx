import React from 'react'
import { Select } from '../ui/Select'
import { CLAUDE_MODELS } from '../../../shared/types/ai.types'
import { useSettingsStore } from '../../store/settingsStore'

export function AIModelSelector() {
  const { settings, update } = useSettingsStore()
  const options = CLAUDE_MODELS.map((m) => ({ value: m.id, label: m.name }))

  return (
    <Select
      value={settings.ai.model}
      options={options}
      onChange={(e) => {
        const v = e.target.value
        update({ ai: { ...settings.ai, model: v } })
        window.varta.settings.set({ ai: { model: v } }).catch(() => {})
      }}
      className="text-xs"
    />
  )
}
