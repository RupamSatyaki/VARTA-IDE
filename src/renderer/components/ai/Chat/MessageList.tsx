import React, { useEffect, useRef } from 'react'
import { useAIStore } from '../../../store/aiStore'
import { AIChatMessage } from '../AIChatMessage'
import { AIWelcome } from '../AIWelcome'

interface MessageListProps {
  conversationId: string
  onQuickAction?: (text: string) => void
}

export function MessageList({ conversationId, onQuickAction }: MessageListProps) {
  const conversation = useAIStore((s) => s.conversations.get(conversationId))
  const isStreaming = useAIStore((s) => s.isStreaming && s.streamingConversationId === conversationId)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [conversation?.messages.length, isStreaming])

  if (!conversation || conversation.messages.length === 0) {
    return <AIWelcome onQuickAction={onQuickAction} />
  }

  return (
    <div 
      ref={scrollRef}
      className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-[#3a2f45] scroll-smooth"
    >
      <div className="flex flex-col py-4">
        {conversation.messages.map((msg, i) => (
          <AIChatMessage 
            key={msg.id} 
            message={msg} 
            isStreaming={isStreaming && i === conversation.messages.length - 1} 
          />
        ))}
      </div>
    </div>
  )
}
