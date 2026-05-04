import React from 'react'
import { cn } from '../../utils/cn'

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean
  errorMessage?: string
  className?: string
}

export function Textarea({ error = false, errorMessage, className, ...props }: TextareaProps) {
  return (
    <div className="flex flex-col gap-1">
      <textarea
        className={cn(
          'w-full rounded border bg-[#3c3c3c] text-sm text-[#d4d4d4]',
          'px-2 py-1.5 placeholder:text-[#6e6e6e] outline-none resize-y',
          'transition-colors min-h-[80px]',
          error
            ? 'border-[#f44747] focus:border-[#f44747]'
            : 'border-[#3c3c3c] focus:border-[#569cd6]',
          className,
        )}
        {...props}
      />
      {error && errorMessage && (
        <p className="text-xs text-[#f44747]">{errorMessage}</p>
      )}
    </div>
  )
}
