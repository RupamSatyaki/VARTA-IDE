import React, { useState, useRef, useCallback } from 'react'
import { cn } from '../../utils/cn'

export interface TabItem {
  id: string
  label: React.ReactNode
  disabled?: boolean
}

export interface TabsProps {
  tabs: TabItem[]
  activeTab?: string
  defaultTab?: string
  onChange?: (id: string) => void
  className?: string
  tabClassName?: string
}

export function Tabs({ tabs, activeTab: controlled, defaultTab, onChange, className, tabClassName }: TabsProps) {
  const [internal, setInternal] = useState(defaultTab ?? tabs[0]?.id ?? '')
  const active = controlled !== undefined ? controlled : internal
  const listRef = useRef<HTMLDivElement>(null)

  const select = useCallback((id: string) => {
    setInternal(id)
    onChange?.(id)
  }, [onChange])

  const handleKeyDown = (e: React.KeyboardEvent, idx: number) => {
    const enabled = tabs.filter((t) => !t.disabled)
    const cur = enabled.findIndex((t) => t.id === active)
    if (e.key === 'ArrowRight') { e.preventDefault(); select(enabled[(cur + 1) % enabled.length].id) }
    if (e.key === 'ArrowLeft')  { e.preventDefault(); select(enabled[(cur - 1 + enabled.length) % enabled.length].id) }
    if (e.key === 'Home')       { e.preventDefault(); select(enabled[0].id) }
    if (e.key === 'End')        { e.preventDefault(); select(enabled[enabled.length - 1].id) }
  }

  return (
    <div ref={listRef} role="tablist" className={cn('flex items-center border-b border-[#333333]', className)}>
      {tabs.map((tab, idx) => (
        <button
          key={tab.id}
          role="tab"
          aria-selected={active === tab.id}
          aria-controls={`tabpanel-${tab.id}`}
          id={`tab-${tab.id}`}
          disabled={tab.disabled}
          tabIndex={active === tab.id ? 0 : -1}
          onClick={() => !tab.disabled && select(tab.id)}
          onKeyDown={(e) => handleKeyDown(e, idx)}
          className={cn(
            'px-3 py-1.5 text-sm transition-colors outline-none border-b-2 -mb-px',
            'focus-visible:ring-2 focus-visible:ring-[#569cd6]',
            active === tab.id
              ? 'border-[#569cd6] text-[#d4d4d4]'
              : 'border-transparent text-[#6e6e6e] hover:text-[#d4d4d4]',
            tab.disabled && 'opacity-40 cursor-not-allowed',
            tabClassName,
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}
