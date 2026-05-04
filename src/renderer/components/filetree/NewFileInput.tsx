import React, { useRef, useEffect, useState } from 'react'
import { cn } from '../../utils/cn'

export interface NewFileInputProps {
  depth:        number
  initialValue?: string
  placeholder?: string
  onConfirm:    (name: string) => void
  onCancel:     () => void
  /** If true, selects the name without extension on mount */
  selectBasename?: boolean
}

const INVALID_CHARS = /[<>:"/\\|?*\x00-\x1f]/

export function NewFileInput({
  depth,
  initialValue = '',
  placeholder = 'filename',
  onConfirm,
  onCancel,
  selectBasename = false,
}: NewFileInputProps) {
  const [value, setValue] = useState(initialValue)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const el = inputRef.current
    if (!el) { return }
    el.focus()

    if (selectBasename && initialValue) {
      const dotIdx = initialValue.lastIndexOf('.')
      const end    = dotIdx > 0 ? dotIdx : initialValue.length
      el.setSelectionRange(0, end)
    } else {
      el.select()
    }
  }, [])

  const validate = (name: string): string | null => {
    if (!name.trim())           { return 'Name cannot be empty' }
    if (INVALID_CHARS.test(name)) { return 'Name contains invalid characters' }
    if (name === '.' || name === '..') { return 'Invalid name' }
    return null
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      const err = validate(value)
      if (err) { setError(err); return }
      onConfirm(value.trim())
    }
    if (e.key === 'Escape') {
      e.preventDefault()
      onCancel()
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value)
    setError(null)
  }

  return (
    <div
      className="flex flex-col"
      style={{ paddingLeft: depth * 12 + 22 }}
    >
      <input
        ref={inputRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onBlur={onCancel}
        placeholder={placeholder}
        spellCheck={false}
        className={cn(
          'w-full h-6 px-1 text-sm bg-[#3c3c3c] text-[#d4d4d4]',
          'border rounded outline-none',
          error ? 'border-[#f44747]' : 'border-[#569cd6]',
        )}
      />
      {error && (
        <span className="text-[10px] text-[#f44747] px-1 mt-0.5">{error}</span>
      )}
    </div>
  )
}
