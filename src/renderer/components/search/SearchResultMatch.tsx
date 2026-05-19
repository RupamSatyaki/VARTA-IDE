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

export function SearchResultMatch({ match, onClick }: SearchResultMatchProps) {
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
        'flex items-center gap-2 cursor-pointer select-none group',
        'hover:bg-varta-accent/10 focus:outline-none',
        'text-[11px] py-0.5',
      )}
      style={{ paddingLeft: 40, paddingRight: 12 }}
      title={lineText.trim()}
    >
      {/* Line number */}
      <span className="shrink-0 text-varta-text-faint w-7 text-right font-mono tabular-nums">
        {lineNumber}
      </span>

      {/* Line content */}
      <span className="flex-1 min-w-0 truncate font-mono">
        <span className="text-varta-text-muted">{before}</span>
        <span className="text-varta-text bg-varta-accent/30 rounded-sm px-0.5 font-semibold">
          {matched}
        </span>
        <span className="text-varta-text-muted">{after}</span>
      </span>
    </div>
  )
}
