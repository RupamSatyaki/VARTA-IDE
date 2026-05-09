import Anthropic        from '@anthropic-ai/sdk'
import axios            from 'axios'
import { BrowserWindow, app } from 'electron'
import { AIChannel }    from '../../shared/ipc'
import type {
  AISendMessagePayload, AIInlineHintPayload,
  AIInlineHintResult,
} from '../../shared/types/ai.types'
import { VartaError, VartaErrorCode } from '../../shared/errors'
import { logger } from '../utils/logger'
import { contextManager } from './ai/ContextManager'
import { promptEngine }   from './ai/PromptEngine'

// ── Detect provider from baseUrl ──────────────────────────────────────────────
function isNvidiaEndpoint(baseUrl?: string): boolean {
  return !!baseUrl?.includes('nvidia.com') || !!baseUrl?.includes('integrate.api')
}

function isOpenAICompatible(baseUrl?: string): boolean {
  if (!baseUrl?.trim()) { return false }
  // Anthropic's own domain → use Anthropic SDK
  if (baseUrl.includes('anthropic.com')) { return false }
  // Everything else with a custom baseUrl → treat as OpenAI-compatible
  return true
}

export class AIService {
  private mainWindow:    BrowserWindow | null = null
  private cancelledIds = new Set<string>()

  init(mainWindow: BrowserWindow): void {
    this.mainWindow = mainWindow
    logger.info('AIService', 'Initialized')
  }

  destroy(): void {
    this.cancelledIds.clear()
    this.mainWindow = null
    logger.info('AIService', 'Destroyed')
  }

  // ── Send message (streaming) ──────────────────────────────────────────────

  async sendMessage(
    payload:     AISendMessagePayload,
    apiKey:      string,
    webContents: Electron.WebContents,
    baseUrl?:    string,
  ): Promise<void> {
    if (!apiKey?.trim()) {
      throw new VartaError(VartaErrorCode.AI_NO_API_KEY, 'No API key configured')
    }

    // 1. Gather rich context
    const rootPath = (app as any).varta_workspaceRoot ?? process.cwd()
    const ideContext = await contextManager.gatherContext(
      rootPath,
      payload.context?.activeFilePath,
      payload.context?.selectedText
    )

    // 2. Build perfect system prompt
    const systemPrompt = promptEngine.buildSystemPrompt(ideContext)
    
    // 3. Delegate to specific provider
    if (isOpenAICompatible(baseUrl)) {
      return this.sendMessageOpenAI(payload, apiKey, webContents, systemPrompt, baseUrl!)
    }
    return this.sendMessageAnthropic(payload, apiKey, webContents, systemPrompt, baseUrl)
  }

  // ── Anthropic streaming ───────────────────────────────────────────────────

  private async sendMessageAnthropic(
    payload:     AISendMessagePayload,
    apiKey:      string,
    webContents: Electron.WebContents,
    systemPrompt: string,
    baseUrl?:    string,
  ): Promise<void> {
    const clientOptions: ConstructorParameters<typeof Anthropic>[0] = { apiKey }
    if (baseUrl?.trim()) { clientOptions.baseURL = baseUrl.trim() }
    const client = new Anthropic(clientOptions)

    const { conversationId, message } = payload
    this.cancelledIds.delete(conversationId)

    try {
      const stream = await client.messages.stream({
        model:      payload.model ?? 'claude-sonnet-4-5',
        max_tokens: 4096,
        system:     systemPrompt,
        messages:   [{ role: 'user', content: message }],
      })
// ... rest of the logic ...

      for await (const chunk of stream) {
        if (this.cancelledIds.has(conversationId)) { break }
        if (
          chunk.type === 'content_block_delta' &&
          chunk.delta.type === 'text_delta'
        ) {
          if (!webContents.isDestroyed()) {
            webContents.send(AIChannel.STREAM_CHUNK, { conversationId, delta: chunk.delta.text })
          }
        }
      }

      if (!this.cancelledIds.has(conversationId)) {
        const final = await stream.finalMessage()
        if (!webContents.isDestroyed()) {
          webContents.send(AIChannel.STREAM_END, {
            conversationId,
            messageId:   '',
            totalTokens: final.usage.output_tokens,
            stopReason:  final.stop_reason ?? 'end_turn',
          })
        }
      }
    } catch (e) {
      const err = VartaError.from(e, VartaErrorCode.AI_REQUEST_FAILED)
      if (!webContents.isDestroyed()) {
        webContents.send(AIChannel.STREAM_ERROR, { conversationId, messageId: '', code: err.code, message: err.message })
      }
      throw err
    } finally {
      this.cancelledIds.delete(conversationId)
    }
  }

  // ── OpenAI-compatible streaming (NVIDIA NIM, OpenRouter, etc.) ────────────

  private async sendMessageOpenAI(
    payload:     AISendMessagePayload,
    apiKey:      string,
    webContents: Electron.WebContents,
    baseUrl:     string,
  ): Promise<void> {
    const { conversationId, message, context } = payload
    this.cancelledIds.delete(conversationId)
    const systemPrompt = buildSystemPrompt(context)

    // Build correct URL
    const base = baseUrl.replace(/\/+$/, '')
    const url  = base.endsWith('/chat/completions')
      ? base
      : `${base}/chat/completions`

    logger.info('AIService', `OpenAI-compat POST → ${url} | model: ${payload.model ?? 'moonshotai/kimi-k2.6'}`)

    try {
      const response = await axios.post(
        url,
        {
          model:       payload.model ?? 'moonshotai/kimi-k2.6',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user',   content: message },
          ],
          max_tokens:  4096,
          temperature: 0.6,
          top_p:       0.95,
          stream:      true,
        },
        {
          headers: {
            Authorization:  `Bearer ${apiKey}`,
            Accept:         'text/event-stream',
            'Content-Type': 'application/json',
          },
          responseType: 'stream',
          timeout:      60000,   // 60s timeout
        },
      )

      await new Promise<void>((resolve, reject) => {
        let buffer = ''

        response.data.on('data', (chunk: Buffer) => {
          if (this.cancelledIds.has(conversationId)) {
            response.data.destroy()
            resolve()
            return
          }

          buffer += chunk.toString()
          const lines = buffer.split('\n')
          buffer = lines.pop() ?? ''

          for (const line of lines) {
            const trimmed = line.trim()
            if (!trimmed || trimmed === 'data: [DONE]') { continue }
            if (!trimmed.startsWith('data: ')) { continue }

            try {
              const json  = JSON.parse(trimmed.slice(6))
              const delta = json.choices?.[0]?.delta?.content
              if (delta && !webContents.isDestroyed()) {
                webContents.send(AIChannel.STREAM_CHUNK, { conversationId, delta })
              }
            } catch { /* skip malformed SSE lines */ }
          }
        })

        response.data.on('end', () => {
          if (!webContents.isDestroyed()) {
            webContents.send(AIChannel.STREAM_END, {
              conversationId,
              messageId:   '',
              totalTokens: 0,
              stopReason:  'end_turn',
            })
          }
          resolve()
        })

        response.data.on('error', (err: Error) => reject(err))
      })
    } catch (e) {
      const err = VartaError.from(e, VartaErrorCode.AI_REQUEST_FAILED)
      if (!webContents.isDestroyed()) {
        webContents.send(AIChannel.STREAM_ERROR, { conversationId, messageId: '', code: err.code, message: err.message })
      }
      throw err
    } finally {
      this.cancelledIds.delete(conversationId)
    }
  }

  // ── Inline hint ───────────────────────────────────────────────────────────

  async inlineHint(payload: AIInlineHintPayload, apiKey: string, baseUrl?: string): Promise<AIInlineHintResult> {
    if (!apiKey?.trim()) {
      throw new VartaError(VartaErrorCode.AI_NO_API_KEY, 'No API key configured')
    }

    if (isOpenAICompatible(baseUrl)) {
      return this.inlineHintOpenAI(payload, apiKey, baseUrl!)
    }
    return this.inlineHintAnthropic(payload, apiKey, baseUrl)
  }

  private async inlineHintAnthropic(payload: AIInlineHintPayload, apiKey: string, baseUrl?: string): Promise<AIInlineHintResult> {
    const clientOptions: ConstructorParameters<typeof Anthropic>[0] = { apiKey }
    if (baseUrl?.trim()) { clientOptions.baseURL = baseUrl.trim() }
    const client = new Anthropic(clientOptions)

    try {
      const response = await client.messages.create({
        model:      'claude-haiku-3-5',
        max_tokens: 100,
        system:     'Complete the code at <cursor>. Output ONLY the completion text. No explanation. No markdown. Max 1-2 lines.',
        messages: [{
          role:    'user',
          content: `Language: ${payload.context.language}\nPrefix: ${payload.context.activeFileContent?.slice(-500) ?? ''}<cursor>\nComplete the code:`,
        }],
      })
      const text = response.content[0]?.type === 'text' ? response.content[0].text.trim() : ''
      return { hint: text, insertAt: payload.context.cursorLine, language: payload.context.language }
    } catch (e) {
      throw VartaError.from(e, VartaErrorCode.AI_REQUEST_FAILED)
    }
  }

  private async inlineHintOpenAI(payload: AIInlineHintPayload, apiKey: string, baseUrl: string): Promise<AIInlineHintResult> {
    const base = baseUrl.replace(/\/+$/, '')
    const url  = base.endsWith('/chat/completions')
      ? base
      : `${base}/chat/completions`

    try {
      const response = await axios.post(
        url,
        {
          model:       'moonshotai/kimi-k2.6',
          messages: [
            { role: 'system', content: 'Complete the code at <cursor>. Output ONLY the completion text. No explanation. No markdown. Max 1-2 lines.' },
            { role: 'user',   content: `Language: ${payload.context.language}\nPrefix: ${payload.context.activeFileContent?.slice(-500) ?? ''}<cursor>\nComplete the code:` },
          ],
          max_tokens:  100,
          temperature: 0.2,
          stream:      false,
        },
        { headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' } },
      )
      const text = response.data?.choices?.[0]?.message?.content?.trim() ?? ''
      return { hint: text, insertAt: payload.context.cursorLine, language: payload.context.language }
    } catch (e) {
      throw VartaError.from(e, VartaErrorCode.AI_REQUEST_FAILED)
    }
  }

  // ── Cancel ────────────────────────────────────────────────────────────────

  cancelStream(conversationId: string): void {
    this.cancelledIds.add(conversationId)
    logger.info('AIService', `Cancelled stream: ${conversationId}`)
  }

  getModels() {
    return [
      // Anthropic models
      { id: 'claude-opus-4-5',        name: 'Claude Opus 4.5',        contextWindow: 200000, maxOutput: 8192,  description: 'Most capable (Anthropic)' },
      { id: 'claude-sonnet-4-5',      name: 'Claude Sonnet 4.5',      contextWindow: 200000, maxOutput: 8192,  description: 'Best balance (Anthropic)' },
      { id: 'claude-haiku-3-5',       name: 'Claude Haiku 3.5',       contextWindow: 200000, maxOutput: 8192,  description: 'Fastest (Anthropic)' },
      // NVIDIA NIM models
      { id: 'moonshotai/kimi-k2.6',   name: 'Kimi K2.6 (NVIDIA NIM)', contextWindow: 131072, maxOutput: 8192, description: 'Kimi K2 via NVIDIA NIM' },
      { id: 'qwen/qwen3-next-80b-a3b-instruct',   name: 'qwen/qwen3-next-80b-a3b-instruct (NVIDIA NIM)', contextWindow: 8192, maxOutput: 16384, description: 'qwen/qwen3-next-80b-a3b-instruct' },
      { id: 'meta/llama-3.1-405b-instruct', name: 'Llama 3.1 405B',  contextWindow: 128000, maxOutput: 4096,  description: 'Meta Llama via NVIDIA NIM' },
      { id: 'mistralai/mistral-large-2-instruct', name: 'Mistral Large 2', contextWindow: 128000, maxOutput: 4096, description: 'Mistral via NVIDIA NIM' },
    ]
  }
}

export const aiService = new AIService()
