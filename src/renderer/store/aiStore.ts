import { create } from 'zustand'
import type { AIConversation, AIMessage, AIStreamChunk, AIStreamEnd } from '../../shared/types/ai.types'

// No immer — Map has proxy issues with immer outside produce()

export interface AIState {
  conversations:           Map<string, AIConversation>
  activeConversationId:    string | null
  isStreaming:             boolean
  streamingConversationId: string | null
  hasApiKey:               boolean
}

export interface AIActions {
  createConversation:    (id: string, model: string) => void
  setActiveConversation: (id: string) => void
  addMessage:            (conversationId: string, message: AIMessage) => void
  appendStreamChunk:     (chunk: AIStreamChunk) => void
  finalizeStream:        (event: AIStreamEnd) => void
  setStreamError:        (conversationId: string, messageId: string, errorCode: string) => void
  setHasApiKey:          (v: boolean) => void
  reset:                 () => void
}

export const useAIStore = create<AIState & AIActions>()((set, get) => ({
  conversations:           new Map(),
  activeConversationId:    null,
  isStreaming:             false,
  streamingConversationId: null,
  hasApiKey:               false,

  createConversation: (id, model) => {
    const next = new Map(get().conversations)
    next.set(id, { id, title: 'New Chat', messages: [], createdAt: Date.now(), updatedAt: Date.now(), model })
    set({ conversations: next, activeConversationId: id })
  },

  setActiveConversation: (id) => set({ activeConversationId: id }),

  addMessage: (conversationId, message) => {
    const next = new Map(get().conversations)
    const conv = next.get(conversationId)
    if (!conv) { return }
    const updated = { ...conv, messages: [...conv.messages, message], updatedAt: Date.now() }
    next.set(conversationId, updated)
    const streaming = message.role === 'assistant' && message.status === 'streaming'
    set({
      conversations: next,
      ...(streaming ? { isStreaming: true, streamingConversationId: conversationId } : {}),
    })
  },

  appendStreamChunk: (chunk) => {
    const next = new Map(get().conversations)
    const conv = next.get(chunk.conversationId)
    if (!conv) { return }
    const messages = conv.messages.map((m) =>
      m.id === chunk.messageId
        ? { ...m, content: m.content + chunk.delta, status: 'streaming' as const }
        : m
    )
    next.set(chunk.conversationId, { ...conv, messages })
    set({ conversations: next })
  },

  finalizeStream: (event) => {
    const next = new Map(get().conversations)
    const conv = next.get(event.conversationId)
    if (conv) {
      const messages = conv.messages.map((m) =>
        m.id === event.messageId
          ? { ...m, status: 'complete' as const, tokenCount: event.totalTokens }
          : m
      )
      next.set(event.conversationId, { ...conv, messages, updatedAt: Date.now() })
    }
    set({ conversations: next, isStreaming: false, streamingConversationId: null })
  },

  setStreamError: (conversationId, messageId, errorCode) => {
    const next = new Map(get().conversations)
    const conv = next.get(conversationId)
    if (conv) {
      const messages = conv.messages.map((m) =>
        m.id === messageId ? { ...m, status: 'error' as const, errorCode } : m
      )
      next.set(conversationId, { ...conv, messages })
    }
    set({ conversations: next, isStreaming: false, streamingConversationId: null })
  },

  setHasApiKey: (v) => set({ hasApiKey: v }),
  reset:        ()  => set({ conversations: new Map(), activeConversationId: null, isStreaming: false, streamingConversationId: null, hasApiKey: false }),
}))
