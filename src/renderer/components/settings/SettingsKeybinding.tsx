import React, { useState, useEffect, useRef } from 'react'
import { cn } from '../../utils/cn'

export interface SettingsKeybindingProps {
  value:    string
  onChange: (v: string) => void
  onReset:  () => void
}

export function SettingsKeybinding({ value, onChange, onReset }: SettingsKeybindingProps) {
  const [recording, setRecording] = useState(false)
  const [captured,  setCaptured]  = useState('')
  const btnRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!recording) { return }

    const handleKey = (e: KeyboardEvent) => {
      e.preventDefault()
      if (e.key === 'Escape') { setRecording(false); setCaptured(''); return }

      const parts: string[] = []
      if (e.ctrlKey  || e.metaKey) { parts.push('Ctrl') }
      if (e.shiftKey) { parts.push('Shift') }
      if (e.altKey)   { parts.push('Alt') }
      const key = e.key.length === 1 ? e.key.toUpperCase() : e.key
      if (!['Control', 'Shift', 'Alt', 'Meta'].includes(key)) { parts.push(key) }

      if (parts.length > 0) {
        const combo = parts.join('+')
        setCaptured(combo)
        onChange(combo)
        setRecording(false)
      }
    }

    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [recording, onChange])

  return (
    <div className="flex items-center gap-1.5">
      <button
        ref={btnRef}
        onClick={() => setRecording((v) => !v)}
        className={cn(
          'px-2 h-7 text-xs rounded border transition-colors min-w-[100px] text-left',
          recording
            ? 'border-[#569cd6] bg-[#1b2d3e] text-[#569cd6]'
            : 'border-[#3c3c3c] bg-[#3c3c3c] text-[#d4d4d4] hover:border-[#569cd6]',
        )}
      >
        {recording ? (captured || 'Press keys…') : (value || 'Not set')}
      </button>
      <button
        onClick={onReset}
        title="Reset to default"
        className="text-[#6e6e6e] hover:text-[#d4d4d4] text-xs transition-colors"
      >
        ↺
      </button>
    </div>
  )
}
