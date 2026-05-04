import React, { useState, useRef } from 'react'
import { cn } from '../../utils/cn'
import { Tooltip } from './Tooltip'

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  tooltip?: string
  tooltipPlacement?: 'top' | 'bottom' | 'left' | 'right'
  active?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
  children: React.ReactNode
}

const sizeClasses = { sm: 'w-6 h-6 text-sm', md: 'w-8 h-8 text-base', lg: 'w-10 h-10 text-lg' }

export function IconButton({
  tooltip,
  tooltipPlacement = 'bottom',
  active = false,
  size = 'md',
  className,
  children,
  disabled,
  ...props
}: IconButtonProps) {
  const btn = (
    <button
      {...props}
      disabled={disabled}
      aria-pressed={active}
      className={cn(
        'inline-flex items-center justify-center rounded',
        'transition-colors duration-100 outline-none',
        'focus-visible:ring-2 focus-visible:ring-[#569cd6]',
        'disabled:opacity-40 disabled:cursor-not-allowed',
        active
          ? 'text-[#d4d4d4] bg-[#37373d]'
          : 'text-[#6e6e6e] hover:text-[#d4d4d4] hover:bg-[#2a2a2a]',
        sizeClasses[size],
        className,
      )}
    >
      {children}
    </button>
  )

  if (!tooltip) { return btn }

  return (
    <Tooltip content={tooltip} placement={tooltipPlacement}>
      {btn}
    </Tooltip>
  )
}
