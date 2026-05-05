import Anthropic      from '@anthropic-ai/sdk'
import { BrowserWindow } from 'electron'
import { AIChannel }   from '../../shared/ipc'
import type {
  AISendMessagePayload, AIInlineHintPayload,
  AIInlineHintResult, CLAUDE_MODELS,
} from '../../shared/types/ai.types'
import { VartaError, VartaErrorCode } from '../../shared/errors'
import { logger } from '../utils/logger'

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
  ): Promise<void> {
    if (!apiKey?.trim()) {
      throw new VartaError(VartaErrorCode.AI_NO_API_KEY, 'No API key configured')
    }

    const client = new Anthropic({ apiKey })
    const { conversationId, message, context } = payload

    this.cancelledIds.delete(conversationId)

    // Build system prompt with editor context
    const systemPrompt = [
      'You are Varta Intelligence, a coding assistant built into the Varta desktop code editor.',
      'You have access to the active file, selected code, LSP diagnostics, and project structure.',
      'Be concise and precise. No filler phrases.',
      '',
      'When producing code to replace selected text, wrap it in <varta:replace> tags.',
      'When producing a new file, wrap it in <varta:newfile path="..."> tags.',
      'When suggesting a terminal command, wrap it in <varta:terminal> tags.',
      'Match the coding style, language, and patterns already present in the project.',
      '',
      context ? [
        `File: ${context.activeFilePath}`,
        `Language: ${context.language}`,
        `Project: ${context.projectRoot}`,
        context.selectedText ? `Selected code:\n${context.selectedText}` : '',
        context.diagnostics?.length > 0
          ? `Errors: ${context.diagnostics.map((d) => d.message).slice(0, 5).join('; ')}`
          : '',
        `Open tabs: ${context.openTabs?.slice(0, 5).join(', ')}`,
      ].filter(Boolean).join('\n') : '',
    ].filter(Boolean).join('\n')

    try {
      const stream = await client.messages.stream({
        model:      payload.model ?? 'claude-sonnet-4-5',
        max_tokens: 4096,
        system:     systemPrompt,
        messages:   [{ role: 'user', content: message }],
      })

      for await (const chunk of stream) {
        if (this.cancelledIds.has(conversationId)) { break }

        if (
          chunk.type === 'content_block_delta' &&
          chunk.delta.type === 'text_delta'
        ) {
          if (!webContents.isDestroyed()) {
            webContents.send(AIChannel.STREAM_CHUNK, {
              conversationId,
              delta: chunk.delta.text,
            })
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
        webContents.send(AIChannel.STREAM_ERROR, {
          conversationId,
          messageId: '',
          code:      err.code,
          message:   err.message,
        })
      }
      throw err
    } finally {
      this.cancelledIds.delete(conversationId)
    }
  }

  // ── Inline hint (fast, non-streaming) ─────────────────────────────────────

  async inlineHint(payload: AIInlineHintPayload, apiKey: string): Promise<AIInlineHintResult> {
    if (!apiKey?.trim()) {
      throw new VartaError(VartaErrorCode.AI_NO_API_KEY, 'No API key configured')
    }

    const client = new Anthropic({ apiKey })

    try {
      const response = await client.messages.create({
        model:      'claude-haiku-3-5',   // fastest model for inline hints
        max_tokens: 100,
        system:     'Complete the code at <cursor>. Output ONLY the completion text. No explanation. No markdown. Max 1-2 lines.',
        messages: [{
          role:    'user',
          content: `Language: ${payload.context.language}\nPrefix: ${payload.context.activeFileContent?.slice(-500) ?? ''}<cursor>\nComplete the code:`,
        }],
      })

      const text = response.content[0]?.type === 'text'
        ? response.content[0].text.trim()
        : ''

      return {
        hint:     text,
        insertAt: payload.context.cursorLine,
        language: payload.context.language,
      }
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
      { id: 'claude-opus-4-5',   name: 'Claude Opus 4.5',   contextWindow: 200000, maxOutput: 8192, description: 'Most capable' },
      { id: 'claude-sonnet-4-5', name: 'Claude Sonnet 4.5', contextWindow: 200000, maxOutput: 8192, description: 'Best balance' },
      { id: 'claude-haiku-3-5',  name: 'Claude Haiku 3.5',  contextWindow: 200000, maxOutput: 8192, description: 'Fastest' },
    ]
  }
}

export const aiService = new AIService()
