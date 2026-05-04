import React, { useRef } from 'react'
import { cn } from '../../utils/cn'

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'prefix'> {
  prefix?: React.ReactNode
  suffix?: React.ReactNode
  error?: boolean
  errorMessage?: string
  clearable?: boolean
  onClear?: () => void
  className?: string
  wrapperClassName?: string
}

export function Input({
  prefix,
  suffix,
  error = false,
  errorMessage,
  clearable = false,
  onClear,
  className,
  wrapperClassName,
  value,
  onChange,
  ...props
}: InputProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  const handleClear = () => {
    onClear?.()
    inputRef.current?.focus()
  }

  return (
    <div className={cn('flex flex-col gap-1', wrapperClassName)}>
      <div
        className={cn(
          'flex items-center h-7 rounded border bg-[#3c3c3c] transition-colors',
          error
            ? 'border-[#f44747] focus-within:border-[#f44747]'
            : 'border-[#3c3c3c] focus-within:border-[#569cd6]',
        )}
      >
        {prefix && (
          <span className="pl-2 text-[#6e6e6e] flex items-center shrink-0">{prefix}</span>
        )}
        <input
          ref={inputRef}
          value={value}
          onChange={onChange}
          className={cn(
            'flex-1 min-w-0 h-full px-2 bg-transparent text-sm text-[#d4d4d4]',
            'placeholder:text-[#6e6e6e] outline-none',
            className,
          )}
          {...props}
        />
        {clearable && value && (
          <button
            type="button"
            onClick={handleClear}
            tabIndex={-1}
            className="pr-2 text-[#6e6e6e] hover:text-[#d4d4d4] flex items-center"
            aria-label="Clear"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
              <path d="M6 5.293L10.146 1.146l.708.708L6.707 6l4.147 4.146-.708.708L6 6.707l-4.146 4.147-.708-.708L5.293 6 1.146 1.854l.708-.708L6 5.293z"/>
            </svg>
          </button>
        )}
        {suffix && (
          <span className="pr-2 text-[#6e6e6e] flex items-center shrink-0">{suffix}</span>
        )}
      </div>
      {error && errorMessage && (
        <p className="text-xs text-[#f44747]">{errorMessage}</p>
      )}
    </div>
  )
}
