import React from 'react'
import { cn } from '../../utils/cn'

export interface BadgeProps {
  children: React.ReactNode
  variant?: 'default' | 'error' | 'warning' | 'success' | 'info'
  className?: string
}

const variantClasses: Record<NonNullable<BadgeProps['variant']>, string> = {
  default: 'bg-[#3c3c3c] text-[#d4d4d4]',
  error:   'bg-[#5a1d1d] text-[#f44747]',
  warning: 'bg-[#4d3800] text-[#ff8c00]',
  success: 'bg-[#1b3a2d] text-[#4ec9b0]',
  info:    'bg-[#1b2d3e] text-[#569cd6]',
}

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span className={cn('inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium', variantClasses[variant], className)}>
      {children}
    </span>
  )
}
