import React, { useCallback } from 'react'
import { cn } from '../../utils/cn'
import { useNotificationStore } from '../../store/notificationStore'
import { useTerminalStore } from '../../store/terminalStore'
import { useFileTreeStore } from '../../store/fileTreeStore'
import type { AIMessage } from '../../../shared/types/ai.types'

export interface AIChatMessageProps {
  message:     AIMessage
  isStreaming: boolean
}

// Parse <varta:replace>, <varta:newfile>, <varta:terminal> tags
function parseContent(content: string) {
  const parts: Array<{
    type: 'text' | 'code' | 'replace' | 'newfile' | 'terminal'
    content: string
    lang?: string
    path?: string
  }> = []

  // Split on varta: tags and code blocks
  const regex = /```(\w*)\n?([\s\S]*?)```|<varta:replace>([\s\S]*?)<\/varta:replace>|<varta:newfile path="([^"]*)">([\s\S]*?)<\/varta:newfile>|<varta:terminal>([\s\S]*?)<\/varta:terminal>/g
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = regex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: 'text', content: content.slice(lastIndex, match.index) })
    }

    if (match[1] !== undefined) {
      // Code block
      parts.push({ type: 'code', content: match[2], lang: match[1] || 'text' })
    } else if (match[3] !== undefined) {
      parts.push({ type: 'replace', content: match[3] })
    } else if (match[4] !== undefined) {
      parts.push({ type: 'newfile', content: match[5], path: match[4] })
    } else if (match[6] !== undefined) {
      parts.push({ type: 'terminal', content: match[6].trim() })
    }

    lastIndex = match.index + match[0].length
  }

  if (lastIndex < content.length) {
    parts.push({ type: 'text', content: content.slice(lastIndex) })
  }

  return parts
}

// Simple markdown → HTML (bold, italic, inline code, lists)
function renderMarkdown(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>')
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>')
    .replace(/\n/g, '<br/>')
}

export function AIChatMessage({ message, isStreaming }: AIChatMessageProps) {
  const { success, error: notifyError } = useNotificationStore()
  const { activeTerminalId } = useTerminalStore()
  const { rootPath } = useFileTreeStore()

  const isUser = message.role === 'user'
  const parts  = isUser ? null : parseContent(message.content)

  const handleCopy = useCallback((text: string) => {
    navigator.clipboard.writeText(text).then(() => success('Copied to clipboard', 1500)).catch(() => {})
  }, [success])

  const handleApply = useCallback((code: string) => {
    window.dispatchEvent(new CustomEvent('varta:ai-apply', { detail: { code } }))
    success('Applied to editor', 1500)
  }, [success])

  const handleRun = useCallback((cmd: string) => {
    if (!activeTerminalId) { notifyError('No active terminal'); return }
    window.varta.terminal.write({ id: activeTerminalId, data: cmd + '\r' }).catch(() => {})
    window.dispatchEvent(new CustomEvent('varta:show-terminal'))
    success('Running in terminal', 1500)
  }, [activeTerminalId, success, notifyError])

  const handleCreateFile = useCallback(async (filePath: string, code: string) => {
    if (!rootPath) { notifyError('No folder open'); return }
    const fullPath = `${rootPath}/${filePath}`.replace(/\\/g, '/')
    const res = await window.varta.fs.writeFile({ path: fullPath, content: code, createDirs: true })
    if (res.success) {
      success(`Created ${filePath}`, 2000)
      window.dispatchEvent(new CustomEvent('varta:refresh-tree'))
    } else {
      notifyError(`Failed to create file: ${res.error.message}`)
    }
  }, [rootPath, success, notifyError])

  if (isUser) {
    return (
      <div className="flex justify-end px-3 py-2">
        <div className="max-w-[85%] bg-[#2d2d2d] rounded-lg px-3 py-2 text-sm text-[#d4d4d4] whitespace-pre-wrap break-words">
          {message.content}
        </div>
      </div>
    )
  }

  return (
    <div className="px-3 py-2 group">
      {/* Assistant icon */}
      <div className="flex items-center gap-2 mb-1.5">
        <div className="w-5 h-5 rounded bg-[#1b2d3e] flex items-center justify-center shrink-0">
          <svg width="10" height="10" viewBox="0 0 16 16" fill="currentColor" className="text-[#569cd6]">
            <path d="M8 1l1.5 4.5L14 7l-4.5 1.5L8 13l-1.5-4.5L2 7l4.5-1.5L8 1z"/>
          </svg>
        </div>
        <span className="text-[10px] text-[#6e6e6e]">Varta</span>
        <button
          onClick={() => handleCopy(message.content)}
          className="opacity-0 group-hover:opacity-100 ml-auto text-[#6e6e6e] hover:text-[#d4d4d4] transition-all"
          title="Copy message"
        >
          <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
            <path d="M4 4l1-1h5.414L14 6.586V14l-1 1H5l-1-1V4zm1 0v9h8V7h-3V4H5zm6 0v2h2l-2-2zM3 1L2 2v9l1 1V2h6l-1-1H3z"/>
          </svg>
        </button>
      </div>

      {/* Content */}
      <div className="text-sm text-[#d4d4d4] space-y-2 ml-7">
        {parts?.map((part, i) => {
          if (part.type === 'text') {
            return (
              <div
                key={i}
                className="leading-relaxed"
                dangerouslySetInnerHTML={{ __html: renderMarkdown(part.content) }}
              />
            )
          }

          if (part.type === 'code' || part.type === 'replace' || part.type === 'newfile') {
            return (
              <div key={i} className="rounded border border-[#333333] overflow-hidden">
                {/* Code header */}
                <div className="flex items-center justify-between px-3 py-1 bg-[#2d2d2d] border-b border-[#333333]">
                  <span className="text-[10px] text-[#6e6e6e] font-mono">
                    {part.type === 'newfile' ? part.path : (part.lang || 'code')}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <ActionBtn onClick={() => handleCopy(part.content)} label="Copy" />
                    {(part.type === 'replace') && (
                      <ActionBtn onClick={() => handleApply(part.content)} label="Apply" accent />
                    )}
                    {part.type === 'newfile' && part.path && (
                      <ActionBtn onClick={() => handleCreateFile(part.path!, part.content)} label="Create File" accent />
                    )}
                  </div>
                </div>
                <pre className="px-3 py-2 text-xs font-mono text-[#d4d4d4] bg-[#1a1a1a] overflow-x-auto whitespace-pre">
                  {part.content}
                </pre>
              </div>
            )
          }

          if (part.type === 'terminal') {
            return (
              <div key={i} className="rounded border border-[#333333] overflow-hidden">
                <div className="flex items-center justify-between px-3 py-1 bg-[#2d2d2d] border-b border-[#333333]">
                  <span className="text-[10px] text-[#6e6e6e]">terminal</span>
                  <ActionBtn onClick={() => handleRun(part.content)} label="Run" accent />
                </div>
                <pre className="px-3 py-2 text-xs font-mono text-[#4ec9b0] bg-[#1a1a1a]">
                  $ {part.content}
                </pre>
              </div>
            )
          }

          return null
        })}

        {/* Streaming cursor */}
        {isStreaming && message.status === 'streaming' && (
          <span className="inline-block w-2 h-4 bg-[#569cd6] animate-pulse ml-0.5 align-middle" />
        )}

        {/* Error state */}
        {message.status === 'error' && (
          <p className="text-xs text-[#f44747]">
            Error: {message.errorCode ?? 'Request failed'}
          </p>
        )}
      </div>
    </div>
  )
}

function ActionBtn({ onClick, label, accent }: { onClick: () => void; label: string; accent?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'text-[10px] px-1.5 py-0.5 rounded border transition-colors',
        accent
          ? 'border-[#569cd6] text-[#569cd6] hover:bg-[#1b2d3e]'
          : 'border-[#555555] text-[#6e6e6e] hover:text-[#d4d4d4]',
      )}
    >
      {label}
    </button>
  )
}
