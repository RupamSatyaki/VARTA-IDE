import { ipcMain }  from 'electron'
import { AIChannel, ipcOk, ipcErr } from '../../shared/ipc'
import { VartaError, VartaErrorCode } from '../../shared/errors'
import { aiService }       from '../services/AIService'
import { settingsService } from '../services/SettingsService'
import { logger }          from '../utils/logger'
import type { AISendMessagePayload, AIInlineHintPayload } from '../../shared/types/ai.types'

function handleErr(e: unknown) {
  const err = VartaError.from(e, VartaErrorCode.UNKNOWN)
  return ipcErr(err.toPayload())
}

export function registerAIHandlers(): void {

  /**
   * SECURITY: API key is read from settingsService (main process only).
   * The renderer NEVER sends or receives the API key.
   * Renderer sends only: { conversationId, message, context? }
   */
  ipcMain.handle(AIChannel.SEND_MESSAGE, async (_e, payload: AISendMessagePayload) => {
    try {
      const apiKey   = settingsService.getApiKey()
      const aiConfig = settingsService.get('ai')

      // Fire-and-forget streaming — response comes via push events
      aiService.sendMessage(payload, apiKey, aiConfig.model, aiConfig.maxTokens)
        .catch((e) => {
          logger.error('AIHandlers', 'sendMessage stream error', e)
        })

      return ipcOk(null)
    } catch (e) { return handleErr(e) }
  })

  ipcMain.handle(AIChannel.INLINE_HINT, async (_e, payload: AIInlineHintPayload) => {
    try {
      const apiKey   = settingsService.getApiKey()
      const aiConfig = settingsService.get('ai')
      const result   = await aiService.inlineHint(payload, apiKey, aiConfig.model)
      return ipcOk(result)
    } catch (e) { return handleErr(e) }
  })

  ipcMain.handle(AIChannel.CANCEL_STREAM, (_e, conversationId: string) => {
    try {
      aiService.cancelStream(conversationId)
      return ipcOk(null)
    } catch (e) { return handleErr(e) }
  })

  ipcMain.handle(AIChannel.GET_MODELS, () => {
    try {
      return ipcOk(aiService.getModels())
    } catch (e) { return handleErr(e) }
  })

  /** Returns boolean — does NOT return the key itself */
  ipcMain.handle(AIChannel.HAS_API_KEY, () => {
    try {
      return ipcOk(settingsService.hasApiKey())
    } catch (e) { return handleErr(e) }
  })

  /** Stores key in encrypted settings — never echoed back */
  ipcMain.handle(AIChannel.SET_API_KEY, (_e, key: string) => {
    try {
      if (typeof key !== 'string' || key.trim() === '') {
        throw new VartaError(VartaErrorCode.INVALID_ARGUMENT, 'API key must be a non-empty string')
      }
      settingsService.setApiKey(key.trim())
      return ipcOk(null)
    } catch (e) { return handleErr(e) }
  })

  ipcMain.handle(AIChannel.CLEAR_API_KEY, () => {
    try {
      settingsService.clearApiKey()
      return ipcOk(null)
    } catch (e) { return handleErr(e) }
  })

  logger.info('IPC', 'AI handlers registered')
}

export function removeAIHandlers(): void {
  const channels = [
    AIChannel.SEND_MESSAGE, AIChannel.INLINE_HINT,
    AIChannel.CANCEL_STREAM, AIChannel.GET_MODELS,
    AIChannel.HAS_API_KEY, AIChannel.SET_API_KEY, AIChannel.CLEAR_API_KEY,
  ]
  for (const ch of channels) { ipcMain.removeHandler(ch) }
}
