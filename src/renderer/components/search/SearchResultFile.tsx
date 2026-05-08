import React from 'react'
import { cn } from '../../utils/cn'
import { FileIcon } from '../filetree/FileIcon'
import { SearchResultMatch } from './SearchResultMatch'
import { useSearchStore } from '../../store/searchStore'
import { useFileTreeStore } from '../../store/fileTreeStore'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faChevronRight, faChevronDown } from '@fortawesome/free-solid-svg-icons'
import type { SearchResultFile as SearchResultFileType } from '../../../shared/types/search.types'

export interface SearchResultFileProps {
  file:         SearchResultFileType
  queryText:    string
  isRegex:      boolean
  onMatchClick: (filePath: string, lineNumber: number, column: number, matchLength: number) => void
}

export function SearchResultFile({ file, queryText, isRegex, onMatchClick }: SearchResultFileProps) {
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
          'flex items-center gap-2 px-3 py-1.5 cursor-pointer select-none',
          'hover:bg-white/5 focus:outline-none',
          'sticky top-0 bg-[#28242e] z-10 border-b border-[#2a1f30]/50',
        )}
      >
        {/* Chevron */}
        <FontAwesomeIcon
          icon={isExpanded ? faChevronDown : faChevronRight}
          style={{ fontSize: 9 }}
          className="shrink-0 text-[#5a4a6a]"
        />

        {/* File icon */}
        <FileIcon filename={filename} size={14} className="shrink-0" />

        {/* Path */}
        <span className="text-[12px] text-[#cccccc] truncate flex-1 min-w-0" title={file.filePath}>
          {relPath}
        </span>

        {/* Match count badge */}
        <span className="shrink-0 px-1.5 py-0.5 rounded-full text-[10px] font-medium
          bg-[#7c3aed]/20 text-[#c084fc] border border-[#7c3aed]/30">
          {file.matchCount}
        </span>
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
