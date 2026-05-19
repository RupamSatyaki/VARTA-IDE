import React from 'react'
import { cn } from '../../utils/cn'
import type { Diagnostic } from '../../../shared/types/editor.types'

export interface ProblemItemProps {
  diagnostic: Diagnostic
  filePath:   string
  rootPath?:  string
  onClick:    () => void
}

const SEVERITY_ICON: Record<string, React.ReactNode> = {
  error: (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor" className="text-varta-error shrink-0">
      <path d="M8 1a7 7 0 100 14A7 7 0 008 1zm0 1a6 6 0 110 12A6 6 0 018 2zm-.5 3v5h1V6h-1zm0 6v1h1v-1h-1z"/>
    </svg>
  ),
  warning: (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor" className="text-varta-warning shrink-0">
      <path d="M7.56 1h.88l6.54 12.26-.44.74H1.44L1 13.26 7.56 1zM8 2.28L2.28 13H13.72L8 2.28zM8.625 12v-1h-1.25v1h1.25zm-1.25-2V6h1.25v4h-1.25z"/>
    </svg>
  ),
  info: (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor" className="text-varta-info shrink-0">
      <path d="M8 1a7 7 0 100 14A7 7 0 008 1zm0 1a6 6 0 110 12A6 6 0 018 2zm-.5 3v1h1V6h-1zm0 2v5h1V8h-1z"/>
    </svg>
  ),
  hint: (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor" className="text-varta-success shrink-0">
      <path d="M8 1a7 7 0 100 14A7 7 0 008 1zm0 1a6 6 0 110 12A6 6 0 018 2zm-.5 3v1h1V6h-1zm0 2v5h1V8h-1z"/>
    </svg>
  ),
}

export function ProblemItem({ diagnostic, filePath, rootPath, onClick }: ProblemItemProps) {
  const filename = filePath.replace(/\\/g, '/').split('/').pop() ?? filePath
  const relPath  = rootPath
    ? filePath.replace(/\\/g, '/').replace(rootPath.replace(/\\/g, '/'), '').replace(/^\//, '')
    : filePath
  const line = (diagnostic.range.startLine ?? 0) + 1
  const col  = (diagnostic.range.startColumn ?? 0) + 1

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}
      className="flex items-start gap-2.5 px-3 py-1.5 cursor-pointer hover:bg-white/5 focus:outline-none focus:bg-white/5 transition-colors group border-b border-transparent hover:border-varta-border"
    >
      {/* Severity icon */}
      <div className="mt-1 shrink-0">{SEVERITY_ICON[diagnostic.severity] ?? SEVERITY_ICON.info}</div>

      {/* Message */}
      <div className="flex-1 min-w-0 py-0.5">
        <p className="text-[12px] text-varta-text group-hover:text-white leading-relaxed break-words" title={diagnostic.message}>
          {diagnostic.message}
        </p>
        {diagnostic.source && (
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-[10px] text-varta-text-faint bg-white/5 px-1 rounded-sm">{diagnostic.source}</span>
          </div>
        )}
      </div>

      {/* File + location */}
      <div className="shrink-0 text-right pt-0.5 opacity-60 group-hover:opacity-100 transition-opacity">
        <p className="text-[10px] text-varta-text-muted truncate max-w-[150px]" title={relPath}>{filename}</p>
        <p className="text-[10px] text-varta-text-faint font-mono mt-0.5">{line}:{col}</p>
      </div>
    </div>
  )
}
