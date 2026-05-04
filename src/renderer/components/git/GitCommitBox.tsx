import React, { useState, useRef } from 'react'
import { cn } from '../../utils/cn'
import { Button } from '../ui/Button'
import { Spinner } from '../ui/Spinner'
import { useGitStore } from '../../store/gitStore'

export interface GitCommitBoxProps {
  stagedCount:  number
  onCommit:     (message: string) => Promise<void>
  onGenerateAI: () => Promise<void>
  hasApiKey:    boolean
}

export function GitCommitBox({ stagedCount, onCommit, onGenerateAI, hasApiKey }: GitCommitBoxProps) {
  const [message, setMessage]       = useState('')
  const [committing, setCommitting] = useState(false)
  const [generating, setGenerating] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const canCommit = message.trim().length >= 3 && stagedCount > 0

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && canCommit) {
      e.preventDefault()
      handleCommit()
    }
  }

  const handleCommit = async () => {
    if (!canCommit) { return }
    setCommitting(true)
    try {
      await onCommit(message.trim())
      setMessage('')
    } finally {
      setCommitting(false)
    }
  }

  const handleGenerateAI = async () => {
    setGenerating(true)
    try {
      await onGenerateAI()
      // Message will be set by parent via gitStore
    } finally {
      setGenerating(false)
    }
  }

  // Sync generated message from store
  const { generatedMessage } = useGitStore()
  React.useEffect(() => {
    if (generatedMessage) {
      setMessage(generatedMessage)
      textareaRef.current?.focus()
    }
  }, [generatedMessage])

  return (
    <div className="px-2 py-2 border-b border-[#333333]">
      <textarea
        ref={textareaRef}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Message (Ctrl+Enter to commit)"
        rows={3}
        spellCheck={false}
        className={cn(
          'w-full px-2 py-1.5 text-xs bg-[#3c3c3c] text-[#d4d4d4]',
          'border border-[#3c3c3c] focus:border-[#569cd6] rounded outline-none resize-none',
          'placeholder:text-[#6e6e6e]',
        )}
      />

      <div className="flex items-center gap-1.5 mt-1.5">
        {/* AI generate button */}
        {hasApiKey && (
          <button
            onClick={handleGenerateAI}
            disabled={generating}
            className="flex items-center gap-1 text-[10px] text-[#569cd6] hover:text-[#4fc1ff] disabled:opacity-40 transition-colors"
            title="Generate commit message with AI"
          >
            {generating ? <Spinner size="sm" /> : <SparkleIcon />}
            Generate
          </button>
        )}

        <div className="flex-1" />

        {/* Staged count */}
        {stagedCount > 0 && (
          <span className="text-[10px] text-[#6e6e6e]">
            {stagedCount} file{stagedCount !== 1 ? 's' : ''}
          </span>
        )}

        {/* Commit button */}
        <Button
          variant="primary"
          size="sm"
          onClick={handleCommit}
          disabled={!canCommit}
          loading={committing}
          className="text-xs"
        >
          Commit
        </Button>
      </div>
    </div>
  )
}

const SparkleIcon = () => (
  <svg width="10" height="10" viewBox="0 0 16 16" fill="currentColor">
    <path d="M8 1l1.5 4.5L14 7l-4.5 1.5L8 13l-1.5-4.5L2 7l4.5-1.5L8 1z"/>
  </svg>
)
