import React, { useEffect, useState } from 'react'
import { Select } from '../ui/Select'
import { useSettingsStore } from '../../store/settingsStore'
import { isIPCSuccess } from '../../../shared/ipc'
import type { AIModel } from '../../../shared/types/ai.types'

export function AIModelSelector() {
  const { settings, update } = useSettingsStore()
  const [models, setModels] = useState<AIModel[]>([])

  useEffect(() => {
    async function fetchModels() {
      const res = await window.varta.ai.getModels()
      if (isIPCSuccess(res)) {
        setModels(res.data)
      }
    }
    fetchModels()
  }, [])

  const options = models.map((m) => ({ value: m.id, label: m.name }))

  return (
    <Select
      value={settings.ai.model}
      options={options}
      onChange={(e) => {
        const v = e.target.value
        update({ ai: { ...settings.ai, model: v } })
        window.varta.settings.set({ ai: { model: v } }).catch(() => {})
      }}
      className="text-xs min-w-[160px]"
    />
  )
}
