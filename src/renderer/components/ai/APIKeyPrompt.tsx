import React, { useState } from 'react'
import { isIPCSuccess } from '../../../shared/ipc'
import { useAIStore } from '../../store/aiStore'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faKey, faArrowRight } from '@fortawesome/free-solid-svg-icons'

export interface APIKeyPromptProps {
  onKeySet: () => void
}

export function APIKeyPrompt({ onKeySet }: APIKeyPromptProps) {
  const [key,    setKey]    = useState('')
  const [saving, setSaving] = useState(false)
  const [error,  setError]  = useState('')
  const { setHasApiKey } = useAIStore()

  const handleSave = async () => {
    if (!key.trim()) { setError('Please enter an API key'); return }
    setSaving(true); setError('')
    try {
      const res = await window.varta.ai.setApiKey(key.trim())
      if (isIPCSuccess(res)) { setHasApiKey(true); onKeySet() }
      else { setError('Failed to save key') }
    } catch { setError('Failed to save key') }
    finally { setSaving(false) }
  }

  return (
    <div className="flex flex-col items-center justify-center h-full px-5 text-center gap-5 select-none">
      {/* Icon */}
      <div className="relative">
        <div className="absolute inset-0 rounded-2xl bg-[#7c3aed]/20 blur-xl scale-110" />
        <div className="relative w-14 h-14 rounded-2xl flex items-center justify-center
          bg-gradient-to-br from-[#7c3aed] to-[#a855f7]
          shadow-[0_8px_32px_rgba(124,58,237,0.4)]">
          <FontAwesomeIcon icon={faKey} style={{ fontSize: 20 }} className="text-white" />
        </div>
      </div>

      <div>
        <h2 className="text-[13px] font-bold text-[#cccccc]">Varta Intelligence</h2>
        <p className="text-[11px] text-[#5a4a6a] mt-1 leading-relaxed">
          Enter your API key to enable<br/>AI-powered coding assistance
        </p>
      </div>

      <div className="w-full flex flex-col gap-2">
        <div className={`flex items-center rounded-lg border bg-[#1e1a24] transition-all duration-150
          ${error ? 'border-[#f87171]' : 'border-[#3a2f45] focus-within:border-[#7c3aed]/50'}`}>
          <FontAwesomeIcon icon={faKey} style={{ fontSize: 11 }} className="ml-3 text-[#5a4a6a] shrink-0" />
          <input
            type="password"
            value={key}
            onChange={(e) => { setKey(e.target.value); setError('') }}
            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            placeholder="sk-ant-... or nvapi-..."
            autoFocus
            className="flex-1 h-9 px-2.5 text-[12px] bg-transparent text-[#cccccc]
              outline-none placeholder:text-[#4a3a5a]"
          />
        </div>

        {error && <p className="text-[10px] text-[#f87171] text-left px-1">{error}</p>}

        <button
          onClick={handleSave}
          disabled={saving || !key.trim()}
          className="flex items-center justify-center gap-2 w-full h-9 rounded-lg text-[12px] font-medium
            bg-[#7c3aed]/30 border border-[#7c3aed]/50 text-[#c084fc]
            hover:bg-[#7c3aed]/50 hover:text-white
            disabled:opacity-40 disabled:cursor-not-allowed
            transition-all duration-150"
        >
          {saving ? 'Saving…' : 'Save API Key'}
          {!saving && <FontAwesomeIcon icon={faArrowRight} style={{ fontSize: 10 }} />}
        </button>
      </div>

      <button
        onClick={() => window.varta.app.openExternal('https://console.anthropic.com/').catch(() => {})}
        className="text-[10px] text-[#5a4a6a] hover:text-[#c084fc] transition-colors"
      >
        Get Anthropic key → console.anthropic.com
      </button>
    </div>
  )
}
