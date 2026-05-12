import React, { useEffect, useCallback } from 'react'
import { AIChatToolbar }  from './AIChatToolbar'
import { MessageList }    from './Chat/MessageList'
import { ChatInput }       from './Input/ChatInput'
import { APIKeyPrompt }   from './APIKeyPrompt'
import { AIWelcome }      from './AIWelcome'
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
    addContextItem,
    autoGrant,
    setPendingConfirmation
  } = useAIStore()
  const { settings } = useSettingsStore()
  const { sendMessage, cancelStream } = useAI()

  useEffect(() => {
    // Listen for MCP tool confirmations
    const unlisten = window.varta.mcp.onConfirmRequest((data) => {
      if (autoGrant) {
        window.varta.mcp.confirmReply(data.replyChannel, true)
      } else {
        setPendingConfirmation(data)
      }
    })
    return () => unlisten()
  }, [autoGrant, setPendingConfirmation])

  useEffect(() => {
    if (!hasApiKey) { return }
    const exists = activeConversationId && conversations.has(activeConversationId)
    if (!exists) {
      const id = `conv-${Date.now()}`
      createConversation(id, settings.ai.model)
    }
  }, [hasApiKey, activeConversationId, conversations.size, createConversation, settings.ai.model])

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
    const currentId = useAIStore.getState().activeConversationId
    if (!currentId) return
    sendMessage(text, currentId)
  }, [sendMessage])

  const handleNewChat = useCallback(() => {
    const id = `conv-${Date.now()}`
    createConversation(id, settings.ai.model)
  }, [createConversation, settings.ai.model])

  const handleClearChat = useCallback(() => {
    const currentId = useAIStore.getState().activeConversationId
    if (!currentId) return
    useAIStore.setState((s) => {
      const conv = s.conversations.get(currentId)
      if (conv) {
        const next = new Map(s.conversations)
        next.set(currentId, { ...conv, messages: [] })
        return { conversations: next }
      }
      return s
    })
  }, [])

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

  const currentConv = activeConversationId ? conversations.get(activeConversationId) : null
  const hasMessages = currentConv && currentConv.messages.length > 0

  return (
    <div className="flex flex-col h-full overflow-hidden bg-[#1a1620] shadow-2xl">
      <AIChatToolbar onNewChat={handleNewChat} onClearChat={handleClearChat} />

      <div className="flex-1 overflow-hidden">
        {hasMessages ? (
          <MessageList conversationId={activeConversationId!} onQuickAction={handleSend} />
        ) : (
          <AIWelcome onQuickAction={handleSend} />
        )}
      </div>

      <ChatInput
        onSend={handleSend}
        onCancel={() => activeConversationId && cancelStream(activeConversationId)}
        isStreaming={isStreaming}
      />
    </div>
  )
}
