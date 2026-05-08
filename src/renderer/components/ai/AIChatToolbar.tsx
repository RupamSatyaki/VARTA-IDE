import React from 'react'
import { Select } from '../ui/Select'
import { useAIStore } from '../../store/aiStore'
import { useSettingsStore } from '../../store/settingsStore'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faWandMagicSparkles, faPlus, faTrash } from '@fortawesome/free-solid-svg-icons'
import { Tooltip } from '../ui/Tooltip'

const MODEL_OPTIONS = [
  { value: 'claude-opus-4-5',                    label: 'Claude Opus 4.5' },
  { value: 'claude-sonnet-4-5',                  label: 'Claude Sonnet 4.5' },
  { value: 'claude-haiku-3-5',                   label: 'Claude Haiku 3.5' },
  { value: 'moonshotai/kimi-k2.6',               label: 'Kimi K2.6 (NIM)' },
  { value: 'meta/llama-3.1-405b-instruct',       label: 'Llama 3.1 405B (NIM)' },
  { value: 'mistralai/mistral-large-2-instruct', label: 'Mistral Large 2 (NIM)' },
]

export interface AIChatToolbarProps {
  onNewChat:   () => void
  onClearChat: () => void
}

export function AIChatToolbar({ onNewChat, onClearChat }: AIChatToolbarProps) {
  const { isStreaming } = useAIStore()
  const { settings, update } = useSettingsStore()

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
        <Select
          value={settings.ai.model}
          options={MODEL_OPTIONS}
          onChange={(e) => {
            const v = e.target.value
            update({ ai: { ...settings.ai, model: v } })
            window.varta.settings.set({ ai: { model: v } }).catch(() => {})
          }}
          className="h-6 text-[10px] w-36 border-transparent bg-transparent text-[#6e5a7a]"
        />

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
