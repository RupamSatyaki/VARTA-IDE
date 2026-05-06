import React, { useEffect, useState, useCallback } from 'react'
import { AIChatToolbar }  from './AIChatToolbar'
import { AIChatMessages } from './AIChatMessages'
import { AIChatInput }    from './AIChatInput'
import { APIKeyPrompt }   from './APIKeyPrompt'
import { useAIStore }     from '../../store/aiStore'
import { useSettingsStore } from '../../store/settingsStore'
import { useAI }          from '../../hooks/useAI'

export function AIChatPanel() {
  const { hasApiKey, conversations, activeConversationId, createConversation } = useAIStore()
  const { settings } = useSettingsStore()
  const { sendMessage, cancelStream } = useAI()
  const [contextLabel, setContextLabel] = useState<string | undefined>()

  // Ensure a conversation exists
  useEffect(() => {
    if (!hasApiKey) { return }
    if (!activeConversationId || !conversations.has(activeConversationId)) {
      const id = `conv-${Date.now()}`
      createConversation(id, settings.ai.model)
    }
  }, [hasApiKey, activeConversationId, conversations, createConversation, settings.ai.model])

  // Listen for AI actions from editor context menu
  useEffect(() => {
    const handler = (e: Event) => {
      const { action, selectedText } = (e as CustomEvent).detail ?? {}
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
  }, [])

  // Listen for apply action
  useEffect(() => {
    const handler = (e: Event) => {
      const { code } = (e as CustomEvent).detail ?? {}
      window.dispatchEvent(new CustomEvent('varta:reveal-in-editor', {
        detail: { applyCode: code },
      }))
    }
    window.addEventListener('varta:ai-apply', handler)
    return () => window.removeEventListener('varta:ai-apply', handler)
  }, [])

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
    // Reset conversation messages
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

  // No API key → show prompt
  if (!hasApiKey) {
    return (
      <div className="flex flex-col h-full bg-[#252526]">
        <div className="px-3 py-2 text-[10px] font-semibold uppercase tracking-widest text-[#6e6e6e] border-b border-[#333333]">
          Varta Intelligence
        </div>
        <APIKeyPrompt onKeySet={() => {}} />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full overflow-hidden bg-[#252526]">
      <AIChatToolbar
        onNewChat={handleNewChat}
        onClearChat={handleClearChat}
      />

      {activeConversationId && (
        <AIChatMessages
          conversationId={activeConversationId}
          onQuickAction={handleSend}
        />
      )}

      <AIChatInput
        onSend={handleSend}
        onCancel={() => activeConversationId && cancelStream(activeConversationId)}
        isStreaming={useAIStore.getState().isStreaming}
        contextLabel={contextLabel}
        onClearContext={() => setContextLabel(undefined)}
      />
    </div>
  )
}
