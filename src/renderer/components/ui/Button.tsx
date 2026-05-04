import React from 'react'
import { cn } from '../../utils/cn'
import { Spinner } from './Spinner'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'ghost' | 'danger' | 'primary'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  children: React.ReactNode
  className?: string
}

const variantClasses: Record<NonNullable<ButtonProps['variant']>, string> = {
  default: 'bg-[#2d2d2d] text-[#d4d4d4] border border-[#333333] hover:bg-[#3a3a3a] hover:border-[#555555]',
  ghost:   'bg-transparent text-[#d4d4d4] hover:bg-[#2a2a2a] border border-transparent',
  danger:  'bg-[#5a1d1d] text-[#f44747] border border-[#6e2020] hover:bg-[#6e2020]',
  primary: 'bg-[#0e639c] text-white border border-[#1177bb] hover:bg-[#1177bb]',
}

const sizeClasses: Record<NonNullable<ButtonProps['size']>, string> = {
  sm: 'h-6 px-2 text-xs gap-1',
  md: 'h-8 px-3 text-sm gap-1.5',
  lg: 'h-10 px-4 text-base gap-2',
}

export function Button({
  variant = 'default',
  size = 'md',
  loading = false,
  disabled,
  children,
  className,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading

  return (
    <button
      {...props}
      disabled={isDisabled}
      className={cn(
        'inline-flex items-center justify-center rounded font-medium',
        'transition-colors duration-100 outline-none',
        'focus-visible:ring-2 focus-visible:ring-[#569cd6] focus-visible:ring-offset-1 focus-visible:ring-offset-[#1a1a1a]',
        'disabled:opacity-40 disabled:cursor-not-allowed',
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
    >
      {loading && <Spinner size={size === 'lg' ? 'md' : 'sm'} />}
      {children}
    </button>
  )
}
