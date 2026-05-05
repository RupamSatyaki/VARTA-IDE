/** AI / Claude types shared between main and renderer */
import type { EditorContext } from './editor.types'

export type AIRole = 'user' | 'assistant' | 'system'

export type AIMessageStatus = 'pending' | 'streaming' | 'complete' | 'error'

export interface AIMessage {
  id:        string
  role:      AIRole
  content:   string
  status:    AIMessageStatus
  timestamp: number         // unix ms
  tokenCount?: number
  errorCode?:  string       // VartaErrorCode if status === 'error'
}

export interface AIConversation {
  id:        string
  title:     string
  messages:  AIMessage[]
  createdAt: number
  updatedAt: number
  model:     string
}

/**
 * Payload sent from renderer → main via AI:SEND_MESSAGE.
 * NOTE: API key is NOT included — main reads it from encrypted settings.
 */
export interface AISendMessagePayload {
  conversationId: string
  message:        string
  model?:         string
  context?:       EditorContext
  systemPrompt?:  string
}

/**
 * Payload sent from renderer → main via AI:INLINE_HINT.
 * Requests a short inline code suggestion.
 */
export interface AIInlineHintPayload {
  context:    EditorContext
  instruction?: string          // optional user instruction
}

export interface AIInlineHintResult {
  hint:       string
  insertAt:   number            // line number (1-indexed)
  language:   string
}

/** Streamed chunk pushed from main → renderer via AI:STREAM_CHUNK */
export interface AIStreamChunk {
  conversationId: string
  messageId:      string
  delta:          string        // text delta to append
  tokenCount?:    number
}

/** Pushed from main → renderer via AI:STREAM_END */
export interface AIStreamEnd {
  conversationId: string
  messageId:      string
  totalTokens:    number
  stopReason:     string
}

/** Pushed from main → renderer via AI:STREAM_ERROR */
export interface AIStreamError {
  conversationId: string
  messageId:      string
  code:           string        // VartaErrorCode
  message:        string
}

export interface AIModel {
  id:           string          // e.g. 'claude-3-5-sonnet-20241022'
  name:         string          // display name
  contextWindow: number         // max tokens
  maxOutput:    number
  description?: string
}

/** Available Claude models */
export const CLAUDE_MODELS: AIModel[] = [
  {
    id:            'claude-opus-4-5',
    name:          'Claude Opus 4.5',
    contextWindow: 200000,
    maxOutput:     8192,
    description:   'Most capable model for complex tasks'
  },
  {
    id:            'claude-sonnet-4-5',
    name:          'Claude Sonnet 4.5',
    contextWindow: 200000,
    maxOutput:     8192,
    description:   'Best balance of speed and intelligence'
  },
  {
    id:            'claude-haiku-3-5',
    name:          'Claude Haiku 3.5',
    contextWindow: 200000,
    maxOutput:     8192,
    description:   'Fastest model for lightweight tasks'
  }
]

export const DEFAULT_AI_MODEL = 'claude-sonnet-4-5'
