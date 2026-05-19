import React from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons'
import { SearchResultFile } from './SearchResultFile'
import { useSearchStore }   from '../../store/searchStore'

export interface SearchResultsProps {
  onMatchClick: (filePath: string, lineNumber: number, column: number, matchLength: number) => void
}

export function SearchResults({ onMatchClick }: SearchResultsProps) {
  const { results, isSearching, lastError, query, progress } = useSearchStore()

  // Loading
  if (isSearching) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 text-[#5a4a6a]">
        <div className="w-5 h-5 border-2 border-[#7c3aed] border-t-transparent rounded-full animate-spin" />
        <span className="text-[11px]">
          {progress ? `Scanning ${progress.scannedFiles} files…` : 'Searching…'}
        </span>
      </div>
    )
  }

  // Error
  if (lastError) {
    return (
      <div className="flex items-center justify-center h-full px-4">
        <p className="text-[11px] text-[#f44747] text-center">{lastError}</p>
      </div>
    )
  }

  // Empty query
  if (!query.text) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 select-none">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center
          bg-varta-bg-secondary border border-varta-border">
          <FontAwesomeIcon icon={faMagnifyingGlass} style={{ fontSize: 16 }} className="text-varta-text-faint" />
        </div>
        <p className="text-[11px] text-varta-text-faint">Type to search across files</p>
      </div>
    )
  }

  // No results
  if (results && results.totalMatches === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-2 select-none px-4 text-center">
        <p className="text-[11px] text-varta-text-faint">
          No results for <span className="text-varta-accent">"{query.text}"</span>
        </p>
      </div>
    )
  }

  if (!results) { return null }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex-1 overflow-y-auto">
        {results.files.map((file) => (
          <SearchResultFile
            key={file.filePath}
            file={file}
            queryText={query.text}
            isRegex={query.isRegex ?? false}
            onMatchClick={onMatchClick}
          />
        ))}
      </div>
    </div>
  )
}
