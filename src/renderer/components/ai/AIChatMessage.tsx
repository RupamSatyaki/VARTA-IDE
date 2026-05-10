import React, { useCallback } from 'react'
import { useNotificationStore } from '../../store/notificationStore'
import { useTerminalStore }     from '../../store/terminalStore'
import { useFileTreeStore }     from '../../store/fileTreeStore'
import { FontAwesomeIcon }      from '@fortawesome/react-fontawesome'
import { faCopy, faWandMagicSparkles, faCompass } from '@fortawesome/free-solid-svg-icons'
import type { AIMessage } from '../../../shared/types/ai.types'
import { CodeBlock } from './Shared/CodeBlock'
import { ActionCard } from './Shared/ActionCard'
import { ToolCard } from './Shared/ToolCard'
import { motion, AnimatePresence } from 'framer-motion'

export interface AIChatMessageProps {
  message:     AIMessage
  isStreaming: boolean
}

function parseContent(content: string) {
  const parts: Array<{
    type: 'text' | 'code' | 'replace' | 'newfile' | 'terminal' | 'created' | 'modified' | 'tool_start' | 'tool_end'
    content: string; lang?: string; path?: string; name?: string; input?: string; status?: 'success' | 'error'; result?: string
  }> = []
  
  const regex = /```(\w*)\n?([\s\S]*?)```|<varta:replace>([\s\S]*?)<\/varta:replace>|<varta:newfile path="([^"]*)">([\s\S]*?)<\/varta:newfile>|<varta:terminal>([\s\S]*?)<\/varta:terminal>|<varta:created path="([^"]*)".*?\/>|<varta:modified path="([^"]*)".*?\/>|<varta:tool_start name="([^"]*)" input='([^']*)'\/?>|<varta:tool_end name="([^"]*)" status="([^"]*)" result='([^']*)'\/?>/g
  
  let lastIndex = 0; let match: RegExpExecArray | null
  while ((match = regex.exec(content)) !== null) {
    if (match.index > lastIndex) parts.push({ type: 'text', content: content.slice(lastIndex, match.index) })
    
    if (match[1] !== undefined)  parts.push({ type: 'code', content: match[2], lang: match[1] || 'text' })
    else if (match[3] !== undefined) parts.push({ type: 'replace',  content: match[3] })
    else if (match[4] !== undefined) parts.push({ type: 'newfile',  content: match[5], path: match[4] })
    else if (match[6] !== undefined) parts.push({ type: 'terminal', content: match[6].trim() })
    else if (match[7] !== undefined) parts.push({ type: 'created',  content: '', path: match[7] })
    else if (match[8] !== undefined) parts.push({ type: 'modified', content: '', path: match[8] })
    else if (match[9] !== undefined) parts.push({ type: 'tool_start', content: '', name: match[9], input: match[10] })
    else if (match[11] !== undefined) parts.push({ type: 'tool_end', content: '', name: match[11], status: match[12] as any, result: match[13] })
    
    lastIndex = match.index + match[0].length
  }
  if (lastIndex < content.length) parts.push({ type: 'text', content: content.slice(lastIndex) })
  return parts
}

function renderMarkdown(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong class="text-[#f3e8ff] font-bold">$1</strong>')
    .replace(/\*(.+?)\*/g, '<em class="text-[#d8b4fe] italic">$1</em>')
    .replace(/`([^`]+)`/g, '<code class="bg-[#1e1a24] px-1.5 py-0.5 rounded text-[#c084fc] font-mono text-[12px] border border-[#7c3aed]/20">$1</code>')
    .replace(/^- (.+)$/gm, '<li class="ml-4 mb-1 list-disc">$1</li>')
    .replace(/\n/g, '<br/>')
}

export function AIChatMessage({ message, isStreaming }: AIChatMessageProps) {
  const { success, error: notifyError } = useNotificationStore()
  const { activeTerminalId } = useTerminalStore()
  const { rootPath } = useFileTreeStore()
  const isUser = message.role === 'user'
  
  // Group tool_start and tool_end for the same tool into one ToolCard
  const rawParts = isUser ? null : parseContent(message.content)
  const parts: typeof rawParts = []
  
  if (rawParts) {
    const toolMap = new Map<string, any>()
    for (const part of rawParts) {
      if (part.type === 'tool_start') {
        toolMap.set(part.name!, part)
        parts.push(part)
      } else if (part.type === 'tool_end') {
        const startPart = toolMap.get(part.name!)
        if (startPart) {
          startPart.status = part.status
          startPart.result = part.result
        } else {
          parts.push(part)
        }
      } else {
        parts.push(part)
      }
    }
  }

  const handleCopy = useCallback((text: string) => {
    navigator.clipboard.writeText(text).then(() => success('Copied to clipboard', 1500)).catch(() => {})
  }, [success])

  const handleApply = useCallback((code: string) => {
    window.dispatchEvent(new CustomEvent('varta:ai-apply', { detail: { code } }))
    success('Applied changes to editor', 1500)
  }, [success])

  const handleRun = useCallback((cmd: string) => {
    if (!activeTerminalId) { notifyError('No active terminal found'); return }
    window.varta.terminal.write({ id: activeTerminalId, data: cmd + '\r' }).catch(() => {})
    success('Executing in terminal', 1500)
  }, [activeTerminalId, success, notifyError])

  const handleCreateFile = useCallback(async (filePath: string, code: string) => {
    if (!rootPath) { notifyError('Please open a workspace first'); return }
    const fullPath = `${rootPath}/${filePath}`.replace(/\\/g, '/')
    const res = await window.varta.fs.writeFile({ path: fullPath, content: code, createDirs: true })
    if (res.success) { success(`Successfully created ${filePath}`, 2000) }
    else { notifyError(`Error creating file: ${res.error.message}`) }
  }, [rootPath, success, notifyError])

  // User message
  if (isUser) {
    return (
      <motion.div 
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex justify-end px-3 py-2"
      >
        <div className="max-w-[88%] bg-[#7c3aed]/20 border border-[#7c3aed]/40 rounded-2xl rounded-tr-sm
          px-4 py-3 text-[13px] text-[#e9d5ff] whitespace-pre-wrap break-words leading-relaxed shadow-lg shadow-[#7c3aed]/5">
          {message.content}
        </div>
      </motion.div>
    )
  }

  // Assistant message
  return (
    <div className="px-3 py-4 group">
      {/* Header */}
      <div className="flex items-center gap-3 mb-3 ml-1">
        <div className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0
          bg-gradient-to-br from-[#7c3aed] via-[#9333ea] to-[#a855f7] shadow-xl shadow-[#7c3aed]/30 border border-white/10">
          <FontAwesomeIcon icon={faWandMagicSparkles} style={{ fontSize: 11 }} className="text-white" />
        </div>
        <div className="flex flex-col">
          <span className="text-[11px] font-black text-[#a855f7] uppercase tracking-[0.1em]">Varta Intelligence</span>
          {/* Breadcrumbs Placeholder */}
          <div className="flex items-center gap-1.5 mt-0.5">
            <FontAwesomeIcon icon={faCompass} className="text-[#4a3a5a] text-[9px]" />
            <span className="text-[9px] text-[#5a4a6a] font-bold uppercase tracking-tighter">Thinking in Context</span>
          </div>
        </div>
        <button
          onClick={() => handleCopy(message.content)}
          className="opacity-0 group-hover:opacity-100 ml-auto w-7 h-7 rounded-lg bg-[#1e1a24] border border-[#2a1f30] text-[#5a4a6a] hover:text-[#c084fc] hover:border-[#7c3aed]/50 transition-all flex items-center justify-center"
          title="Copy message"
        >
          <FontAwesomeIcon icon={faCopy} style={{ fontSize: 10 }} />
        </button>
      </div>

      {/* Content */}
      <div className="text-[13px] text-[#b0b0b0] space-y-4 ml-10">
        <AnimatePresence mode="popLayout">
          {parts?.map((part, i) => {
            if (part.type === 'text') {
              return (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="leading-[1.7] font-medium"
                  dangerouslySetInnerHTML={{ __html: renderMarkdown(part.content) }} 
                />
              )
            }

            if (part.type === 'tool_start') {
              return (
                <ToolCard 
                  key={i} 
                  name={part.name!} 
                  input={part.input!} 
                  status={part.status || 'running'} 
                  result={part.result}
                />
              )
            }

            if (part.type === 'created' || part.type === 'modified') {
              return (
                <ActionCard 
                  key={i} 
                  path={part.path!} 
                  type={part.type === 'created' ? 'create_file' : 'modify_file'} 
                />
              )
            }

            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <CodeBlock
                  content={part.content}
                  lang={part.lang}
                  type={part.type as any}
                  path={part.path}
                  onCopy={handleCopy}
                  onApply={handleApply}
                  onCreateFile={handleCreateFile}
                  onRunTerminal={handleRun}
                />
              </motion.div>
            )
          })}
        </AnimatePresence>

        {/* Streaming cursor */}
        {isStreaming && message.status === 'streaming' && (
          <motion.span 
            animate={{ opacity: [1, 0, 1] }}
            transition={{ duration: 0.8, repeat: Infinity }}
            className="inline-block w-2 h-4 bg-[#c084fc] ml-1 align-middle rounded-sm shadow-[0_0_12px_rgba(192,132,252,0.6)]" 
          />
        )}

        {/* Error */}
        {message.status === 'error' && (
          <motion.p 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-[11px] font-bold text-[#f87171] bg-[#450a0a]/50 border border-[#991b1b]/50 rounded-xl px-4 py-3 shadow-xl backdrop-blur-sm"
          >
            ⚠ {message.errorCode ?? 'Intelligence service unreachable. Please check your connection or API key.'}
          </motion.p>
        )}
      </div>
    </div>
  )
}
