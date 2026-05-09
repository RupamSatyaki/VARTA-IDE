import React, { useEffect, useCallback } from 'react'
import { AIChatToolbar }  from './AIChatToolbar'
import { MessageList }    from './Chat/MessageList'
import { ChatInput }       from './Input/ChatInput'
import { APIKeyPrompt }   from './APIKeyPrompt'
import { useAIStore }     from '../../store/aiStore'
import { useSettingsStore } from '../../store/settingsStore'
import { useAI }          from '../../hooks/useAI'

export function AIChatPanel() {
  const { 
    hasApiKey, 
    conversations, 
    activeConversationId, 
    createConversation, 
    isStreaming,
    addContextItem
  } = useAIStore()
  const { settings } = useSettingsStore()
  const { sendMessage, cancelStream } = useAI()

  useEffect(() => {
    if (!hasApiKey) { return }
    if (!activeConversationId || !conversations.has(activeConversationId)) {
      const id = `conv-${Date.now()}`
      createConversation(id, settings.ai.model)
    }
  }, [hasApiKey, activeConversationId, conversations, createConversation, settings.ai.model])

  useEffect(() => {
    const handler = (e: Event) => {
      const { action, selectedText, fileName } = (e as CustomEvent).detail ?? {}
      
      // Auto-add context if selection or file is involved
      if (fileName) {
        addContextItem({ type: 'file', label: fileName, id: `file-${fileName}` })
      }
      if (selectedText) {
        addContextItem({ type: 'selection', label: 'Selected Code', id: 'selection-current' })
      }

      const prompts: Record<string, string> = {
        explain:  `Explain this code:\n\`\`\`\n${selectedText}\n\`\`\``,
        fix:      `Fix any errors in this code:\n\`\`\`\n${selectedText}\n\`\`\``,
        refactor: `Refactor this code for better readability:\n\`\`\`\n${selectedText}\n\`\`\``,
        tests:    `Write unit tests for this code:\n\`\`\`\n${selectedText}\n\`\`\``,
        docs:     `Generate JSDoc documentation for this code:\n\`\`\`\n${selectedText}\n\`\`\``,
      }
      const prompt = prompts[action]
      if (prompt) { handleSend(prompt) }
    }
    window.addEventListener('varta:ai-action', handler)
    return () => window.removeEventListener('varta:ai-action', handler)
  }, [addContextItem])

  const handleSend = useCallback((text: string) => {
    if (!activeConversationId) { return }
    sendMessage(text, activeConversationId)
  }, [activeConversationId, sendMessage])

  const handleNewChat = useCallback(() => {
    const id = `conv-${Date.now()}`
    createConversation(id, settings.ai.model)
  }, [createConversation, settings.ai.model])

  const handleClearChat = useCallback(() => {
    if (!activeConversationId) { return }
    useAIStore.setState((s) => {
      const conv = s.conversations.get(activeConversationId)
      if (conv) {
        const next = new Map(s.conversations)
        next.set(activeConversationId, { ...conv, messages: [] })
        return { conversations: next }
      }
      return s
    })
  }, [activeConversationId])

  if (!hasApiKey) {
    return (
      <div className="flex flex-col h-full bg-[#1a1620]">
        <div className="px-4 py-3 text-[11px] font-bold uppercase tracking-[0.2em] text-[#7c5a9a] border-b border-[#2a1f30] bg-[#1a1620]/50 backdrop-blur-xl">
          Varta Intelligence
        </div>
        <div className="flex-1 overflow-y-auto">
          <APIKeyPrompt onKeySet={() => {}} />
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full overflow-hidden bg-[#1a1620] shadow-2xl">
      <AIChatToolbar onNewChat={handleNewChat} onClearChat={handleClearChat} />

      {activeConversationId && (
        <MessageList conversationId={activeConversationId} onQuickAction={handleSend} />
      )}

      <ChatInput
        onSend={handleSend}
        onCancel={() => activeConversationId && cancelStream(activeConversationId)}
        isStreaming={isStreaming}
      />
    </div>
  )
}
