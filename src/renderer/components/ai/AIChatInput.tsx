import React, { useRef, useEffect, useState } from 'react'
import { cn } from '../../utils/cn'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPaperPlane, faStop, faXmark } from '@fortawesome/free-solid-svg-icons'

export interface AIChatInputProps {
  onSend:          (text: string) => void
  onCancel:        () => void
  isStreaming:     boolean
  contextLabel?:   string
  onClearContext?: () => void
  disabled?:       boolean
}

export function AIChatInput({ onSend, onCancel, isStreaming, contextLabel, onClearContext, disabled }: AIChatInputProps) {
  const [text, setText] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const el = textareaRef.current
    if (!el) { return }
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 160) + 'px'
  }, [text])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (isStreaming) { onCancel(); return }
      if (text.trim()) { handleSend() }
    }
    if (e.key === 'Escape' && isStreaming) { onCancel() }
  }

  const handleSend = () => {
    const trimmed = text.trim()
    if (!trimmed) { return }
    onSend(trimmed)
    setText('')
    if (textareaRef.current) { textareaRef.current.style.height = 'auto' }
  }

  return (
    <div className="border-t border-[#2a1f30] bg-[#28242e] px-3 py-2.5">
      {/* Context label */}
      {contextLabel && (
        <div className="flex items-center gap-1.5 mb-2">
          <span className="flex items-center gap-1 text-[10px] text-[#6e5a7a] bg-[#1e1a24]
            border border-[#3a2f45] px-2 py-0.5 rounded-full">
            📄 {contextLabel}
            {onClearContext && (
              <button onClick={onClearContext} className="ml-1 hover:text-[#f87171] transition-colors">
                <FontAwesomeIcon icon={faXmark} style={{ fontSize: 9 }} />
              </button>
            )}
          </span>
        </div>
      )}

      {/* Input area */}
      <div className={cn(
        'flex items-end gap-2 rounded-xl border transition-all duration-150 bg-[#1e1a24]',
        text.length > 0 ? 'border-[#7c3aed]/50' : 'border-[#3a2f45] focus-within:border-[#7c3aed]/50',
      )}>
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={isStreaming ? 'Streaming… (Esc to cancel)' : 'Ask anything…'}
          disabled={disabled}
          rows={1}
          className={cn(
            'flex-1 resize-none bg-transparent text-[12px] text-[#cccccc]',
            'outline-none px-3 py-2.5 placeholder:text-[#4a3a5a] leading-relaxed',
            'min-h-[38px] max-h-[160px] overflow-y-auto',
            disabled && 'opacity-50 cursor-not-allowed',
          )}
        />

        <button
          onClick={isStreaming ? onCancel : handleSend}
          disabled={!isStreaming && (!text.trim() || disabled)}
          className={cn(
            'w-7 h-7 mb-1.5 mr-1.5 rounded-lg flex items-center justify-center shrink-0 transition-all duration-150',
            isStreaming
              ? 'bg-[#f87171]/20 border border-[#f87171]/40 text-[#f87171] hover:bg-[#f87171]/30'
              : text.trim()
                ? 'bg-[#7c3aed]/30 border border-[#7c3aed]/50 text-[#c084fc] hover:bg-[#7c3aed]/50 hover:text-white'
                : 'bg-transparent border border-[#3a2f45] text-[#3a2f45] cursor-not-allowed',
          )}
          title={isStreaming ? 'Cancel (Esc)' : 'Send (Enter)'}
        >
          <FontAwesomeIcon icon={isStreaming ? faStop : faPaperPlane} style={{ fontSize: 11 }} />
        </button>
      </div>

      <p className="mt-1.5 text-[10px] text-[#3a2f45] text-center">
        Enter to send · Shift+Enter for new line
      </p>
    </div>
  )
}
