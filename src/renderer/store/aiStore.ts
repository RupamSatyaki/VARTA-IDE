import { create } from 'zustand'
import type { AIConversation, AIMessage, AIStreamChunk, AIStreamEnd } from '../../shared/types/ai.types'

// No immer — Map has proxy issues with immer outside produce()

export interface AIContextItem {
  type: 'file' | 'selection' | 'terminal' | 'structure'
  label: string
  id: string
}

export interface MCPConfirmation {
  requestId: string
  message: string
  detail?: string
  replyChannel: string
}

export interface AIState {
  conversations:           Map<string, AIConversation>
  activeConversationId:    string | null
  isStreaming:             boolean
  streamingConversationId: string | null
  hasApiKey:               boolean
  currentContext:          AIContextItem[]
  pendingConfirmation:     MCPConfirmation | null
  autoGrant:               boolean
}

export interface AIActions {
  createConversation:    (id: string, model: string) => void
  setActiveConversation: (id: string) => void
  addMessage:            (conversationId: string, message: AIMessage) => void
  appendStreamChunk:     (chunk: AIStreamChunk) => void
  finalizeStream:        (event: AIStreamEnd) => void
  setStreamError:        (conversationId: string, messageId: string, errorCode: string) => void
  setHasApiKey:          (v: boolean) => void
  addContextItem:        (item: AIContextItem) => void
  removeContextItem:     (id: string) => void
  clearContext:          () => void
  reset:                 () => void
  setPendingConfirmation: (conf: MCPConfirmation | null) => void
  setAutoGrant:          (v: boolean) => void
}

export const useAIStore = create<AIState & AIActions>()((set, get) => ({
  conversations:           new Map(),
  activeConversationId:    null,
  isStreaming:             false,
  streamingConversationId: null,
  hasApiKey:               false,
  currentContext:          [],
  pendingConfirmation:     null,
  autoGrant:               false,

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
    const messages = conv.messages.map((m, idx) => {
      // Match by messageId if provided, otherwise update last assistant message
      const match = chunk.messageId
        ? m.id === chunk.messageId
        : idx === conv.messages.length - 1 && m.role === 'assistant'
      return match
        ? { ...m, content: m.content + chunk.delta, status: 'streaming' as const }
        : m
    })
    next.set(chunk.conversationId, { ...conv, messages })
    set({ conversations: next })
  },

  finalizeStream: (event) => {
    const next = new Map(get().conversations)
    const conv = next.get(event.conversationId)
    if (conv) {
      const messages = conv.messages.map((m, idx) => {
        const match = event.messageId
          ? m.id === event.messageId
          : idx === conv.messages.length - 1 && m.role === 'assistant'
        return match
          ? { ...m, status: 'complete' as const, tokenCount: event.totalTokens }
          : m
      })
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

  addContextItem: (item) => {
    const exists = get().currentContext.find((c) => c.id === item.id)
    if (exists) return
    set((s) => ({ currentContext: [...s.currentContext, item] }))
  },

  removeContextItem: (id) => set((s) => ({
    currentContext: s.currentContext.filter((c) => c.id !== id)
  })),

  clearContext: () => set({ currentContext: [] }),

  setPendingConfirmation: (conf) => set({ pendingConfirmation: conf }),

  setAutoGrant: (v) => set({ autoGrant: v }),

  reset:        ()  => set({ 
    conversations: new Map(), 
    activeConversationId: null, 
    isStreaming: false, 
    streamingConversationId: null, 
    hasApiKey: false,
    currentContext: [],
    pendingConfirmation: null,
    autoGrant: false
  }),
}))
