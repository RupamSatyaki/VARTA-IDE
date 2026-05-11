import React, { useCallback, useMemo } from 'react'
import { useNotificationStore } from '../../store/notificationStore'
import { useTerminalStore }     from '../../store/terminalStore'
import { useFileTreeStore }     from '../../store/fileTreeStore'
import { useEditor }            from '../../hooks/useEditor'
import { FontAwesomeIcon }      from '@fortawesome/react-fontawesome'
import { faCopy, faWandMagicSparkles, faCompass, faClock, faMicrochip, faCheckDouble, faColumns } from '@fortawesome/free-solid-svg-icons'
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
  
  const regex = /```(\w*)\n?([\s\S]*?)```|<varta:replace path="([^"]*)">([\s\S]*?)<\/varta:replace>|<varta:replace>([\s\S]*?)<\/varta:replace>|<varta:newfile path="([^"]*)">([\s\S]*?)<\/varta:newfile>|<varta:terminal>([\s\S]*?)<\/varta:terminal>|<varta:created path="([^"]*)".*?\/>|<varta:modified path="([^"]*)".*?\/>|<varta:tool_start name="([^"]*)" input='([^']*)'\/?>|<varta:tool_end name="([^"]*)" status="([^"]*)" result='([^']*)'\/?>/g
  
  let lastIndex = 0; let match: RegExpExecArray | null
  while ((match = regex.exec(content)) !== null) {
    if (match.index > lastIndex) parts.push({ type: 'text', content: content.slice(lastIndex, match.index) })
    
    if (match[1] !== undefined)  parts.push({ type: 'code', content: match[2], lang: match[1] || 'text' })
    else if (match[3] !== undefined) parts.push({ type: 'replace',  content: match[4], path: match[3] })
    else if (match[5] !== undefined) parts.push({ type: 'replace',  content: match[5] })
    else if (match[6] !== undefined) parts.push({ type: 'newfile',  content: match[7], path: match[6] })
    else if (match[8] !== undefined) parts.push({ type: 'terminal', content: match[8].trim() })
    else if (match[9] !== undefined) parts.push({ type: 'created',  content: '', path: match[9] })
    else if (match[10] !== undefined) parts.push({ type: 'modified', content: '', path: match[10] })
    else if (match[11] !== undefined) parts.push({ type: 'tool_start', content: '', name: match[11], input: match[12] })
    else if (match[13] !== undefined) parts.push({ type: 'tool_end', content: '', name: match[13], status: match[14] as any, result: match[15] })
    
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
    .replace(/^- (.+)$/gm, '<li class="ml-4 mb-1 list-disc text-[#cbd5e1]">$1</li>')
    .replace(/^\d\. (.+)$/gm, '<li class="ml-4 mb-1 list-decimal text-[#cbd5e1]">$1</li>')
    .replace(/\n/g, '<br/>')
}

export function AIChatMessage({ message, isStreaming }: AIChatMessageProps) {
  const { success, error: notifyError } = useNotificationStore()
  const { activeTerminalId } = useTerminalStore()
  const { rootPath } = useFileTreeStore()
  const { openDiff } = useEditor()
  const isUser = message.role === 'user'
  
  const timeStr = useMemo(() => {
    return new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }, [message.timestamp])

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

  const handleDiff = useCallback(async (filePath: string, newContent: string) => {
    if (!rootPath) { notifyError('Please open a workspace first'); return }
    const fullPath = filePath.startsWith('/') || /^[A-Za-z]:/.test(filePath) 
      ? filePath 
      : `${rootPath}/${filePath}`.replace(/\\/g, '/')
      
    const res = await window.varta.fs.readFile(fullPath)
    if (res.success) {
      openDiff(fullPath, res.data.content, newContent)
    } else {
      openDiff(fullPath, '', newContent)
    }
  }, [rootPath, openDiff, notifyError])

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

  if (isUser) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 10, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="flex flex-col items-end px-4 py-2"
      >
        <div className="max-w-[90%] bg-gradient-to-br from-[#7c3aed] to-[#6d28d9] rounded-2xl rounded-tr-none
          px-4 py-3 text-[13px] text-white whitespace-pre-wrap break-words leading-relaxed shadow-xl shadow-[#7c3aed]/10 border border-white/10">
          {message.content}
        </div>
        <div className="flex items-center gap-2 mt-2 px-1 text-[9px] text-[#4a3a5a] font-black uppercase tracking-[0.1em]">
           <span className="flex items-center gap-1 opacity-60">
             <FontAwesomeIcon icon={faClock} className="text-[8px]" />
             {timeStr}
           </span>
           <FontAwesomeIcon icon={faCheckDouble} className="text-[#7c3aed]" />
        </div>
      </motion.div>
    )
  }

  return (
    <div className="px-4 py-6 group relative transition-colors duration-500 hover:bg-[#1e1a24]/20">
      
      {/* Visual Decoration */}
      <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-gradient-to-b from-transparent via-[#7c3aed]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      {/* Header */}
      <div className="flex items-center gap-4 mb-4">
        <div className="relative">
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
            className="absolute -inset-1.5 bg-gradient-to-tr from-[#7c3aed] to-[#06b6d4] rounded-xl opacity-20 blur-sm"
          />
          <div className="relative w-8 h-8 rounded-xl flex items-center justify-center shrink-0
            bg-[#1a1620] border border-[#7c3aed]/30 shadow-2xl">
            <FontAwesomeIcon icon={faWandMagicSparkles} style={{ fontSize: 12 }} className="text-[#a855f7]" />
          </div>
        </div>
        
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-black text-[#f3e8ff] uppercase tracking-[0.15em]">Varta Intelligence</span>
            <span className="px-1.5 py-0.5 rounded-md bg-[#7c3aed]/10 text-[#c084fc] text-[8px] font-bold border border-[#7c3aed]/20 uppercase">AI Assistant</span>
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <FontAwesomeIcon icon={faCompass} className="text-[#7c3aed]/50 text-[9px]" />
            <span className="text-[9px] text-[#5a4a6a] font-bold uppercase tracking-wider">Neural Context Active</span>
          </div>
        </div>

        <div className="ml-auto flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-300">
          <button
            onClick={() => handleCopy(message.content)}
            className="w-8 h-8 rounded-lg bg-[#1a1620] border border-[#2a1f30] text-[#5a4a6a] hover:text-[#c084fc] hover:border-[#7c3aed]/50 transition-all flex items-center justify-center"
            title="Copy message"
          >
            <FontAwesomeIcon icon={faCopy} style={{ fontSize: 10 }} />
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="text-[13px] text-[#cbd5e1] space-y-5 ml-12">
        <AnimatePresence mode="popLayout">
          {parts?.map((part, i) => {
            if (part.type === 'text') {
              return (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="leading-[1.8] font-medium"
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
                  onDiff={handleDiff}
                  onCreateFile={handleCreateFile}
                  onRunTerminal={handleRun}
                />
              </motion.div>
            )
          })}
        </AnimatePresence>

        {/* Streaming Loading State */}
        {isStreaming && message.content.length === 0 && (
          <div className="flex flex-col gap-3 py-2">
            <motion.div 
              animate={{ opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="h-3 w-3/4 bg-[#2a1f30] rounded-full" 
            />
            <motion.div 
              animate={{ opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
              className="h-3 w-1/2 bg-[#2a1f30] rounded-full" 
            />
          </div>
        )}

        {/* Streaming Cursor */}
        {isStreaming && message.status === 'streaming' && message.content.length > 0 && (
          <motion.span 
            animate={{ opacity: [1, 0, 1] }}
            transition={{ duration: 0.8, repeat: Infinity }}
            className="inline-block w-1.5 h-4 bg-[#c084fc] ml-1 align-middle rounded-full shadow-[0_0_15px_rgba(192,132,252,0.8)]" 
          />
        )}

        {/* Footer Metrics */}
        <div className="flex items-center gap-5 mt-4 pt-4 border-t border-[#2a1f30]/50 text-[9px] font-black uppercase tracking-[0.15em] text-[#4a3a5a]">
          <span className="flex items-center gap-1.5 hover:text-[#7c3aed] transition-colors cursor-default">
            <FontAwesomeIcon icon={faClock} style={{ fontSize: 8 }} />
            {timeStr}
          </span>
          {message.tokenCount && message.tokenCount > 0 && (
            <span className="flex items-center gap-1.5 text-[#7c3aed]/80">
              <FontAwesomeIcon icon={faMicrochip} style={{ fontSize: 8 }} />
              {message.tokenCount} Tokens processed
            </span>
          )}
        </div>

        {/* Error States */}
        {message.status === 'error' && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 p-4 rounded-2xl bg-red-500/5 border border-red-500/20 flex gap-3 items-start"
          >
            <div className="w-5 h-5 rounded-full bg-red-500/20 flex items-center justify-center shrink-0 mt-0.5">
              <span className="text-red-400 font-bold text-xs">!</span>
            </div>
            <div>
              <p className="text-[11px] font-bold text-red-400 uppercase tracking-wider mb-1">System Error</p>
              <p className="text-[12px] text-red-400/80 leading-relaxed">
                {message.errorCode ?? 'Intelligence service unreachable. Please check your connection or API key.'}
              </p>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}
