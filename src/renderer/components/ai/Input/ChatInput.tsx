import React, { useRef, useEffect, useState } from 'react'
import { cn } from '../../../utils/cn'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPaperPlane, faStop, faXmark, faPlus } from '@fortawesome/free-solid-svg-icons'
import { useAIStore } from '../../../store/aiStore'

export interface ChatInputProps {
  onSend: (text: string) => void
  onCancel: () => void
  isStreaming: boolean
  disabled?: boolean
}

export function ChatInput({ onSend, onCancel, isStreaming, disabled }: ChatInputProps) {
  const [text, setText] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const { currentContext, removeContextItem } = useAIStore()

  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 160) + 'px'
  }, [text])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (isStreaming) { onCancel(); return }
      if (text.trim()) { handleSend() }
    }
    if (e.key === 'Escape' && isStreaming) onCancel()
  }

  const handleSend = () => {
    const trimmed = text.trim()
    if (!trimmed) return
    onSend(trimmed)
    setText('')
    if (textareaRef.current) textareaRef.current.style.height = 'auto'
  }

  return (
    <div className="border-t border-[#2a1f30] bg-[#28242e]/95 backdrop-blur-lg px-4 py-4 space-y-3">
      {/* Context Chips */}
      {currentContext.length > 0 && (
        <div className="flex flex-wrap gap-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
          {currentContext.map((item) => (
            <div
              key={item.id}
              className="group flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#7c3aed]/10 border border-[#7c3aed]/20 hover:border-[#7c3aed]/40 transition-all duration-200 shadow-sm"
            >
              <span className="text-[10px]">
                {item.type === 'file' ? '📄' : item.type === 'selection' ? '✨' : '📟'}
              </span>
              <span className="text-[10px] font-medium text-[#c084fc] truncate max-w-[120px]">
                {item.label}
              </span>
              <button
                onClick={() => removeContextItem(item.id)}
                className="opacity-40 group-hover:opacity-100 hover:text-[#f87171] transition-all"
              >
                <FontAwesomeIcon icon={faXmark} style={{ fontSize: 9 }} />
              </button>
            </div>
          ))}
          <button className="flex items-center justify-center w-6 h-6 rounded-lg border border-dashed border-[#3a2f45] text-[#3a2f45] hover:border-[#7c3aed]/40 hover:text-[#c084fc] transition-all">
            <FontAwesomeIcon icon={faPlus} style={{ fontSize: 9 }} />
          </button>
        </div>
      )}

      {/* Input Box */}
      <div className={cn(
        'relative flex items-end gap-2 rounded-2xl border transition-all duration-300 bg-[#1e1a24]/80 shadow-inner group',
        text.length > 0 ? 'border-[#7c3aed]/40 ring-1 ring-[#7c3aed]/20' : 'border-[#3a2f45] focus-within:border-[#7c3aed]/40 focus-within:ring-1 focus-within:ring-[#7c3aed]/20',
      )}>
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={isStreaming ? 'Thinking...' : 'Ask Varta Intelligence...'}
          disabled={disabled}
          rows={1}
          className={cn(
            'flex-1 resize-none bg-transparent text-[13px] text-[#e0e0e0]',
            'outline-none px-4 py-3.5 placeholder:text-[#4a3a5a] leading-relaxed',
            'min-h-[48px] max-h-[160px] overflow-y-auto scrollbar-none',
            disabled && 'opacity-50 cursor-not-allowed',
          )}
        />

        <div className="flex items-center gap-2 px-3 pb-2.5">
          <button
            onClick={isStreaming ? onCancel : handleSend}
            disabled={!isStreaming && (!text.trim() || disabled)}
            className={cn(
              'w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all duration-300 transform active:scale-95 group/btn',
              isStreaming
                ? 'bg-[#f87171]/20 border border-[#f87171]/30 text-[#f87171] hover:bg-[#f87171]/30'
                : text.trim()
                  ? 'bg-gradient-to-br from-[#7c3aed] to-[#a855f7] text-white shadow-lg shadow-[#7c3aed]/20 hover:shadow-[#7c3aed]/40'
                  : 'bg-[#12101a] border border-[#3a2f45] text-[#3a2f45] cursor-not-allowed',
            )}
          >
            <FontAwesomeIcon 
              icon={isStreaming ? faStop : faPaperPlane} 
              className={cn(
                'transition-transform duration-300',
                !isStreaming && text.trim() && 'group-hover/btn:-translate-y-0.5 group-hover/btn:translate-x-0.5',
                isStreaming ? 'text-[10px]' : 'text-[13px]'
              )} 
            />
          </button>
        </div>
      </div>

      <div className="flex justify-between items-center px-1">
        <span className="text-[9px] font-bold text-[#4a3a5a] uppercase tracking-[0.2em]">
          {text.length} Characters
        </span>
        <span className="text-[9px] font-medium text-[#4a3a5a] flex items-center gap-1.5">
          <kbd className="px-1 py-0.5 rounded border border-[#3a2f45] bg-[#1a1620]">Enter</kbd> to send
        </span>
      </div>
    </div>
  )
}
