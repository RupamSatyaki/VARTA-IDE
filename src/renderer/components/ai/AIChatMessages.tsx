import React, { useEffect, useRef } from 'react'
import { AIChatMessage } from './AIChatMessage'
import { AIWelcome }     from './AIWelcome'
import { Spinner }       from '../ui/Spinner'
import { useAIStore }    from '../../store/aiStore'

export interface AIChatMessagesProps {
  conversationId: string
  onQuickAction:  (prompt: string) => void
}

export function AIChatMessages({ conversationId, onQuickAction }: AIChatMessagesProps) {
  const { conversations, isStreaming, streamingConversationId } = useAIStore()
  const bottomRef = useRef<HTMLDivElement>(null)

  const conversation = conversations.get(conversationId)
  const messages     = conversation?.messages ?? []

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length, isStreaming])

  if (messages.length === 0) {
    return (
      <div className="flex-1 overflow-y-auto">
        <AIWelcome onAction={onQuickAction} />
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {messages.map((msg) => (
        <AIChatMessage
          key={msg.id}
          message={msg}
          isStreaming={isStreaming && streamingConversationId === conversationId && msg.status === 'streaming'}
        />
      ))}

      {/* Scroll anchor */}
      <div ref={bottomRef} className="h-2" />
    </div>
  )
}
