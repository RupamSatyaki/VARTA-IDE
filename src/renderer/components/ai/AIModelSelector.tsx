import React, { useEffect, useState, useCallback } from 'react'
import { Select } from '../ui/Select'
import { useSettingsStore } from '../../store/settingsStore'

// All available models — Anthropic + NVIDIA NIM
const ALL_MODELS = [
  { id: 'claude-opus-4-5',                    name: 'Claude Opus 4.5' },
  { id: 'claude-sonnet-4-5',                  name: 'Claude Sonnet 4.5' },
  { id: 'claude-haiku-3-5',                   name: 'Claude Haiku 3.5' },
  { id: 'moonshotai/kimi-k2.6',               name: 'Kimi K2.6 (NVIDIA NIM)' },
  { id: 'meta/llama-3.1-405b-instruct',       name: 'Llama 3.1 405B (NVIDIA NIM)' },
  { id: 'mistralai/mistral-large-2-instruct', name: 'Mistral Large 2 (NVIDIA NIM)' },
]

export function AIModelSelector() {
  const { settings, update } = useSettingsStore()
  const options = ALL_MODELS.map((m) => ({ value: m.id, label: m.name }))

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
