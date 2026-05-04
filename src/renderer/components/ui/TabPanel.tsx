import React from 'react'
import { cn } from '../../utils/cn'

export interface TabPanelProps {
  id: string
  activeTab: string
  children: React.ReactNode
  className?: string
}

export function TabPanel({ id, activeTab, children, className }: TabPanelProps) {
  if (activeTab !== id) { return null }
  return (
    <div
      role="tabpanel"
      id={`tabpanel-${id}`}
      aria-labelledby={`tab-${id}`}
      className={cn('flex-1 min-h-0', className)}
    >
      {children}
    </div>
  )
}
