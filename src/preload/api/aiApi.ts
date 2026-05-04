import { ipcRenderer } from 'electron'
import { AIChannel }   from '../../shared/ipc'
import type {
  AISendMessagePayload, AIInlineHintPayload,
  AIInlineHintResult, AIStreamChunk, AIStreamEnd,
  AIStreamError, AIModel,
} from '../../shared/types/ai.types'
import type { IPCResponse } from '../../shared/ipc'

export const aiApi = {
  // ── Invoke wrappers ────────────────────────────────────────────────────────

  /**
   * Send a message to Claude. Response comes via streaming push events:
   * onStreamChunk → onStreamEnd (or onStreamError).
   * API key is NEVER sent from renderer — main reads it from encrypted store.
   */
  sendMessage: (payload: AISendMessagePayload): Promise<IPCResponse<null>> =>
    ipcRenderer.invoke(AIChannel.SEND_MESSAGE, payload),

  /**
   * Request a short inline code hint. Returns result directly (non-streaming).
   */
  inlineHint: (payload: AIInlineHintPayload): Promise<IPCResponse<AIInlineHintResult>> =>
    ipcRenderer.invoke(AIChannel.INLINE_HINT, payload),

  /**
   * Cancel an active streaming response.
   */
  cancelStream: (conversationId: string): Promise<IPCResponse<null>> =>
    ipcRenderer.invoke(AIChannel.CANCEL_STREAM, conversationId),

  /**
   * Get list of available Claude models.
   */
  getModels: (): Promise<IPCResponse<AIModel[]>> =>
    ipcRenderer.invoke(AIChannel.GET_MODELS),

  /**
   * Check if an API key is configured (returns boolean, NOT the key itself).
   */
  hasApiKey: (): Promise<IPCResponse<boolean>> =>
    ipcRenderer.invoke(AIChannel.HAS_API_KEY),

  /**
   * Store the API key in encrypted settings on the main process.
   * Key goes IN only — it is never returned to the renderer.
   */
  setApiKey: (key: string): Promise<IPCResponse<null>> =>
    ipcRenderer.invoke(AIChannel.SET_API_KEY, key),

  /**
   * Remove the stored API key.
   */
  clearApiKey: (): Promise<IPCResponse<null>> =>
    ipcRenderer.invoke(AIChannel.CLEAR_API_KEY),

  // ── Push listeners (streaming) ─────────────────────────────────────────────

  /**
   * Listen for streaming text chunks pushed from main during a Claude response.
   * @returns cleanup function
   */
  onStreamChunk: (cb: (chunk: AIStreamChunk) => void): (() => void) => {
    const handler = (_: Electron.IpcRendererEvent, chunk: AIStreamChunk) => cb(chunk)
    ipcRenderer.on(AIChannel.STREAM_CHUNK, handler)
    return () => ipcRenderer.off(AIChannel.STREAM_CHUNK, handler)
  },

  /**
   * Listen for stream completion event.
   * @returns cleanup function
   */
  onStreamEnd: (cb: (event: AIStreamEnd) => void): (() => void) => {
    const handler = (_: Electron.IpcRendererEvent, event: AIStreamEnd) => cb(event)
    ipcRenderer.on(AIChannel.STREAM_END, handler)
    return () => ipcRenderer.off(AIChannel.STREAM_END, handler)
  },

  /**
   * Listen for stream error events.
   * @returns cleanup function
   */
  onStreamError: (cb: (event: AIStreamError) => void): (() => void) => {
    const handler = (_: Electron.IpcRendererEvent, event: AIStreamError) => cb(event)
    ipcRenderer.on(AIChannel.STREAM_ERROR, handler)
    return () => ipcRenderer.off(AIChannel.STREAM_ERROR, handler)
  },
}

export type AIAPI = typeof aiApi
