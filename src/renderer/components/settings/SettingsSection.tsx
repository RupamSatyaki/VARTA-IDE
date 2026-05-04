import React from 'react'
import { cn } from '../../utils/cn'

export interface SettingsSectionProps {
  id:       string
  title:    string
  children: React.ReactNode
  className?: string
}

export function SettingsSection({ id, title, children, className }: SettingsSectionProps) {
  return (
    <section id={`settings-${id}`} className={cn('mb-8', className)}>
      <h2 className="text-base font-semibold text-[#d4d4d4] mb-1 pb-2 border-b border-[#333333]">
        {title}
      </h2>
      <div>{children}</div>
    </section>
  )
}
