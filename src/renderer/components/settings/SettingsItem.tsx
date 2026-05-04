import React from 'react'
import { cn } from '../../utils/cn'

export interface SettingsItemProps {
  label:       string
  description?: string
  control:     React.ReactNode
  className?:  string
  hidden?:     boolean
}

export function SettingsItem({ label, description, control, className, hidden }: SettingsItemProps) {
  if (hidden) { return null }
  return (
    <div className={cn('flex items-start justify-between gap-4 py-3 border-b border-[#2d2d2d]', className)}>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-[#d4d4d4] font-medium">{label}</p>
        {description && (
          <p className="text-xs text-[#6e6e6e] mt-0.5 leading-relaxed">{description}</p>
        )}
      </div>
      <div className="shrink-0 flex items-center">
        {control}
      </div>
    </div>
  )
}
