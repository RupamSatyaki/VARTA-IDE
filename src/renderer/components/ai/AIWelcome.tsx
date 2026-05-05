import React from 'react'

const QUICK_ACTIONS = [
  { label: 'Explain this file',           prompt: 'Explain what this file does and its main purpose.' },
  { label: 'Find bugs in selection',      prompt: 'Find any bugs or issues in the selected code.' },
  { label: 'Write tests',                 prompt: 'Write unit tests for the selected function.' },
  { label: 'Generate documentation',      prompt: 'Generate JSDoc documentation for the selected code.' },
  { label: 'Refactor this code',          prompt: 'Refactor the selected code to improve readability and performance.' },
]

export interface AIWelcomeProps {
  onAction: (prompt: string) => void
}

export function AIWelcome({ onAction }: AIWelcomeProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full px-4 gap-5 text-center">
      <div className="w-12 h-12 rounded-xl bg-[#1b2d3e] flex items-center justify-center">
        <svg width="24" height="24" viewBox="0 0 16 16" fill="currentColor" className="text-[#569cd6]">
          <path d="M8 1l1.5 4.5L14 7l-4.5 1.5L8 13l-1.5-4.5L2 7l4.5-1.5L8 1z"/>
        </svg>
      </div>

      <div>
        <h2 className="text-sm font-semibold text-[#d4d4d4]">How can I help?</h2>
        <p className="text-xs text-[#6e6e6e] mt-1">
          I have context of your active file and selection
        </p>
      </div>

      <div className="flex flex-col gap-1.5 w-full">
        {QUICK_ACTIONS.map((a) => (
          <button
            key={a.label}
            onClick={() => onAction(a.prompt)}
            className="text-left text-xs px-3 py-2 rounded border border-[#333333] text-[#d4d4d4] hover:bg-[#2a2d2e] hover:border-[#569cd6] transition-colors"
          >
            {a.label}
          </button>
        ))}
      </div>
    </div>
  )
}
