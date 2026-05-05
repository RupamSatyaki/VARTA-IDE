import React, { useState } from 'react'
import { cn } from '../../utils/cn'
import { useNotificationStore } from '../../store/notificationStore'

export type ExtensionFilter = 'all' | 'enabled' | 'disabled'

export interface ExtensionToolbarProps {
  filter:    ExtensionFilter
  onFilter:  (f: ExtensionFilter) => void
}

export function ExtensionToolbar({ filter, onFilter }: ExtensionToolbarProps) {
  const { info } = useNotificationStore()

  return (
    <div className="flex items-center justify-between px-2 py-1.5 border-b border-[#333333] shrink-0">
      <div className="flex items-center gap-1">
        {(['all', 'enabled', 'disabled'] as ExtensionFilter[]).map((f) => (
          <button
            key={f}
            onClick={() => onFilter(f)}
            className={cn(
              'text-[10px] px-2 h-5 rounded capitalize transition-colors',
              filter === f
                ? 'bg-[#37373d] text-[#d4d4d4]'
                : 'text-[#6e6e6e] hover:text-[#d4d4d4]',
            )}
          >
            {f}
          </button>
        ))}
      </div>
      <button
        onClick={() => info('Extension marketplace coming in v2', 3000)}
        className="text-[10px] text-[#569cd6] hover:text-[#4fc1ff] transition-colors"
      >
        Install from VSIX…
      </button>
    </div>
  )
}
