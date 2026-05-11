import React, { useEffect, useState, useRef } from 'react'
import { useSettingsStore } from '../../store/settingsStore'
import { CLAUDE_MODELS } from '../../../shared/types/ai.types'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faChevronDown, faCheck } from '@fortawesome/free-solid-svg-icons'
import { cn } from '../../utils/cn'

// Group models by provider
const GROUPS = [
  {
    label: 'OpenRouter',
    filter: (id: string) => id === 'openrouter/owl-alpha',
  },
  {
    label: 'OpenRouter Free',
    filter: (id: string) => id.endsWith(':free') && id !== 'openrouter/owl-alpha',
  },
  {
    label: 'Anthropic',
    filter: (id: string) => id.startsWith('claude-'),
  },
  {
    label: 'NVIDIA NIM',
    filter: (id: string) =>
      !id.endsWith(':free') && !id.startsWith('claude-') && !id.startsWith('openrouter/'),
  },
]

export function AIModelSelector() {
  const { settings, update } = useSettingsStore()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const currentModel = CLAUDE_MODELS.find(m => m.id === settings.ai.model)
  const displayName  = currentModel?.name ?? settings.ai.model.split('/').pop() ?? settings.ai.model

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const select = (id: string) => {
    update({ ai: { ...settings.ai, model: id } })
    window.varta.settings.set({ ai: { model: id } }).catch(() => {})
    setOpen(false)
  }

  return (
    <div ref={ref} className="relative">
      {/* Trigger */}
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-1.5 h-6 px-2 rounded-md text-[10px]
          text-[#9090b0] hover:text-[#cccccc] transition-colors max-w-[160px]"
      >
        <span className="truncate">{displayName}</span>
        <FontAwesomeIcon icon={faChevronDown} style={{ fontSize: 8 }} className="shrink-0" />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-full mt-1 w-72 z-[9999]
          bg-[#1e1a24] border border-[#3a2f45] rounded-xl shadow-2xl
          overflow-hidden max-h-80 overflow-y-auto">
          {GROUPS.map(group => {
            const models = CLAUDE_MODELS.filter(m => group.filter(m.id))
            if (models.length === 0) return null
            return (
              <div key={group.label}>
                <div className="px-3 py-1.5 text-[9px] font-bold uppercase tracking-widest
                  text-[#5a4a6a] bg-[#1a1520] border-b border-[#2a1f30] sticky top-0">
                  {group.label}
                </div>
                {models.map(m => (
                  <button
                    key={m.id}
                    onClick={() => select(m.id)}
                    className={cn(
                      'w-full flex items-center justify-between px-3 py-1.5 text-left',
                      'text-[11px] transition-colors hover:bg-[#7c3aed]/10',
                      settings.ai.model === m.id ? 'text-[#c084fc]' : 'text-[#cccccc]',
                    )}
                  >
                    <span className="truncate flex-1">{m.name}</span>
                    {settings.ai.model === m.id && (
                      <FontAwesomeIcon icon={faCheck} style={{ fontSize: 9 }} className="text-[#c084fc] shrink-0 ml-2" />
                    )}
                  </button>
                ))}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
