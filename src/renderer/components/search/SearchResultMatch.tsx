import React from 'react'
import { cn } from '../../utils/cn'
import type { SearchMatch } from '../../../shared/types/search.types'

export interface SearchResultMatchProps {
  match:     SearchMatch
  filePath:  string
  queryText: string
  isRegex:   boolean
  onClick:   () => void
}

export function SearchResultMatch({
  match,
  filePath,
  queryText,
  isRegex,
  onClick,
}: SearchResultMatchProps) {
  // Build highlighted line: split at match start/end
  const { lineText, matchStart, matchEnd, lineNumber } = match
  const before  = lineText.slice(0, matchStart).trimStart()
  const matched = lineText.slice(matchStart, matchEnd)
  const after   = lineText.slice(matchEnd)

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}
      className={cn(
        'flex items-start gap-2 px-3 py-0.5 cursor-pointer select-none',
        'hover:bg-[#2a2d2e] focus:outline-none focus:bg-[#2a2d2e]',
        'group text-xs',
      )}
      style={{ paddingLeft: 36 }}
      title={lineText.trim()}
    >
      {/* Line number */}
      <span className="shrink-0 text-[#6e6e6e] w-8 text-right font-mono">
        {lineNumber}
      </span>

      {/* Line content with match highlighted */}
      <span className="flex-1 min-w-0 truncate font-mono text-[#d4d4d4]">
        <span className="text-[#6e6e6e]">{before}</span>
        <span className="font-semibold text-[#d4d4d4] bg-[#264f78] rounded-sm px-0.5">
          {matched}
        </span>
        <span className="text-[#6e6e6e]">{after}</span>
      </span>
    </div>
  )
}
