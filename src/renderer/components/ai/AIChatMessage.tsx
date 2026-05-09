import React, { useCallback } from 'react'
import { useNotificationStore } from '../../store/notificationStore'
import { useTerminalStore }     from '../../store/terminalStore'
import { useFileTreeStore }     from '../../store/fileTreeStore'
import { FontAwesomeIcon }      from '@fortawesome/react-fontawesome'
import { faCopy, faWandMagicSparkles } from '@fortawesome/free-solid-svg-icons'
import type { AIMessage } from '../../../shared/types/ai.types'
import { CodeBlock } from './Shared/CodeBlock'

export interface AIChatMessageProps {
  message:     AIMessage
  isStreaming: boolean
}

function parseContent(content: string) {
  const parts: Array<{
    type: 'text' | 'code' | 'replace' | 'newfile' | 'terminal'
    content: string; lang?: string; path?: string
  }> = []
  const regex = /```(\w*)\n?([\s\S]*?)```|<varta:replace>([\s\S]*?)<\/varta:replace>|<varta:newfile path="([^"]*)">([\s\S]*?)<\/varta:newfile>|<varta:terminal>([\s\S]*?)<\/varta:terminal>/g
  let lastIndex = 0; let match: RegExpExecArray | null
  while ((match = regex.exec(content)) !== null) {
    if (match.index > lastIndex) parts.push({ type: 'text', content: content.slice(lastIndex, match.index) })
    if (match[1] !== undefined)  parts.push({ type: 'code',     content: match[2], lang: match[1] || 'text' })
    else if (match[3] !== undefined) parts.push({ type: 'replace',  content: match[3] })
    else if (match[4] !== undefined) parts.push({ type: 'newfile',  content: match[5], path: match[4] })
    else if (match[6] !== undefined) parts.push({ type: 'terminal', content: match[6].trim() })
    lastIndex = match.index + match[0].length
  }
  if (lastIndex < content.length) parts.push({ type: 'text', content: content.slice(lastIndex) })
  return parts
}

function renderMarkdown(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>')
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/\n/g, '<br/>')
}

export function AIChatMessage({ message, isStreaming }: AIChatMessageProps) {
  const { success, error: notifyError } = useNotificationStore()
  const { activeTerminalId } = useTerminalStore()
  const { rootPath } = useFileTreeStore()
  const isUser = message.role === 'user'
  const parts  = isUser ? null : parseContent(message.content)

  const handleCopy = useCallback((text: string) => {
    navigator.clipboard.writeText(text).then(() => success('Copied', 1500)).catch(() => {})
  }, [success])

  const handleApply = useCallback((code: string) => {
    window.dispatchEvent(new CustomEvent('varta:ai-apply', { detail: { code } }))
    success('Applied to editor', 1500)
  }, [success])

  const handleRun = useCallback((cmd: string) => {
    if (!activeTerminalId) { notifyError('No active terminal'); return }
    window.varta.terminal.write({ id: activeTerminalId, data: cmd + '\r' }).catch(() => {})
    success('Running in terminal', 1500)
  }, [activeTerminalId, success, notifyError])

  const handleCreateFile = useCallback(async (filePath: string, code: string) => {
    if (!rootPath) { notifyError('No folder open'); return }
    const fullPath = `${rootPath}/${filePath}`.replace(/\\/g, '/')
    const res = await window.varta.fs.writeFile({ path: fullPath, content: code, createDirs: true })
    if (res.success) { success(`Created ${filePath}`, 2000) }
    else { notifyError(`Failed: ${res.error.message}`) }
  }, [rootPath, success, notifyError])

  // User message
  if (isUser) {
    return (
      <div className="flex justify-end px-3 py-2 animate-in slide-in-from-right-2 duration-300">
        <div className="max-w-[88%] bg-[#7c3aed]/15 border border-[#7c3aed]/30 rounded-2xl rounded-tr-sm
          px-4 py-2.5 text-[13px] text-[#e0d0ff] whitespace-pre-wrap break-words leading-relaxed shadow-sm shadow-[#7c3aed]/5">
          {message.content}
        </div>
      </div>
    )
  }

  // Assistant message
  return (
    <div className="px-3 py-3 group animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center gap-2.5 mb-2.5 ml-1">
        <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0
          bg-gradient-to-br from-[#7c3aed] to-[#a855f7] shadow-lg shadow-[#7c3aed]/20">
          <FontAwesomeIcon icon={faWandMagicSparkles} style={{ fontSize: 10 }} className="text-white" />
        </div>
        <span className="text-[11px] font-bold text-[#8e7a9a] uppercase tracking-wider">Varta Intelligence</span>
        <button
          onClick={() => handleCopy(message.content)}
          className="opacity-0 group-hover:opacity-100 ml-auto text-[#5a4a6a] hover:text-[#cccccc] transition-all p-1"
          title="Copy message"
        >
          <FontAwesomeIcon icon={faCopy} style={{ fontSize: 10 }} />
        </button>
      </div>

      {/* Content */}
      <div className="text-[13px] text-[#cccccc] space-y-3 ml-8">
        {parts?.map((part, i) => {
          if (part.type === 'text') {
            return (
              <div key={i} className="leading-relaxed opacity-90"
                dangerouslySetInnerHTML={{ __html: renderMarkdown(part.content) }} />
            )
          }

          return (
            <CodeBlock
              key={i}
              content={part.content}
              lang={part.lang}
              type={part.type as any}
              path={part.path}
              onCopy={handleCopy}
              onApply={handleApply}
              onCreateFile={handleCreateFile}
              onRunTerminal={handleRun}
            />
          )
        })}

        {/* Streaming cursor */}
        {isStreaming && message.status === 'streaming' && (
          <span className="inline-block w-1.5 h-4 bg-[#c084fc] animate-pulse ml-1 align-middle rounded-sm shadow-[0_0_8px_rgba(192,132,252,0.5)]" />
        )}

        {/* Error */}
        {message.status === 'error' && (
          <p className="text-[11px] font-medium text-[#f87171] bg-[#f87171]/5 border border-[#f87171]/20 rounded-xl px-4 py-2.5 shadow-sm">
            ⚠ {message.errorCode ?? 'Request failed'}
          </p>
        )}
      </div>
    </div>
  )
}
