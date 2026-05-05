import React, { useState } from 'react'
import { Button } from '../ui/Button'
import { isIPCSuccess } from '../../../shared/ipc'
import { useAIStore } from '../../store/aiStore'

export interface APIKeyPromptProps {
  onKeySet: () => void
}

export function APIKeyPrompt({ onKeySet }: APIKeyPromptProps) {
  const [key,     setKey]     = useState('')
  const [saving,  setSaving]  = useState(false)
  const [error,   setError]   = useState('')
  const { setHasApiKey } = useAIStore()

  const handleSave = async () => {
    if (!key.trim()) { setError('Please enter an API key'); return }
    if (!key.startsWith('sk-ant-')) { setError('Key should start with sk-ant-'); return }

    setSaving(true)
    setError('')
    try {
      const res = await window.varta.ai.setApiKey(key.trim())
      if (isIPCSuccess(res)) {
        setHasApiKey(true)
        onKeySet()
      } else {
        setError('Failed to save key')
      }
    } catch {
      setError('Failed to save key')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center h-full px-6 text-center gap-4">
      {/* Icon */}
      <div className="w-12 h-12 rounded-xl bg-[#1b2d3e] flex items-center justify-center">
        <svg width="24" height="24" viewBox="0 0 16 16" fill="currentColor" className="text-[#569cd6]">
          <path d="M8 1l1.5 4.5L14 7l-4.5 1.5L8 13l-1.5-4.5L2 7l4.5-1.5L8 1z"/>
        </svg>
      </div>

      <div>
        <h2 className="text-sm font-semibold text-[#d4d4d4]">Varta Intelligence</h2>
        <p className="text-xs text-[#6e6e6e] mt-1">
          Enter your Anthropic API key to enable AI features
        </p>
      </div>

      <div className="w-full flex flex-col gap-2">
        <input
          type="password"
          value={key}
          onChange={(e) => { setKey(e.target.value); setError('') }}
          onKeyDown={(e) => e.key === 'Enter' && handleSave()}
          placeholder="sk-ant-..."
          autoFocus
          className="w-full h-8 px-3 text-sm bg-[#3c3c3c] text-[#d4d4d4] border border-[#3c3c3c] focus:border-[#569cd6] rounded outline-none placeholder:text-[#6e6e6e]"
        />
        {error && <p className="text-xs text-[#f44747]">{error}</p>}
        <Button variant="primary" size="sm" onClick={handleSave} loading={saving} className="w-full">
          Save API Key
        </Button>
      </div>

      <button
        onClick={() => window.varta.app.openExternal('https://console.anthropic.com/').catch(() => {})}
        className="text-xs text-[#569cd6] hover:text-[#4fc1ff] transition-colors"
      >
        Get an API key at console.anthropic.com →
      </button>
    </div>
  )
}
