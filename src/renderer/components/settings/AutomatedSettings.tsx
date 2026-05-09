import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { SETTINGS_SCHEMA, SettingSchemaItem } from '../../../shared/constants/settingsSchema'
import { SettingsItem }     from './SettingsItem'
import { SettingsToggle }   from './SettingsToggle'
import { SettingsSelect }   from './SettingsSelect'
import { SettingsInput }    from './SettingsInput'
import { SettingsSlider }   from './SettingsSlider'
import { useSettingsStore } from '../../store/settingsStore'
import { useSettings }      from '../../hooks/useSettings'

interface AutomatedSettingsProps {
  activeSection: string
  search: string
}

export function AutomatedSettings({ activeSection, search }: AutomatedSettingsProps) {
  const { settings } = useSettingsStore()
  const { updateSetting } = useSettings()

  const getValue = (id: string) => {
    const [section, key] = id.split('.')
    return (settings as any)[section]?.[key]
  }

  const handleUpdate = (id: string, value: any) => {
    const [section, key] = id.split('.')
    const currentSection = (settings as any)[section]
    updateSetting(section, { ...currentSection, [key]: value })
  }

  const filteredSchema = SETTINGS_SCHEMA.filter((item) => {
    // Section filter
    if (activeSection !== 'all' && item.section !== activeSection) return false
    
    // Search filter
    if (search) {
      const query = search.toLowerCase()
      return (
        item.label.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query)
      )
    }

    return true
  })

  const renderControl = (item: SettingSchemaItem) => {
    const value = getValue(item.id)

    switch (item.type) {
      case 'toggle':
        return <SettingsToggle value={!!value} onChange={(v) => handleUpdate(item.id, v)} />
      
      case 'slider':
        return (
          <SettingsSlider 
            value={Number(value)} 
            min={item.min ?? 0} 
            max={item.max ?? 100} 
            step={item.step ?? 1}
            unit={item.unit}
            onChange={(v) => handleUpdate(item.id, v)} 
          />
        )
      
      case 'select':
        return (
          <SettingsSelect 
            value={String(value)} 
            options={item.options ?? []} 
            onChange={(v) => handleUpdate(item.id, v)} 
          />
        )
      
      case 'input':
      case 'password':
      case 'number':
        return (
          <SettingsInput 
            value={String(value)} 
            type={item.type}
            onChange={(v) => handleUpdate(item.id, item.type === 'number' ? Number(v) : v)} 
          />
        )
      
      default:
        return null
    }
  }

  return (
    <div className="space-y-8">
      <AnimatePresence mode="popLayout">
        {filteredSchema.map((item) => {
          if (item.hidden?.(settings)) return null

          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              <SettingsItem 
                label={item.label} 
                description={item.description}
                control={renderControl(item)}
              />
            </motion.div>
          )
        })}
      </AnimatePresence>
      
      {filteredSchema.length === 0 && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-20 text-[#4a3a5a]"
        >
          <div className="text-4xl mb-4">🔍</div>
          <p className="text-sm">No settings found matching "{search}"</p>
        </motion.div>
      )}
    </div>
  )
}
