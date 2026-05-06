import React from 'react'
import { IconButton } from '../ui/IconButton'
import { Select } from '../ui/Select'
import { useAIStore } from '../../store/aiStore'
import { useSettingsStore } from '../../store/settingsStore'

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
    <div className="flex items-center justify-between px-3 h-9 border-b border-[#333333] shrink-0">
      <div className="flex items-center gap-1.5">
        <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" className="text-[#569cd6]">
          <path d="M8 1l1.5 4.5L14 7l-4.5 1.5L8 13l-1.5-4.5L2 7l4.5-1.5L8 1z"/>
        </svg>
        <span className="text-xs font-semibold text-[#d4d4d4]">Varta Intelligence</span>

        {isStreaming && (
          <div className="flex items-center gap-0.5 ml-1">
            {[0, 1, 2].map((i) => (
              <span key={i} className="w-1 h-1 rounded-full bg-[#569cd6] animate-bounce"
                style={{ animationDelay: `${i * 150}ms` }} />
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center gap-1">
        {/* Model selector */}
        <Select
          value={settings.ai.model}
          options={MODEL_OPTIONS}
          onChange={(e) => {
            const v = e.target.value
            update({ ai: { ...settings.ai, model: v } })
            window.varta.settings.set({ ai: { model: v } }).catch(() => {})
          }}
          className="h-6 text-[10px] w-40 border-transparent bg-transparent"
        />

        <IconButton tooltip="New Chat" size="sm" onClick={onNewChat} aria-label="New chat">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
            <path d="M11 5H7V1H5v4H1v2h4v4h2V7h4z"/>
          </svg>
        </IconButton>

        <IconButton tooltip="Clear Chat" size="sm" onClick={onClearChat} aria-label="Clear chat">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
            <path d="M8 2h2v1H2V2h2V1h4v1zM3 4h6l-.5 7h-5L3 4zm1 1l.4 5h.2L5 5H4zm2 0v5h1V5H6zm2 0-.4 5h.2L8.6 5H8z"/>
          </svg>
        </IconButton>
      </div>
    </div>
  )
}
