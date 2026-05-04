import React from 'react'
import { cn } from '../../utils/cn'

export interface ScrollAreaProps {
  children: React.ReactNode
  className?: string
  orientation?: 'vertical' | 'horizontal' | 'both'
}

export function ScrollArea({ children, className, orientation = 'vertical' }: ScrollAreaProps) {
  return (
    <div
      className={cn(
        'varta-scrollarea',
        orientation === 'vertical'   && 'overflow-y-auto overflow-x-hidden',
        orientation === 'horizontal' && 'overflow-x-auto overflow-y-hidden',
        orientation === 'both'       && 'overflow-auto',
        className,
      )}
    >
      {children}
    </div>
  )
}
