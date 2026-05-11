import React from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCopy, faPlay, faFileCirclePlus, faColumns } from '@fortawesome/free-solid-svg-icons'
import { cn } from '../../../utils/cn'

interface CodeBlockProps {
  content: string
  lang?: string
  type: 'code' | 'replace' | 'newfile' | 'terminal'
  path?: string
  onCopy: (text: string) => void
  onApply?: (code: string) => void
  onDiff?: (path: string, code: string) => void
  onCreateFile?: (path: string, code: string) => void
  onRunTerminal?: (cmd: string) => void
}

export function CodeBlock({
  content,
  lang,
  type,
  path,
  onCopy,
  onApply,
  onDiff,
  onCreateFile,
  onRunTerminal
}: CodeBlockProps) {
  return (
    <div className="group/code rounded-xl border border-[#3a2f45] overflow-hidden my-2 transition-all hover:border-[#7c3aed]/30 shadow-lg">
      <div className="flex items-center justify-between px-3 py-1.5 bg-[#1e1a24]/80 backdrop-blur-md border-b border-[#2a1f30]">
        <span className="text-[10px] text-[#8e7a9a] font-mono tracking-tight">
          {type === 'newfile' ? path : (lang || 'code')}
        </span>
        <div className="flex items-center gap-1.5">
          <CodeBtn onClick={() => onCopy(content)} icon={faCopy} label="Copy" />
          
          {type === 'replace' && onDiff && path && (
            <CodeBtn onClick={() => onDiff(path, content)} icon={faColumns} label="Diff" />
          )}

          {type === 'replace' && onApply && (
            <CodeBtn onClick={() => onApply(content)} icon={faPlay} label="Apply" accent />
          )}
          
          {type === 'newfile' && path && onCreateFile && (
            <CodeBtn onClick={() => onCreateFile(path, content)} icon={faFileCirclePlus} label="Create" accent />
          )}

          {type === 'terminal' && onRunTerminal && (
            <CodeBtn onClick={() => onRunTerminal(content)} icon={faPlay} label="Run" accent />
          )}
        </div>
      </div>
      <div className="relative">
        <pre className="px-3 py-3 text-[11px] font-mono text-[#e0e0e0] bg-[#12101a]/90 overflow-x-auto whitespace-pre leading-relaxed scrollbar-thin scrollbar-thumb-[#3a2f45]">
          {type === 'terminal' && <span className="text-[#a6e3a1] mr-2">$</span>}
          {content}
        </pre>
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
        'flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border transition-all duration-200',
        accent
          ? 'border-[#7c3aed]/40 text-[#c084fc] hover:bg-[#7c3aed]/20 hover:border-[#7c3aed]/60'
          : 'border-[#3a2f45] text-[#6e5a7a] hover:text-[#cccccc] hover:border-[#5a4a6a]',
      )}
    >
      <FontAwesomeIcon icon={icon} className="opacity-70" />
      {label}
    </button>
  )
}
