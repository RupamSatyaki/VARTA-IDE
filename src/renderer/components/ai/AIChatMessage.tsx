import React, { useCallback } from 'react'
import { cn } from '../../utils/cn'
import { useNotificationStore } from '../../store/notificationStore'
import { useTerminalStore }     from '../../store/terminalStore'
import { useFileTreeStore }     from '../../store/fileTreeStore'
import { FontAwesomeIcon }      from '@fortawesome/react-fontawesome'
import { faCopy, faPlay, faFileCirclePlus, faWandMagicSparkles } from '@fortawesome/free-solid-svg-icons'
import type { AIMessage } from '../../../shared/types/ai.types'

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
      <div className="flex justify-end px-3 py-2">
        <div className="max-w-[88%] bg-[#7c3aed]/20 border border-[#7c3aed]/30 rounded-2xl rounded-tr-sm
          px-3.5 py-2.5 text-[12px] text-[#e0d0ff] whitespace-pre-wrap break-words leading-relaxed">
          {message.content}
        </div>
      </div>
    )
  }

  // Assistant message
  return (
    <div className="px-3 py-2.5 group">
      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
        <div className="w-5 h-5 rounded-md flex items-center justify-center shrink-0
          bg-gradient-to-br from-[#7c3aed] to-[#a855f7]">
          <FontAwesomeIcon icon={faWandMagicSparkles} style={{ fontSize: 9 }} className="text-white" />
        </div>
        <span className="text-[10px] font-semibold text-[#7c5a9a]">Varta AI</span>
        <button
          onClick={() => handleCopy(message.content)}
          className="opacity-0 group-hover:opacity-100 ml-auto text-[#5a4a6a] hover:text-[#cccccc] transition-all"
          title="Copy message"
        >
          <FontAwesomeIcon icon={faCopy} style={{ fontSize: 10 }} />
        </button>
      </div>

      {/* Content */}
      <div className="text-[12px] text-[#cccccc] space-y-2.5 ml-7">
        {parts?.map((part, i) => {
          if (part.type === 'text') {
            return (
              <div key={i} className="leading-relaxed"
                dangerouslySetInnerHTML={{ __html: renderMarkdown(part.content) }} />
            )
          }

          if (part.type === 'code' || part.type === 'replace' || part.type === 'newfile') {
            return (
              <div key={i} className="rounded-xl border border-[#3a2f45] overflow-hidden">
                <div className="flex items-center justify-between px-3 py-1.5 bg-[#1e1a24] border-b border-[#2a1f30]">
                  <span className="text-[10px] text-[#6e5a7a] font-mono">
                    {part.type === 'newfile' ? part.path : (part.lang || 'code')}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <CodeBtn onClick={() => handleCopy(part.content)} icon={faCopy} label="Copy" />
                    {part.type === 'replace' && (
                      <CodeBtn onClick={() => handleApply(part.content)} icon={faPlay} label="Apply" accent />
                    )}
                    {part.type === 'newfile' && part.path && (
                      <CodeBtn onClick={() => handleCreateFile(part.path!, part.content)} icon={faFileCirclePlus} label="Create" accent />
                    )}
                  </div>
                </div>
                <pre className="px-3 py-2.5 text-[11px] font-mono text-[#cccccc] bg-[#12101a] overflow-x-auto whitespace-pre leading-relaxed">
                  {part.content}
                </pre>
              </div>
            )
          }

          if (part.type === 'terminal') {
            return (
              <div key={i} className="rounded-xl border border-[#3a2f45] overflow-hidden">
                <div className="flex items-center justify-between px-3 py-1.5 bg-[#1e1a24] border-b border-[#2a1f30]">
                  <span className="text-[10px] text-[#6e5a7a]">terminal</span>
                  <CodeBtn onClick={() => handleRun(part.content)} icon={faPlay} label="Run" accent />
                </div>
                <pre className="px-3 py-2.5 text-[11px] font-mono text-[#a6e3a1] bg-[#12101a]">
                  $ {part.content}
                </pre>
              </div>
            )
          }
          return null
        })}

        {/* Streaming cursor */}
        {isStreaming && message.status === 'streaming' && (
          <span className="inline-block w-1.5 h-4 bg-[#c084fc] animate-pulse ml-0.5 align-middle rounded-sm" />
        )}

        {/* Error */}
        {message.status === 'error' && (
          <p className="text-[11px] text-[#f87171] bg-[#f87171]/10 border border-[#f87171]/20 rounded-lg px-3 py-2">
            ⚠ {message.errorCode ?? 'Request failed'}
          </p>
        )}
      </div>
    </div>
  )
}

function CodeBtn({ onClick, icon, label, accent }: {
  onClick: () => void; icon: any; label: string; accent?: boolean
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-md border transition-all duration-150',
        accent
          ? 'border-[#7c3aed]/50 text-[#c084fc] hover:bg-[#7c3aed]/20'
          : 'border-[#3a2f45] text-[#5a4a6a] hover:text-[#cccccc] hover:border-[#5a4a6a]',
      )}
    >
      <FontAwesomeIcon icon={icon} style={{ fontSize: 9 }} />
      {label}
    </button>
  )
}
