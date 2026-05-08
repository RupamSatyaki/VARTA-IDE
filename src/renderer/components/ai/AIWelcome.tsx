import React from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faWandMagicSparkles, faChevronRight } from '@fortawesome/free-solid-svg-icons'

const QUICK_ACTIONS = [
  { label: 'Explain this file',      prompt: 'Explain what this file does and its main purpose.' },
  { label: 'Find bugs in selection', prompt: 'Find any bugs or issues in the selected code.' },
  { label: 'Write tests',            prompt: 'Write unit tests for the selected function.' },
  { label: 'Generate docs',          prompt: 'Generate JSDoc documentation for the selected code.' },
  { label: 'Refactor code',          prompt: 'Refactor the selected code to improve readability and performance.' },
]

export interface AIWelcomeProps {
  onAction: (prompt: string) => void
}

export function AIWelcome({ onAction }: AIWelcomeProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full px-4 gap-6 text-center select-none">
      {/* Icon */}
      <div className="relative">
        <div className="absolute inset-0 rounded-2xl bg-[#7c3aed]/20 blur-xl scale-110" />
        <div className="relative w-14 h-14 rounded-2xl flex items-center justify-center
          bg-gradient-to-br from-[#7c3aed] to-[#a855f7]
          shadow-[0_8px_32px_rgba(124,58,237,0.4)]">
          <FontAwesomeIcon icon={faWandMagicSparkles} style={{ fontSize: 22 }} className="text-white" />
        </div>
      </div>

      <div>
        <h2 className="text-[14px] font-bold text-[#cccccc]">Varta Intelligence</h2>
        <p className="text-[11px] text-[#5a4a6a] mt-1 leading-relaxed">
          AI assistant with full editor context.<br/>Ask anything about your code.
        </p>
      </div>

      {/* Quick actions */}
      <div className="flex flex-col gap-1.5 w-full">
        {QUICK_ACTIONS.map((a) => (
          <button
            key={a.label}
            onClick={() => onAction(a.prompt)}
            className="flex items-center justify-between text-left text-[11px] px-3 py-2 rounded-lg
              border border-[#3a2f45] text-[#9090b0]
              hover:bg-[#7c3aed]/10 hover:border-[#7c3aed]/40 hover:text-[#cccccc]
              transition-all duration-150 group"
          >
            <span>{a.label}</span>
            <FontAwesomeIcon icon={faChevronRight} style={{ fontSize: 9 }}
              className="text-[#3a2f45] group-hover:text-[#7c3aed] transition-colors" />
          </button>
        ))}
      </div>
    </div>
  )
}
