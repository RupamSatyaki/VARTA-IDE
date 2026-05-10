import React from 'react'
import { AIModelSelector } from './AIModelSelector'
import { useAIStore } from '../../store/aiStore'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faWandMagicSparkles, faPlus, faTrash } from '@fortawesome/free-solid-svg-icons'
import { Tooltip } from '../ui/Tooltip'

export interface AIChatToolbarProps {
  onNewChat:   () => void
  onClearChat: () => void
}

export function AIChatToolbar({ onNewChat, onClearChat }: AIChatToolbarProps) {
  const { isStreaming } = useAIStore()

  return (
    <div className="flex items-center justify-between px-3 h-10 border-b border-[#2a1f30] shrink-0">
      {/* Left: icon + title + streaming */}
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-lg flex items-center justify-center
          bg-gradient-to-br from-[#7c3aed] to-[#a855f7]">
          <FontAwesomeIcon icon={faWandMagicSparkles} style={{ fontSize: 10 }} className="text-white" />
        </div>
        <span className="text-[12px] font-semibold text-[#cccccc]">Varta AI</span>

        {isStreaming && (
          <div className="flex items-center gap-0.5 ml-1">
            {[0, 1, 2].map((i) => (
              <span key={i} className="w-1 h-1 rounded-full bg-[#c084fc] animate-bounce"
                style={{ animationDelay: `${i * 150}ms` }} />
            ))}
          </div>
        )}
      </div>

      {/* Right: model selector + actions */}
      <div className="flex items-center gap-1">
        <AIModelSelector />

        <Tooltip content="New Chat" placement="bottom">
          <button onClick={onNewChat} aria-label="New chat"
            className="w-6 h-6 flex items-center justify-center rounded-md
              text-[#5a4a6a] hover:text-[#cccccc] hover:bg-white/5 transition-all">
            <FontAwesomeIcon icon={faPlus} style={{ fontSize: 11 }} />
          </button>
        </Tooltip>

        <Tooltip content="Clear Chat" placement="bottom">
          <button onClick={onClearChat} aria-label="Clear chat"
            className="w-6 h-6 flex items-center justify-center rounded-md
              text-[#5a4a6a] hover:text-[#f87171] hover:bg-white/5 transition-all">
            <FontAwesomeIcon icon={faTrash} style={{ fontSize: 11 }} />
          </button>
        </Tooltip>
      </div>
    </div>
  )
}
