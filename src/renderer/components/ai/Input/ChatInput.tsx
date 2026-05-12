import React, { useRef, useEffect, useState, useCallback } from 'react'
import { cn } from '../../../utils/cn'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPaperPlane, faStop, faXmark, faPlus, faPaperclip, faMicrochip } from '@fortawesome/free-solid-svg-icons'
import { useAIStore } from '../../../store/aiStore'
import { motion, AnimatePresence } from 'framer-motion'

export interface ChatInputProps {
  onSend: (text: string) => void
  onCancel: () => void
  isStreaming: boolean
  disabled?: boolean
}

export function ChatInput({ onSend, onCancel, isStreaming, disabled }: ChatInputProps) {
  const [text, setText] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const { currentContext, removeContextItem, pendingConfirmation, setPendingConfirmation, autoGrant, setAutoGrant } = useAIStore()

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

  const handleSend = useCallback(() => {
    const trimmed = text.trim()
    if (!trimmed) return
    onSend(trimmed)
    setText('')
    if (textareaRef.current) textareaRef.current.style.height = 'auto'
  }, [text, onSend])

  const handleConfirm = (approved: boolean) => {
    if (pendingConfirmation) {
      window.varta.mcp.confirmReply(pendingConfirmation.replyChannel, approved)
      setPendingConfirmation(null)
    }
  }

  return (
    <div className="relative border-t border-[#2a1f30] bg-[#1a1620]/80 backdrop-blur-xl px-4 py-4 space-y-3 shadow-[0_-10px_40px_rgba(0,0,0,0.3)]">
      
      {/* Confirmation Tab */}
      <AnimatePresence>
        {pendingConfirmation && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute left-4 right-4 bottom-[calc(100%+10px)] z-50 bg-[#28242e] border border-[#7c3aed]/30 rounded-xl p-3 shadow-2xl backdrop-blur-md"
          >
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#7c3aed]/20 flex items-center justify-center shrink-0">
                <FontAwesomeIcon icon={faMicrochip} className="text-[#c084fc] text-sm" />
              </div>
              <div className="flex-1">
                <h4 className="text-[11px] font-bold text-[#f3e8ff] mb-1">Permission Required</h4>
                <p className="text-[10px] text-[#9a8aa5] leading-relaxed mb-3">
                  {pendingConfirmation.message}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleConfirm(true)}
                    className="px-3 py-1.5 rounded-lg bg-[#7c3aed] hover:bg-[#8b5cf6] text-white text-[10px] font-bold transition-all shadow-lg shadow-[#7c3aed]/20"
                  >
                    Allow
                  </button>
                  <button
                    onClick={() => handleConfirm(false)}
                    className="px-3 py-1.5 rounded-lg bg-[#3a2f45] hover:bg-[#4a3a5a] text-[#f3e8ff] text-[10px] font-bold transition-all"
                  >
                    Deny
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Context Chips */}
      <AnimatePresence mode="popLayout">
        {currentContext.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="flex flex-wrap gap-2 mb-1"
          >
            {currentContext.map((item) => (
              <motion.div
                layout
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                key={item.id}
                className="group flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#7c3aed]/10 border border-[#7c3aed]/20 hover:border-[#7c3aed]/40 transition-all duration-200 shadow-sm"
              >
                <span className="text-[10px] text-[#c084fc]">
                  {item.type === 'file' ? '📄' : item.type === 'selection' ? '✨' : '📟'}
                </span>
                <span className="text-[10px] font-semibold text-[#f3e8ff] truncate max-w-[150px]">
                  {item.label}
                </span>
                <button
                  onClick={() => removeContextItem(item.id)}
                  className="ml-1 opacity-40 group-hover:opacity-100 hover:text-[#f87171] transition-all"
                >
                  <FontAwesomeIcon icon={faXmark} style={{ fontSize: 9 }} />
                </button>
              </motion.div>
            ))}
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center justify-center w-6 h-6 rounded-full border border-dashed border-[#3a2f45] text-[#3a2f45] hover:border-[#7c3aed]/40 hover:text-[#c084fc] transition-all"
            >
              <FontAwesomeIcon icon={faPlus} style={{ fontSize: 9 }} />
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input Box Wrapper */}
      <div className={cn(
        'relative flex flex-col rounded-2xl border transition-all duration-500 bg-[#0d0b12]/60 backdrop-blur-md shadow-2xl group overflow-hidden',
        text.length > 0 ? 'border-[#7c3aed]/50 ring-1 ring-[#7c3aed]/20' : 'border-[#2a1f30] focus-within:border-[#7c3aed]/40 focus-within:ring-1 focus-within:ring-[#7c3aed]/20',
        disabled && 'opacity-60 grayscale'
      )}>
        
        {/* Glow effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#7c3aed]/5 via-transparent to-transparent pointer-events-none" />

        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={isStreaming ? 'AI is processing your request...' : 'Type your message...'}
          disabled={disabled}
          rows={1}
          className={cn(
            'flex-1 resize-none bg-transparent text-[13px] text-[#f3e8ff]',
            'outline-none px-4 pt-4 pb-2 placeholder:text-[#4a3a5a] leading-relaxed',
            'min-h-[50px] max-h-[160px] overflow-y-auto scrollbar-none',
            disabled && 'cursor-not-allowed',
          )}
        />

        {/* Action Bar */}
        <div className="flex items-center justify-between px-3 pb-3 pt-1">
          <div className="flex items-center gap-3">
            <button className="text-[#4a3a5a] hover:text-[#c084fc] transition-colors p-1.5 hover:bg-[#c084fc]/10 rounded-lg">
              <FontAwesomeIcon icon={faPaperclip} className="text-[12px]" />
            </button>
            
            {/* Permission Toggle */}
            <div className="flex items-center gap-2 px-2 py-1 rounded-lg bg-[#0d0b12] border border-[#2a1f30] hover:border-[#7c3aed]/30 transition-all">
              <span className="text-[9px] font-bold text-[#6e5a7a] uppercase tracking-wider">Grant</span>
              <button 
                onClick={() => setAutoGrant(!autoGrant)}
                className={cn(
                  'w-7 h-3.5 rounded-full relative transition-colors duration-200 outline-none',
                  autoGrant ? 'bg-[#7c3aed]' : 'bg-[#1a1620]'
                )}
              >
                <div className={cn(
                  'absolute top-0.5 left-0.5 w-2.5 h-2.5 rounded-full bg-white transition-transform duration-200',
                  autoGrant ? 'translate-x-3.5' : 'translate-x-0'
                )} />
              </button>
            </div>

            <div className="h-4 w-[1px] bg-[#2a1f30] mx-1" />
            <span className="text-[9px] font-bold text-[#4a3a5a] uppercase tracking-widest">
              {text.length} chars
            </span>
          </div>

          <button
            onClick={isStreaming ? onCancel : handleSend}
            disabled={!isStreaming && (!text.trim() || disabled)}
            className={cn(
              'h-8 px-4 rounded-xl flex items-center justify-center gap-2 transition-all duration-300 transform active:scale-95 font-bold text-[11px] tracking-wide',
              isStreaming
                ? 'bg-[#f87171]/20 border border-[#f87171]/30 text-[#f87171] hover:bg-[#f87171]/30'
                : text.trim()
                  ? 'bg-[#7c3aed] text-white shadow-[0_0_20px_rgba(124,58,237,0.3)] hover:shadow-[0_0_25px_rgba(124,58,237,0.5)] hover:bg-[#8b5cf6]'
                  : 'bg-[#1a1620] border border-[#2a1f30] text-[#4a3a5a] cursor-not-allowed',
            )}
          >
            <span>{isStreaming ? 'STOP' : 'SEND'}</span>
            <FontAwesomeIcon 
              icon={isStreaming ? faStop : faPaperPlane} 
              className={cn(
                'transition-transform duration-300',
                !isStreaming && text.trim() && 'group-hover:translate-x-0.5 group-hover:-translate-y-0.5',
                isStreaming ? 'text-[9px]' : 'text-[10px]'
              )} 
            />
          </button>
        </div>
      </div>

      <div className="flex justify-center">
        <span className="text-[9px] font-medium text-[#4a3a5a] flex items-center gap-1.5 opacity-60">
          <kbd className="px-1 py-0.5 rounded border border-[#2a1f30] bg-[#1a1620]">Shift + Enter</kbd> for new line
        </span>
      </div>
    </div>
  )
}
