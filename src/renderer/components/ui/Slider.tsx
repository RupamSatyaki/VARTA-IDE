import React from 'react'
import { cn } from '../../utils/cn'

export interface SliderProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string
  showValue?: boolean
  className?: string
}

export function Slider({ label, showValue = false, className, value, ...props }: SliderProps) {
  return (
    <div className={cn('flex flex-col gap-1', className)}>
      {(label || showValue) && (
        <div className="flex justify-between text-xs text-[#6e6e6e]">
          {label && <span>{label}</span>}
          {showValue && <span>{value}</span>}
        </div>
      )}
      <input
        type="range"
        value={value}
        className={cn(
          'w-full h-1 rounded-full appearance-none cursor-pointer',
          'bg-[#3c3c3c] accent-[#569cd6]',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#569cd6]',
        )}
        {...props}
      />
    </div>
  )
}
