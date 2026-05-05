import React, { useRef, useEffect, useState } from 'react'
import { cn } from '../../utils/cn'

export interface AIChatInputProps {
  onSend:       (text: string) => void
  onCancel:     () => void
  isStreaming:  boolean
  contextLabel?: string
  onClearContext?: () => void
  disabled?:    boolean
}

export function AIChatInput({
  onSend, onCancel, isStreaming, contextLabel, onClearContext, disabled,
}: AIChatInputProps) {
  const [text, setText] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current
    if (!el) { return }
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 200) + 'px'
  }, [text])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (isStreaming) { onCancel(); return }
      if (text.trim()) { handleSend() }
    }
    if (e.key === 'Escape' && isStreaming) {
      onCancel()
    }
  }

  const handleSend = () => {
    const trimmed = text.trim()
    if (!trimmed) { return }
    onSend(trimmed)
    setText('')
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }

  return (
    <div className="border-t border-[#333333] bg-[#252526]">
      {/* Context preview */}
      {contextLabel && (
        <div className="flex items-center gap-1.5 px-3 pt-2">
          <span className="text-[10px] text-[#6e6e6e] bg-[#3c3c3c] px-2 py-0.5 rounded flex items-center gap-1">
            📄 {contextLabel}
            {onClearContext && (
              <button
                onClick={onClearContext}
                className="ml-1 text-[#6e6e6e] hover:text-[#d4d4d4]"
              >
                ×
              </button>
            )}
          </span>
        </div>
      )}

      <div className="flex items-end gap-2 px-3 py-2">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={isStreaming ? 'Streaming… (Esc to cancel)' : 'Ask Varta anything…'}
          disabled={disabled}
          rows={1}
          className={cn(
            'flex-1 resize-none bg-[#3c3c3c] text-sm text-[#d4d4d4]',
            'border border-[#3c3c3c] focus:border-[#569cd6] rounded-lg outline-none',
            'px-3 py-2 placeholder:text-[#6e6e6e] leading-relaxed',
            'min-h-[36px] max-h-[200px] overflow-y-auto',
            disabled && 'opacity-50 cursor-not-allowed',
          )}
        />

        <button
          onClick={isStreaming ? onCancel : handleSend}
          disabled={!isStreaming && (!text.trim() || disabled)}
          className={cn(
            'w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors',
            isStreaming
              ? 'bg-[#f44747] hover:bg-[#e03030] text-white'
              : 'bg-[#0e639c] hover:bg-[#1177bb] text-white disabled:opacity-40 disabled:cursor-not-allowed',
          )}
          title={isStreaming ? 'Cancel (Esc)' : 'Send (Enter)'}
        >
          {isStreaming ? (
            <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
              <rect x="2" y="2" width="8" height="8" rx="1"/>
            </svg>
          ) : (
            <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
              <path d="M1 6l10-5-5 10V7H1V6z"/>
            </svg>
          )}
        </button>
      </div>

      <p className="px-3 pb-1.5 text-[10px] text-[#4e4e4e]">
        Enter to send · Shift+Enter for new line · Esc to cancel
      </p>
    </div>
  )
}
