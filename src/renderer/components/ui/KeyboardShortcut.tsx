import React from 'react'
import { cn } from '../../utils/cn'

export interface KeyboardShortcutProps {
  keys: string | string[]
  className?: string
}

export function KeyboardShortcut({ keys, className }: KeyboardShortcutProps) {
  const parts = Array.isArray(keys) ? keys : keys.split('+')
  return (
    <span className={cn('inline-flex items-center gap-0.5', className)}>
      {parts.map((key, i) => (
        <kbd
          key={i}
          className="px-1 py-0.5 text-[10px] font-mono rounded border border-[#555555] bg-[#3c3c3c] text-[#6e6e6e] leading-none"
        >
          {key.trim()}
        </kbd>
      ))}
    </span>
  )
}
