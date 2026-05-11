import React from 'react'
import { AIModelSelector } from './AIModelSelector'
import { useAIStore } from '../../store/aiStore'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faWandMagicSparkles, faPlus, faTrash, faHistory } from '@fortawesome/free-solid-svg-icons'
import { Tooltip } from '../ui/Tooltip'
import { motion } from 'framer-motion'

export interface AIChatToolbarProps {
  onNewChat:   () => void
  onClearChat: () => void
}

export function AIChatToolbar({ onNewChat, onClearChat }: AIChatToolbarProps) {
  const { isStreaming } = useAIStore()

  return (
    <div className="flex items-center justify-between px-4 h-12 border-b border-[#2a1f30]/60 bg-[#1a1620]/80 backdrop-blur-xl shrink-0 z-10">
      {/* Left: AI Branding & Status */}
      <div className="flex items-center gap-3">
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-[#7c3aed] to-[#a855f7] rounded-lg opacity-25 group-hover:opacity-50 blur transition duration-500" />
          <div className="relative w-7 h-7 rounded-lg flex items-center justify-center bg-[#0d0b12] border border-[#7c3aed]/20">
            <FontAwesomeIcon icon={faWandMagicSparkles} style={{ fontSize: 11 }} className="text-[#c084fc]" />
          </div>
        </div>
        
        <div className="flex flex-col">
          <span className="text-[11px] font-black text-[#f3e8ff] uppercase tracking-[0.1em]">Varta Intelligence</span>
          {isStreaming ? (
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="flex gap-0.5">
                {[0, 1, 2].map((i) => (
                  <motion.span 
                    key={i} 
                    animate={{ scale: [1, 1.5, 1], opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                    className="w-1 h-1 rounded-full bg-[#c084fc]" 
                  />
                ))}
              </span>
              <span className="text-[8px] font-bold text-[#7c3aed] uppercase tracking-wider animate-pulse">Processing...</span>
            </div>
          ) : (
            <span className="text-[8px] font-bold text-[#4a3a5a] uppercase tracking-wider mt-0.5">Neural Link Ready</span>
          )}
        </div>
      </div>

      {/* Right: Tools & Actions */}
      <div className="flex items-center gap-1.5">
        <div className="bg-[#0d0b12]/50 border border-[#2a1f30] rounded-lg px-1 py-0.5 mr-1">
          <AIModelSelector />
        </div>

        <div className="h-6 w-[1px] bg-[#2a1f30] mx-1" />

        <div className="flex items-center gap-1">
          <Tooltip content="New Thread" placement="bottom">
            <button onClick={onNewChat} aria-label="New chat"
              className="w-7 h-7 flex items-center justify-center rounded-lg
                text-[#4a3a5a] hover:text-[#c084fc] hover:bg-[#c084fc]/10 transition-all border border-transparent hover:border-[#7c3aed]/20">
              <FontAwesomeIcon icon={faPlus} style={{ fontSize: 10 }} />
            </button>
          </Tooltip>

          <Tooltip content="Session History" placement="bottom">
            <button aria-label="History"
              className="w-7 h-7 flex items-center justify-center rounded-lg
                text-[#4a3a5a] hover:text-[#c084fc] hover:bg-[#c084fc]/10 transition-all border border-transparent hover:border-[#7c3aed]/20">
              <FontAwesomeIcon icon={faHistory} style={{ fontSize: 10 }} />
            </button>
          </Tooltip>

          <Tooltip content="Clear Console" placement="bottom">
            <button onClick={onClearChat} aria-label="Clear chat"
              className="w-7 h-7 flex items-center justify-center rounded-lg
                text-[#4a3a5a] hover:text-[#f87171] hover:bg-[#f87171]/10 transition-all border border-transparent hover:border-red-500/20">
              <FontAwesomeIcon icon={faTrash} style={{ fontSize: 10 }} />
            </button>
          </Tooltip>
        </div>
      </div>
    </div>
  )
}
