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
  history?:       AIMessage[]
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

/** Available models — OpenRouter free + Anthropic + NVIDIA NIM */
export const CLAUDE_MODELS: AIModel[] = [
  // ── OpenRouter (top) ──────────────────────────────────────────────────────
  {
    id:            'openrouter/owl-alpha',
    name:          'Owl Alpha (OpenRouter)',
    contextWindow: 128000,
    maxOutput:     16384,
    description:   'Fast free model via OpenRouter',
  },

  // ── OpenRouter Free models ────────────────────────────────────────────────
  { id: 'nvidia/nemotron-3-super-120b-a12b:free',           name: 'Nemotron 3 Super 120B (free)',        contextWindow: 128000, maxOutput: 8192  },
  { id: 'poolside/laguna-m.1:free',                         name: 'Laguna M.1 (free)',                   contextWindow: 128000, maxOutput: 8192  },
  { id: 'inclusionai/ring-2.6-1t:free',                     name: 'Ring 2.6 1T (free)',                  contextWindow: 128000, maxOutput: 8192  },
  { id: 'openai/gpt-oss-120b:free',                         name: 'GPT OSS 120B (free)',                 contextWindow: 128000, maxOutput: 8192  },
  { id: 'z-ai/glm-4.5-air:free',                            name: 'GLM 4.5 Air (free)',                  contextWindow: 128000, maxOutput: 8192  },
  { id: 'minimax/minimax-m2.5:free',                        name: 'MiniMax M2.5 (free)',                 contextWindow: 128000, maxOutput: 8192  },
  { id: 'nvidia/nemotron-3-nano-30b-a3b:free',              name: 'Nemotron 3 Nano 30B (free)',          contextWindow: 128000, maxOutput: 8192  },
  { id: 'poolside/laguna-xs.2:free',                        name: 'Laguna XS.2 (free)',                  contextWindow: 128000, maxOutput: 8192  },
  { id: 'openai/gpt-oss-20b:free',                          name: 'GPT OSS 20B (free)',                  contextWindow: 128000, maxOutput: 8192  },
  { id: 'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free', name: 'Nemotron Nano Omni 30B Reasoning (free)', contextWindow: 128000, maxOutput: 8192 },
  { id: 'google/gemma-4-31b-it:free',                       name: 'Gemma 4 31B (free)',                  contextWindow: 128000, maxOutput: 8192  },
  { id: 'baidu/cobuddy:free',                               name: 'CoBuddy (free)',                      contextWindow: 128000, maxOutput: 8192  },
  { id: 'nvidia/nemotron-nano-12b-v2-vl:free',              name: 'Nemotron Nano 12B VL (free)',         contextWindow: 128000, maxOutput: 8192  },
  { id: 'nvidia/nemotron-nano-9b-v2:free',                  name: 'Nemotron Nano 9B (free)',             contextWindow: 128000, maxOutput: 8192  },
  { id: 'google/gemma-4-26b-a4b-it:free',                   name: 'Gemma 4 26B MoE (free)',              contextWindow: 128000, maxOutput: 8192  },
  { id: 'qwen/qwen3-coder:free',                            name: 'Qwen3 Coder (free)',                  contextWindow: 128000, maxOutput: 8192  },
  { id: 'nvidia/llama-nemotron-embed-vl-1b-v2:free',        name: 'Llama Nemotron Embed VL 1B (free)',   contextWindow: 128000, maxOutput: 8192  },
  { id: 'qwen/qwen3-next-80b-a3b-instruct:free',            name: 'Qwen3 Next 80B MoE (free)',           contextWindow: 128000, maxOutput: 8192  },
  { id: 'liquid/lfm-2.5-1.2b-thinking:free',                name: 'LFM 2.5 1.2B Thinking (free)',        contextWindow: 128000, maxOutput: 8192  },
  { id: 'meta-llama/llama-3.3-70b-instruct:free',           name: 'Llama 3.3 70B Instruct (free)',       contextWindow: 128000, maxOutput: 8192  },
  { id: 'liquid/lfm-2.5-1.2b-instruct:free',                name: 'LFM 2.5 1.2B Instruct (free)',        contextWindow: 128000, maxOutput: 8192  },
  { id: 'baidu/qianfan-ocr-fast:free',                      name: 'Qianfan OCR Fast (free)',             contextWindow: 128000, maxOutput: 8192  },
  { id: 'arcee-ai/trinity-large-thinking:free',             name: 'Trinity Large Thinking (free)',       contextWindow: 128000, maxOutput: 8192  },
  { id: 'cognitivecomputations/dolphin-mistral-24b-venice-edition:free', name: 'Dolphin Mistral 24B Venice (free)', contextWindow: 128000, maxOutput: 8192 },
  { id: 'meta-llama/llama-3.2-3b-instruct:free',            name: 'Llama 3.2 3B Instruct (free)',        contextWindow: 128000, maxOutput: 8192  },
  { id: 'nousresearch/hermes-3-llama-3.1-405b:free',        name: 'Hermes 3 Llama 3.1 405B (free)',      contextWindow: 128000, maxOutput: 8192  },

  // ── Anthropic ─────────────────────────────────────────────────────────────
  { id: 'claude-opus-4-5',   name: 'Claude Opus 4.5',   contextWindow: 200000, maxOutput: 8192, description: 'Most capable (Anthropic)' },
  { id: 'claude-sonnet-4-5', name: 'Claude Sonnet 4.5', contextWindow: 200000, maxOutput: 8192, description: 'Best balance (Anthropic)' },
  { id: 'claude-haiku-3-5',  name: 'Claude Haiku 3.5',  contextWindow: 200000, maxOutput: 8192, description: 'Fastest (Anthropic)'      },

  // ── NVIDIA NIM ────────────────────────────────────────────────────────────
  { id: 'moonshotai/kimi-k2.6',                    name: 'Kimi K2.6 (NVIDIA NIM)',       contextWindow: 131072, maxOutput: 16384 },
  { id: 'meta/llama-3.1-405b-instruct',            name: 'Llama 3.1 405B (NVIDIA NIM)',  contextWindow: 128000, maxOutput: 4096  },
  { id: 'mistralai/mistral-large-2-instruct',      name: 'Mistral Large 2 (NVIDIA NIM)', contextWindow: 128000, maxOutput: 4096  },
]

export const DEFAULT_AI_MODEL = 'openrouter/owl-alpha'
