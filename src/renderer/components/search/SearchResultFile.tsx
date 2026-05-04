import React from 'react'
import { cn } from '../../utils/cn'
import { FileIcon } from '../filetree/FileIcon'
import { Badge } from '../ui/Badge'
import { SearchResultMatch } from './SearchResultMatch'
import { useSearchStore } from '../../store/searchStore'
import { useFileTreeStore } from '../../store/fileTreeStore'
import type { SearchResultFile as SearchResultFileType } from '../../../shared/types/search.types'

export interface SearchResultFileProps {
  file:      SearchResultFileType
  queryText: string
  isRegex:   boolean
  onMatchClick: (filePath: string, lineNumber: number, column: number, matchLength: number) => void
}

export function SearchResultFile({
  file,
  queryText,
  isRegex,
  onMatchClick,
}: SearchResultFileProps) {
  const { expandedFiles, toggleFileExpanded } = useSearchStore()
  const { rootPath } = useFileTreeStore()

  const isExpanded = expandedFiles.has(file.filePath)
  const filename   = file.filePath.replace(/\\/g, '/').split('/').pop() ?? file.filePath
  const relPath    = rootPath
    ? file.filePath.replace(/\\/g, '/').replace(rootPath.replace(/\\/g, '/'), '').replace(/^\//, '')
    : file.filePath

  return (
    <div>
      {/* File header */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => toggleFileExpanded(file.filePath)}
        onKeyDown={(e) => e.key === 'Enter' && toggleFileExpanded(file.filePath)}
        className={cn(
          'flex items-center gap-2 px-3 py-1 cursor-pointer select-none',
          'hover:bg-[#2a2d2e] focus:outline-none focus:bg-[#2a2d2e]',
          'sticky top-0 bg-[#252526] z-10',
        )}
      >
        {/* Chevron */}
        <svg
          width="10" height="10" viewBox="0 0 10 10" fill="currentColor"
          className={cn('shrink-0 text-[#6e6e6e] transition-transform', isExpanded ? 'rotate-90' : '')}
        >
          <path d="M3 1l4 4-4 4V1z"/>
        </svg>

        {/* File icon + name */}
        <FileIcon filename={filename} size={14} className="shrink-0" />
        <span className="text-xs text-[#d4d4d4] truncate flex-1" title={file.filePath}>
          {relPath}
        </span>

        {/* Match count badge */}
        <Badge variant="info" className="shrink-0 text-[10px]">
          {file.matchCount}
        </Badge>
      </div>

      {/* Matches */}
      {isExpanded && file.matches.map((match, i) => (
        <SearchResultMatch
          key={i}
          match={match}
          filePath={file.filePath}
          queryText={queryText}
          isRegex={isRegex}
          onClick={() => onMatchClick(file.filePath, match.lineNumber, match.column, match.matchText.length)}
        />
      ))}
    </div>
  )
}
