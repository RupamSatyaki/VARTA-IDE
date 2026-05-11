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
import { toolRegistry }   from '../mcp/registry/ToolRegistry'

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
      payload.context?.selectedText,
      payload.context?.openTabs ?? []
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

    const { conversationId, message, history = [] } = payload
    this.cancelledIds.delete(conversationId)

    try {
      // 1. Tool Definitions
      const tools = toolRegistry.getToolDefinitions().map(t => ({
        name: t.name,
        description: t.description,
        input_schema: t.inputSchema as any
      }))

      // 2. Map History
      const messages: any[] = history.map(m => ({ role: m.role, content: m.content }))
      if (message?.trim()) {
        messages.push({ role: 'user', content: message })
      }

      // 3. Stream
      const stream = await client.messages.stream({
        model:      payload.model ?? 'claude-sonnet-4-5',
        max_tokens: 16384,
        system:     systemPrompt,
        tools,
        messages,
      })

      for await (const chunk of stream) {
        if (this.cancelledIds.has(conversationId)) { break }
        if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
          if (!webContents.isDestroyed()) {
            webContents.send(AIChannel.STREAM_CHUNK, { conversationId, delta: chunk.delta.text, messageId: '' })
          }
        }
      }

      const finalMessage = await stream.finalMessage()
      
      // 4. Handle Tool Calls
      if (finalMessage.stop_reason === 'tool_use') {
        const toolUseBlocks = finalMessage.content.filter(c => c.type === 'tool_use') as any[]
        
        if (toolUseBlocks.length > 0) {
          messages.push({ role: 'assistant', content: finalMessage.content })
          const toolResults = []

          for (const block of toolUseBlocks) {
            logger.info('AIService', `Executing tool: ${block.name}`)
            
            // Notify UI that a tool is starting
            if (!webContents.isDestroyed()) {
              webContents.send(AIChannel.STREAM_CHUNK, { 
                conversationId, 
                delta: `\n<varta:tool_start name="${block.name}" input='${JSON.stringify(block.input).replace(/'/g, "&apos;")}'/>\n`, 
                messageId: '' 
              })
            }

            const toolResult = await toolRegistry.executeTool(block.name, block.input)
            
            // Stream result to UI immediately
            if (!webContents.isDestroyed()) {
              webContents.send(AIChannel.STREAM_CHUNK, { 
                conversationId, 
                delta: `\n<varta:tool_end name="${block.name}" status="${toolResult.isError ? 'error' : 'success'}" result='${JSON.stringify(toolResult.content).replace(/'/g, "&apos;")}'/>\n`, 
                messageId: '' 
              })
              
              if (block.name === 'create_file' && !toolResult.isError) {
                webContents.send(AIChannel.STREAM_CHUNK, { 
                  conversationId, 
                  delta: `\n<varta:created path="${block.input.path}"/>\n`, 
                  messageId: '' 
                })
              }
            }

            toolResults.push({
              type: 'tool_result',
              tool_use_id: block.id,
              content: toolResult.content,
              is_error: toolResult.isError
            })
          }

          messages.push({ role: 'user', content: toolResults })

          // Recurse with EMPTY message to force the AI to respond to results
          return this.sendMessageAnthropic(
            { ...payload, message: '', history: messages }, 
            apiKey,
            webContents,
            systemPrompt,
            baseUrl
          )
        }
      } else if (!this.cancelledIds.has(conversationId) && !webContents.isDestroyed()) {
        webContents.send(AIChannel.STREAM_END, {
          conversationId,
          messageId:   '',
          totalTokens: finalMessage.usage.output_tokens,
          stopReason:  finalMessage.stop_reason ?? 'end_turn',
        })
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

  // ── OpenAI-compatible streaming ────────────────────────────────────────────

  private async sendMessageOpenAI(
    payload:     AISendMessagePayload,
    apiKey:      string,
    webContents: Electron.WebContents,
    systemPrompt: string,
    baseUrl:     string,
  ): Promise<void> {
    const { conversationId, message, history = [] } = payload
    this.cancelledIds.delete(conversationId)

    const base = baseUrl.replace(/\/+$/, '')
    const url  = base.endsWith('/chat/completions') ? base : `${base}/chat/completions`

    const tools = toolRegistry.getToolDefinitions().map(t => ({
      type: 'function',
      function: {
        name: t.name,
        description: t.description,
        parameters: t.inputSchema
      }
    }))

    const messages: any[] = [
      { role: 'system', content: systemPrompt },
      ...history.map(m => ({ role: m.role, content: m.content }))
    ]
    if (message?.trim()) {
      messages.push({ role: 'user', content: message })
    }

    try {
      let response: any
      let retries = 0
      const maxRetries = 3
      
      while (retries <= maxRetries) {
        try {
          response = await axios.post(
            url,
            {
              model:       payload.model ?? 'moonshotai/kimi-k2.6',
              messages,
              tools:       tools.length > 0 ? tools : undefined,
              max_tokens:  8192,
              temperature: 0.6,
              stream:      true,
            },
            {
              headers: {
                Authorization:  `Bearer ${apiKey}`,
                Accept:         'text/event-stream',
                'Content-Type': 'application/json',
                'HTTP-Referer': 'https://varta.ide', // Good practice for OpenRouter
                'X-Title': 'Varta IDE',
              },
              responseType: 'stream',
              timeout:      120000,
            },
          )
          break // Success, exit retry loop
        } catch (err: any) {
          if (err.response?.status === 429 && retries < maxRetries) {
            retries++
            const delay = Math.pow(2, retries) * 1000
            logger.warn('AIService', `Rate limited (429). Retrying in ${delay}ms... (Attempt ${retries}/${maxRetries})`)
            
            if (!webContents.isDestroyed()) {
              webContents.send(AIChannel.STREAM_CHUNK, { 
                conversationId, 
                delta: `\n> *Rate limit reached. Retrying in ${delay/1000}s... (Attempt ${retries}/${maxRetries})*\n`, 
                messageId: '' 
              })
            }
            
            await new Promise(resolve => setTimeout(resolve, delay))
            continue
          }
          throw err // Other error or max retries reached
        }
      }

      await new Promise<void>(async (resolve, reject) => {
        let buffer = ''
        let toolCalls: any[] = []
        let assistantContent = ''

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
            if (!trimmed || trimmed === 'data: [DONE]') continue
            if (!trimmed.startsWith('data: ')) continue

            try {
              const json  = JSON.parse(trimmed.slice(6))
              const delta = json.choices?.[0]?.delta
              
              if (delta?.content) {
                assistantContent += delta.content
                if (!webContents.isDestroyed()) {
                  webContents.send(AIChannel.STREAM_CHUNK, { conversationId, delta: delta.content, messageId: '' })
                }
              }

              if (delta?.tool_calls) {
                for (const tc of delta.tool_calls) {
                  if (!toolCalls[tc.index]) toolCalls[tc.index] = { id: '', name: '', args: '' }
                  if (tc.id) toolCalls[tc.index].id = tc.id
                  if (tc.function?.name) toolCalls[tc.index].name += tc.function.name
                  if (tc.function?.arguments) toolCalls[tc.index].args += tc.function.arguments
                }
              }
            } catch { /* skip */ }
          }
        })

        response.data.on('end', async () => {
          if (toolCalls.length > 0 && !this.cancelledIds.has(conversationId)) {
            try {
              messages.push({ 
                role: 'assistant', 
                content: assistantContent || null, 
                tool_calls: toolCalls.map(tc => ({
                  id: tc.id,
                  type: 'function',
                  function: { name: tc.name, arguments: tc.args }
                }))
              })

              for (const tc of toolCalls) {
                // Notify starting
                if (!webContents.isDestroyed()) {
                  webContents.send(AIChannel.STREAM_CHUNK, { 
                    conversationId, 
                    delta: `\n<varta:tool_start name="${tc.name}" input='${tc.args.replace(/'/g, "&apos;")}'/>\n`, 
                    messageId: '' 
                  })
                }

                const args = JSON.parse(tc.args)
                logger.info('AIService', `OpenAI executing: ${tc.name}`)
                const result = await toolRegistry.executeTool(tc.name, args)

                // Stream result
                if (!webContents.isDestroyed()) {
                  webContents.send(AIChannel.STREAM_CHUNK, { 
                    conversationId, 
                    delta: `\n<varta:tool_end name="${tc.name}" status="${result.isError ? 'error' : 'success'}" result='${JSON.stringify(result.content).replace(/'/g, "&apos;")}'/>\n`, 
                    messageId: '' 
                  })
                  
                  if (tc.name === 'create_file' && !result.isError) {
                    webContents.send(AIChannel.STREAM_CHUNK, { 
                      conversationId, 
                      delta: `\n<varta:created path="${args.path}"/>\n`, 
                      messageId: '' 
                    })
                  }
                }

                messages.push({
                  role: 'tool',
                  tool_call_id: tc.id,
                  name: tc.name,
                  content: JSON.stringify(result.content)
                })
              }

              // Recursive call with empty message to get final response
              return this.sendMessageOpenAI(
                { ...payload, message: '', history: messages.slice(1) }, 
                apiKey,
                webContents,
                systemPrompt,
                baseUrl
              ).then(resolve).catch(reject)

            } catch (e: any) {
              logger.error('AIService', `OpenAI parallel tool error: ${e.message}`)
            }
          }

          if (!webContents.isDestroyed()) {
            webContents.send(AIChannel.STREAM_END, { conversationId, messageId: '', totalTokens: 0, stopReason: 'end_turn' })
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

  // ── Inline hint ────────────────────────────────────────────────────────────

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
    const url  = base.endsWith('/chat/completions') ? base : `${base}/chat/completions`

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

  cancelStream(conversationId: string): void {
    this.cancelledIds.add(conversationId)
    logger.info('AIService', `Cancelled stream: ${conversationId}`)
  }

  getModels() {
    return [
      { id: 'inclusionai/ring-2.6-1t:free', name: 'Ring 2.6 1T (Free)', contextWindow: 131072, maxOutput: 16384, description: 'Inclusion AI via OpenRouter' },
      { id: 'google/gemini-2.0-flash-lite-preview-02-05:free', name: 'Gemini 2.0 Flash Lite (Free)', contextWindow: 1000000, maxOutput: 16384, description: 'Google Gemini via OpenRouter' },
      { id: 'deepseek/deepseek-r1:free', name: 'DeepSeek R1 (Free)', contextWindow: 64000, maxOutput: 16384, description: 'DeepSeek Reasoning via OpenRouter' },
      { id: 'deepseek/deepseek-v3:free', name: 'DeepSeek V3 (Free)', contextWindow: 64000, maxOutput: 16384, description: 'DeepSeek V3 via OpenRouter' },
      { id: 'meta-llama/llama-3.3-70b-instruct:free', name: 'Llama 3.3 70B (Free)', contextWindow: 128000, maxOutput: 16384, description: 'Meta Llama via OpenRouter' },
      { id: 'qwen/qwen-2.5-72b-instruct:free', name: 'Qwen 2.5 72B (Free)', contextWindow: 128000, maxOutput: 16384, description: 'Alibaba Qwen via OpenRouter' },
      { id: 'mistralai/mistral-7b-instruct:free', name: 'Mistral 7B (Free)', contextWindow: 32000, maxOutput: 16384, description: 'Mistral AI via OpenRouter' },
      { id: 'openrouter/owl-alpha',   name: 'Owl Alpha (Free)',       contextWindow: 128000,  maxOutput: 16384,  description: 'Fast and free model via OpenRouter' },
      { id: 'claude-sonnet-4-5',      name: 'Claude Sonnet 4.5',      contextWindow: 200000, maxOutput: 16384,  description: 'Best balance (Anthropic)' },
      { id: 'moonshotai/kimi-k2.6',   name: 'Kimi K2.6 (NVIDIA NIM)', contextWindow: 131072, maxOutput: 16384, description: 'Kimi K2 via NVIDIA NIM' },
      { id: 'meta/llama-3.1-405b-instruct', name: 'Llama 3.1 405B',  contextWindow: 128000, maxOutput: 16384,  description: 'Meta Llama via NVIDIA NIM' },
    ]
  }
}

export const aiService = new AIService()
