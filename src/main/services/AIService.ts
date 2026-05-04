import Anthropic      from '@anthropic-ai/sdk'
import { BrowserWindow } from 'electron'
import { AIChannel }   from '../../shared/ipc'
import {
  AISendMessagePayload, AIInlineHintPayload,
  AIInlineHintResult, AIStreamChunk, AIStreamEnd,
  CLAUDE_MODELS, DEFAULT_AI_MODEL,
} from '../../shared/types/ai.types'
import { VartaError, VartaErrorCode } from '../../shared/errors'
import { logger } from '../utils/logger'

/** Active streaming controllers keyed by conversationId */
type AbortMap = Map<string, AbortController>

export class AIService {
  private mainWindow:  BrowserWindow | null = null
  private activeStreams: AbortMap = new Map()

  init(mainWindow: BrowserWindow): void {
    this.mainWindow = mainWindow
    logger.info('AIService', 'Initialized')
  }

  destroy(): void {
    // Cancel all active streams
    for (const [id, ctrl] of this.activeStreams) {
      ctrl.abort()
      logger.debug('AIService', `Cancelled stream: ${id}`)
    }
    this.activeStreams.clear()
    this.mainWindow = null
    logger.info('AIService', 'Destroyed')
  }

  // ── Send message (streaming) ──────────────────────────────────────────────

  async sendMessage(
    payload:    AISendMessagePayload,
    apiKey:     string,
    model:      string = DEFAULT_AI_MODEL,
    maxTokens:  number = 4096,
  ): Promise<void> {
    if (!apiKey || apiKey.trim() === '') {
      throw new VartaError(VartaErrorCode.AI_NO_API_KEY, 'No API key configured. Set your Claude API key in Settings → AI.')
    }

    const client = new Anthropic({ apiKey })
    const { conversationId, message, context, systemPrompt } = payload

    // Build system prompt
    const system = this.buildSystemPrompt(systemPrompt, context)

    // Build messages array
    const messages: Anthropic.MessageParam[] = [
      { role: 'user', content: this.buildUserContent(message, context) },
    ]

    const messageId  = `msg-${Date.now()}`
    const controller = new AbortController()
    this.activeStreams.set(conversationId, controller)

    try {
      const stream = await client.messages.stream(
        {
          model,
          max_tokens: maxTokens,
          system,
          messages,
        },
        { signal: controller.signal }
      )

      let totalTokens = 0

      for await (const event of stream) {
        if (controller.signal.aborted) { break }

        if (
          event.type === 'content_block_delta' &&
          event.delta.type === 'text_delta'
        ) {
          const chunk: AIStreamChunk = {
            conversationId,
            messageId,
            delta: event.delta.text,
          }
          this.push(AIChannel.STREAM_CHUNK, chunk)
        }

        if (event.type === 'message_delta' && event.usage) {
          totalTokens = event.usage.output_tokens
        }
      }

      const finalMessage = await stream.finalMessage()
      const end: AIStreamEnd = {
        conversationId,
        messageId,
        totalTokens: finalMessage.usage.output_tokens,
        stopReason:  finalMessage.stop_reason ?? 'end_turn',
      }
      this.push(AIChannel.STREAM_END, end)
    } catch (e) {
      if (controller.signal.aborted) {
        // User cancelled — not an error
        return
      }

      const errPayload = this.mapAnthropicError(e, conversationId, messageId)
      this.push(AIChannel.STREAM_ERROR, errPayload)
      throw VartaError.from(e, VartaErrorCode.AI_REQUEST_FAILED)
    } finally {
      this.activeStreams.delete(conversationId)
    }
  }

  // ── Inline hint (non-streaming, short response) ───────────────────────────

  async inlineHint(
    payload:   AIInlineHintPayload,
    apiKey:    string,
    model:     string = DEFAULT_AI_MODEL,
  ): Promise<AIInlineHintResult> {
    if (!apiKey || apiKey.trim() === '') {
      throw new VartaError(VartaErrorCode.AI_NO_API_KEY, 'No API key configured')
    }

    const client = new Anthropic({ apiKey })
    const { context, instruction } = payload

    const prompt = [
      `You are a code completion assistant. Provide a short, focused code suggestion.`,
      `Language: ${context.language}`,
      `File: ${context.activeFilePath}`,
      `Cursor is on line ${context.cursorLine}.`,
      instruction ? `User instruction: ${instruction}` : '',
      `\nCode context (around cursor):\n\`\`\`${context.language}\n${context.activeFileContent.slice(0, 2000)}\n\`\`\``,
      `\nProvide ONLY the code to insert, no explanation, no markdown fences.`,
    ].filter(Boolean).join('\n')

    try {
      const response = await client.messages.create({
        model,
        max_tokens: 256,
        messages: [{ role: 'user', content: prompt }],
      })

      const hint = response.content
        .filter((b) => b.type === 'text')
        .map((b) => (b as Anthropic.TextBlock).text)
        .join('')
        .trim()

      return {
        hint,
        insertAt: context.cursorLine,
        language: context.language,
      }
    } catch (e) {
      throw VartaError.from(e, VartaErrorCode.AI_REQUEST_FAILED)
    }
  }

  // ── Cancel stream ─────────────────────────────────────────────────────────

  cancelStream(conversationId: string): void {
    const ctrl = this.activeStreams.get(conversationId)
    if (ctrl) {
      ctrl.abort()
      this.activeStreams.delete(conversationId)
      logger.info('AIService', `Stream cancelled: ${conversationId}`)
    }
  }

  // ── Models ────────────────────────────────────────────────────────────────

  getModels() {
    return CLAUDE_MODELS
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  private buildSystemPrompt(
    custom?: string,
    context?: AISendMessagePayload['context'],
  ): string {
    const parts: string[] = [
      custom ?? 'You are Varta AI, an intelligent coding assistant built into the Varta code editor. You help developers write, understand, debug, and improve code.',
    ]

    if (context) {
      parts.push(`\nCurrent editor context:`)
      parts.push(`- File: ${context.activeFilePath}`)
      parts.push(`- Language: ${context.language}`)
      parts.push(`- Project root: ${context.projectRoot}`)
      parts.push(`- Open tabs: ${context.openTabs.slice(0, 5).join(', ')}`)

      if (context.diagnostics.length > 0) {
        const errors = context.diagnostics.filter((d) => d.severity === 'error')
        if (errors.length > 0) {
          parts.push(`- Current errors: ${errors.map((d) => d.message).slice(0, 3).join('; ')}`)
        }
      }
    }

    return parts.join('\n')
  }

  private buildUserContent(
    message: string,
    context?: AISendMessagePayload['context'],
  ): string {
    if (!context) { return message }

    const parts: string[] = [message]

    if (context.selectedText) {
      parts.push(`\n\nSelected code:\n\`\`\`${context.language}\n${context.selectedText}\n\`\`\``)
    } else if (context.activeFileContent) {
      // Include a window around the cursor
      const lines = context.activeFileContent.split('\n')
      const start = Math.max(0, context.cursorLine - 20)
      const end   = Math.min(lines.length, context.cursorLine + 20)
      const snippet = lines.slice(start, end).join('\n')
      parts.push(`\n\nCode near cursor (lines ${start + 1}–${end}):\n\`\`\`${context.language}\n${snippet}\n\`\`\``)
    }

    return parts.join('')
  }

  private mapAnthropicError(
    e: unknown,
    conversationId: string,
    messageId: string,
  ): { conversationId: string; messageId: string; code: string; message: string } {
    let code    = VartaErrorCode.AI_REQUEST_FAILED as string
    let message = 'AI request failed'

    if (e instanceof Anthropic.APIError) {
      if (e.status === 401) { code = VartaErrorCode.AI_INVALID_API_KEY; message = 'Invalid API key' }
      else if (e.status === 429) { code = VartaErrorCode.AI_RATE_LIMITED; message = 'Rate limit exceeded' }
      else if (e.status === 400 && e.message.includes('context')) { code = VartaErrorCode.AI_CONTEXT_TOO_LONG; message = 'Context too long' }
      else { message = e.message }
    } else if (e instanceof Error) {
      message = e.message
    }

    return { conversationId, messageId, code, message }
  }

  private push(channel: string, data: unknown): void {
    if (!this.mainWindow || this.mainWindow.isDestroyed()) { return }
    this.mainWindow.webContents.send(channel, data)
  }
}

export const aiService = new AIService()
