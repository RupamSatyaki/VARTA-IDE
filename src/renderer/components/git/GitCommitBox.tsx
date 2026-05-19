import React, { useState, useRef } from 'react'
import { cn } from '../../utils/cn'
import { useGitStore } from '../../store/gitStore'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faWandMagicSparkles, faCheck, faArrowUp } from '@fortawesome/free-solid-svg-icons'

export interface GitCommitBoxProps {
  stagedCount:  number
  onCommit:     (message: string) => Promise<void>
  onCommitPush: (message: string) => Promise<void>
  onGenerateAI: () => Promise<void>
  hasApiKey:    boolean
}

export function GitCommitBox({ stagedCount, onCommit, onCommitPush, onGenerateAI, hasApiKey }: GitCommitBoxProps) {
  const [message, setMessage]       = useState('')
  const [committing, setCommitting] = useState(false)
  const [pushing, setPushing]       = useState(false)
  const [generating, setGenerating] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const canCommit = message.trim().length >= 3 && stagedCount > 0

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && canCommit) {
      e.preventDefault(); handleCommit()
    }
  }

  const handleCommit = async () => {
    if (!canCommit) { return }
    setCommitting(true)
    try { await onCommit(message.trim()); setMessage('') }
    finally { setCommitting(false) }
  }

  const handleCommitPush = async () => {
    if (!canCommit) { return }
    setPushing(true)
    try { await onCommitPush(message.trim()); setMessage('') }
    finally { setPushing(false) }
  }

  const handleGenerateAI = async () => {
    setGenerating(true)
    try { await onGenerateAI() }
    finally { setGenerating(false) }
  }

  const { generatedMessage } = useGitStore()
  React.useEffect(() => {
    if (generatedMessage) { setMessage(generatedMessage); textareaRef.current?.focus() }
  }, [generatedMessage])

  return (
    <div className="px-3 py-2.5 border-b border-varta-border">
      {/* Textarea */}
      <div className={cn(
        'rounded-lg border transition-all duration-150 bg-varta-bg-secondary',
        message.length > 0 ? 'border-varta-accent/50' : 'border-varta-border focus-within:border-varta-accent/50',
      )}>
        <textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Commit message (Ctrl+Enter to commit)"
          rows={3}
          spellCheck={false}
          className="w-full px-2.5 py-2 text-[12px] bg-transparent text-varta-text
            outline-none resize-none placeholder:text-varta-text-faint leading-relaxed"
        />
      </div>

      {/* AI generate */}
      {hasApiKey && (
        <button
          onClick={handleGenerateAI}
          disabled={generating}
          className="flex items-center gap-1.5 text-[10px] text-varta-accent hover:text-varta-accent-hover
            disabled:opacity-40 transition-colors mt-1.5"
        >
          <FontAwesomeIcon icon={faWandMagicSparkles} style={{ fontSize: 10 }}
            className={generating ? 'animate-pulse' : ''} />
          {generating ? 'Generating…' : 'Generate with AI'}
        </button>
      )}

      {/* Buttons row */}
      <div className="flex items-center gap-2 mt-2">
        {stagedCount > 0 && (
          <span className="text-[10px] text-varta-text-faint">{stagedCount} staged</span>
        )}
        <div className="flex-1" />

        {/* Commit only */}
        <button
          onClick={handleCommit}
          disabled={!canCommit || committing || pushing}
          className={cn(
            'flex items-center gap-1.5 px-3 h-7 text-[11px] font-medium rounded-lg transition-all duration-150',
            canCommit && !committing && !pushing
              ? 'bg-varta-accent/20 border border-varta-accent/40 text-varta-accent hover:bg-varta-accent/40 hover:text-white'
              : 'bg-varta-bg-secondary border border-varta-border text-varta-text-faint cursor-not-allowed',
          )}
        >
          <FontAwesomeIcon icon={faCheck} style={{ fontSize: 10 }} />
          {committing ? 'Committing…' : 'Commit'}
        </button>

        {/* Commit & Push */}
        <button
          onClick={handleCommitPush}
          disabled={!canCommit || committing || pushing}
          className={cn(
            'flex items-center gap-1.5 px-3 h-7 text-[11px] font-medium rounded-lg transition-all duration-150',
            canCommit && !committing && !pushing
              ? 'bg-varta-accent/40 border border-varta-accent/60 text-white hover:bg-varta-accent/60'
              : 'bg-varta-bg-secondary border border-varta-border text-varta-text-faint cursor-not-allowed',
          )}
        >
          <FontAwesomeIcon icon={faArrowUp} style={{ fontSize: 10 }} />
          {pushing ? 'Pushing…' : 'Commit & Push'}
        </button>
      </div>
    </div>
  )
}
