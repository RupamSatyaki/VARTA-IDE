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
    <div className={cn('group flex items-start justify-between gap-8 py-5 border-b border-[#2a1f30]/50 last:border-0 transition-colors', className)}>
      <div className="flex-1 min-w-0">
        <h4 className="text-[13px] font-semibold text-[#e0e0e0] group-hover:text-[#c084fc] transition-colors duration-300">
          {label}
        </h4>
        {description && (
          <p className="text-[11px] text-[#4a3a5a] mt-1 leading-relaxed max-w-md">
            {description}
          </p>
        )}
      </div>
      <div className="shrink-0 flex items-center pt-0.5">
        <div className="p-1 rounded-xl bg-[#12101a]/50 border border-[#2a1f30] shadow-inner">
          {control}
        </div>
      </div>
    </div>
  )
}
