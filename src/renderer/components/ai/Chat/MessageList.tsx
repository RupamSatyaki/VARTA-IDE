import React, { useEffect, useRef } from 'react'
import { useAIStore } from '../../../store/aiStore'
import { AIChatMessage } from '../AIChatMessage'
import { AIWelcome } from '../AIWelcome'
import { motion, AnimatePresence } from 'framer-motion'

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
    return null
  }

  return (
    <div 
      ref={scrollRef}
      className="flex-1 h-full overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-[#3a2f45] scroll-smooth"
    >
      <div className="flex flex-col py-4">
        <AnimatePresence initial={false}>
          {conversation.messages.map((msg, i) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              <AIChatMessage 
                message={msg} 
                isStreaming={isStreaming && i === conversation.messages.length - 1} 
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}
