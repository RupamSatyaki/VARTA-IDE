import { useCallback, useEffect, useRef } from 'react'
import { useAIStore }          from '../store/aiStore'
import { useEditorStore }      from '../store/editorStore'
import { useFileTreeStore }    from '../store/fileTreeStore'
import { useTabStore }         from '../store/tabStore'
import { useSettingsStore }    from '../store/settingsStore'
import { useNotificationStore } from '../store/notificationStore'
import { isIPCSuccess }        from '../../shared/ipc'
import type { EditorContext }  from '../../shared/types/editor.types'
import type { AIMessage }      from '../../shared/types/ai.types'

function generateId(): string {
  return `msg-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

export function useAI() {
  const aiStore    = useAIStore()
  const edStore    = useEditorStore()
  const tabStore   = useTabStore()
  const { rootPath } = useFileTreeStore()
  const { settings } = useSettingsStore()
  const { error: notifyError } = useNotificationStore()

  const aiRef    = useRef(aiStore);    aiRef.current    = aiStore
  const edRef    = useRef(edStore);    edRef.current    = edStore
  const tabRef   = useRef(tabStore);   tabRef.current   = tabStore
  const rootRef  = useRef(rootPath);   rootRef.current  = rootPath
  const modelRef = useRef(settings.ai.model); modelRef.current = settings.ai.model

  // ── Listen for streaming events ───────────────────────────────────────────
  useEffect(() => {
    const offChunk = window.varta.ai.onStreamChunk((event) => {
      aiRef.current.appendStreamChunk(event)
    })

    const offEnd = window.varta.ai.onStreamEnd((event) => {
      aiRef.current.finalizeStream(event)
    })

    const offError = window.varta.ai.onStreamError((event) => {
      aiRef.current.setStreamError(event.conversationId, event.messageId, event.code)
      notifyError(`AI Error: ${event.message}`)
    })

    return () => { offChunk(); offEnd(); offError() }
  }, [notifyError])

  // ── Build editor context ──────────────────────────────────────────────────
  const buildContext = useCallback((): EditorContext => {
    const tabs      = tabRef.current.tabs
    const activeId  = tabRef.current.activeTabId
    const activeTab = tabs.find((t) => t.id === activeId)

    return {
      activeFilePath:    activeTab?.filePath    ?? '',
      activeFileContent: '',   // content lives in contentCache, not store
      selectedText:      null, // populated by Monaco event if selection exists
      cursorLine:        activeTab?.cursorLine  ?? 1,
      language:          activeTab?.language    ?? 'plaintext',
      diagnostics:       edRef.current.getAllDiagnostics(),
      projectRoot:       rootRef.current ?? '',
      openTabs:          tabs.map((t) => t.filePath),
    }
  }, [])

  // ── Send message ──────────────────────────────────────────────────────────
  const sendMessage = useCallback(async (content: string, conversationId: string) => {
    const context = buildContext()
    const conv    = aiStore.conversations.get(conversationId)
    const history = conv ? conv.messages : []

    // Add user message
    const userMsg: AIMessage = {
      id:        generateId(),
      role:      'user',
      content,
      status:    'complete',
      timestamp: Date.now(),
    }
    aiRef.current.addMessage(conversationId, userMsg)

    // Add placeholder assistant message
    const assistantId = generateId()
    const assistantMsg: AIMessage = {
      id:        assistantId,
      role:      'assistant',
      content:   '',
      status:    'streaming',
      timestamp: Date.now(),
    }
    aiRef.current.addMessage(conversationId, assistantMsg)

    // Send via IPC — pass history
    const res = await window.varta.ai.sendMessage({
      conversationId,
      message: content,
      model:   modelRef.current,
      context,
      history,
    })

    if (!isIPCSuccess(res)) {
      aiRef.current.setStreamError(conversationId, assistantId, res.error.code)
      notifyError(`AI Error: ${res.error.message}`)
    }
  }, [buildContext, notifyError])

  // ── Cancel stream ─────────────────────────────────────────────────────────
  const cancelStream = useCallback(async (conversationId: string) => {
    await window.varta.ai.cancelStream(conversationId).catch(() => {})
    aiRef.current.setStreamError(conversationId, '', 'ERR_AI_CANCELLED')
  }, [])

  return { sendMessage, cancelStream, buildContext }
}
