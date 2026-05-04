import React from 'react'
import { cn } from '../../utils/cn'

const SECTIONS = [
  { id: 'editor',      label: 'Editor' },
  { id: 'terminal',    label: 'Terminal' },
  { id: 'appearance',  label: 'Appearance' },
  { id: 'git',         label: 'Git' },
  { id: 'ai',          label: 'AI / Intelligence' },
  { id: 'keybindings', label: 'Keybindings' },
  { id: 'about',       label: 'About' },
]

export interface SettingsSidebarProps {
  activeSection: string
  onSelect:      (id: string) => void
}

export function SettingsSidebar({ activeSection, onSelect }: SettingsSidebarProps) {
  const scrollTo = (id: string) => {
    onSelect(id)
    document.getElementById(`settings-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="w-48 shrink-0 border-r border-[#333333] py-2 overflow-y-auto">
      {SECTIONS.map((s) => (
        <button
          key={s.id}
          onClick={() => scrollTo(s.id)}
          className={cn(
            'w-full text-left px-4 py-2 text-sm transition-colors rounded-none',
            activeSection === s.id
              ? 'text-[#d4d4d4] bg-[#37373d]'
              : 'text-[#6e6e6e] hover:text-[#d4d4d4] hover:bg-[#2a2d2e]',
          )}
        >
          {s.label}
        </button>
      ))}
    </div>
  )
}
