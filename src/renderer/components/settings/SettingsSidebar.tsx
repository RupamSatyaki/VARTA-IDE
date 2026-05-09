import React from 'react'
import { cn } from '../../utils/cn'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { 
  faCode, 
  faTerminal, 
  faDisplay, 
  faGhost, 
  faCodeBranch, 
  faCircleInfo,
  faGear,
  faKeyboard
} from '@fortawesome/free-solid-svg-icons'

export interface SettingsSidebarProps {
  activeSection: string
  onSelect:      (id: string) => void
}

const SECTIONS = [
  { id: 'editor',      label: 'Editor',      icon: faCode },
  { id: 'terminal',    label: 'Terminal',    icon: faTerminal },
  { id: 'workbench',   label: 'Workbench',   icon: faDisplay },
  { id: 'keybindings', label: 'Shortcuts',   icon: faKeyboard },
  { id: 'git',         label: 'Git',         icon: faCodeBranch },
  { id: 'ai',          label: 'AI Assistant',icon: faGhost },
  { id: 'about',       label: 'About',       icon: faCircleInfo },
]

export function SettingsSidebar({ activeSection, onSelect }: SettingsSidebarProps) {
  const scrollTo = (id: string) => {
    onSelect(id)
    document.getElementById(`settings-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="w-56 shrink-0 border-r border-[#2a1f30] bg-[#1a1620]/30 backdrop-blur-md flex flex-col p-3 gap-1 overflow-y-auto">
      <div className="px-3 py-4 mb-2">
        <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#4a3a5a]">Preferences</h2>
      </div>

      {SECTIONS.map((s) => (
        <button
          key={s.id}
          onClick={() => scrollTo(s.id)}
          className={cn(
            'group flex items-center gap-3 px-3 py-2.5 rounded-xl text-[12px] font-medium transition-all duration-200',
            activeSection === s.id
              ? 'bg-[#7c3aed]/10 text-[#c084fc] shadow-sm'
              : 'text-[#6e5a7a] hover:bg-white/5 hover:text-[#cccccc]'
          )}
        >
          <div className={cn(
            'w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200',
            activeSection === s.id ? 'bg-[#7c3aed] text-white shadow-lg shadow-[#7c3aed]/30' : 'bg-[#1e1a24] text-[#4a3a5a] group-hover:text-[#6e5a7a]'
          )}>
            <FontAwesomeIcon icon={s.icon} style={{ fontSize: 11 }} />
          </div>
          {s.label}
          
          {activeSection === s.id && (
            <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#7c3aed]" />
          )}
        </button>
      ))}

      <div className="mt-auto p-4 rounded-2xl bg-[#7c3aed]/5 border border-[#7c3aed]/10">
        <div className="flex items-center gap-2 mb-2 text-[#7c5a9a]">
          <FontAwesomeIcon icon={faGear} style={{ fontSize: 10 }} />
          <span className="text-[9px] font-bold uppercase tracking-wider">Auto Save</span>
        </div>
        <p className="text-[10px] text-[#4a3a5a] leading-relaxed">
          Your changes are saved automatically as you edit.
        </p>
      </div>
    </div>
  )
}
