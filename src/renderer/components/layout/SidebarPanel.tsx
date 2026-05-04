import React from 'react'
import { cn } from '../../utils/cn'

export interface SidebarPanelProps {
  title:    string
  children: React.ReactNode
  actions?: React.ReactNode
  className?: string
}

export function SidebarPanel({ title, children, actions, className }: SidebarPanelProps) {
  return (
    <div className={cn('flex flex-col h-full', className)}>
      <div className="flex items-center justify-between px-3 h-9 shrink-0 border-b border-[#333333]">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-[#6e6e6e]">
          {title}
        </span>
        {actions && <div className="flex items-center gap-1">{actions}</div>}
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto">
        {children}
      </div>
    </div>
  )
}
