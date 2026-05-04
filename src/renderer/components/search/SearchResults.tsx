import React from 'react'
import { Spinner } from '../ui/Spinner'
import { SearchResultFile } from './SearchResultFile'
import { useSearchStore } from '../../store/searchStore'

export interface SearchResultsProps {
  onMatchClick: (filePath: string, lineNumber: number, column: number, matchLength: number) => void
}

export function SearchResults({ onMatchClick }: SearchResultsProps) {
  const { results, isSearching, lastError, query, progress } = useSearchStore()

  // Loading state
  if (isSearching) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 text-[#6e6e6e]">
        <Spinner size="md" />
        <span className="text-xs">
          {progress
            ? `Searching… ${progress.scannedFiles} files scanned`
            : 'Searching…'}
        </span>
      </div>
    )
  }

  // Error state
  if (lastError) {
    return (
      <div className="flex items-center justify-center h-full px-4">
        <p className="text-xs text-[#f44747] text-center">{lastError}</p>
      </div>
    )
  }

  // No query
  if (!query.text) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-xs text-[#6e6e6e]">Type to search across files</p>
      </div>
    )
  }

  // No results
  if (results && results.totalMatches === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-xs text-[#6e6e6e]">No results found for "{query.text}"</p>
      </div>
    )
  }

  if (!results) { return null }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Summary */}
      <div className="px-3 py-1 text-[10px] text-[#6e6e6e] border-b border-[#333333] shrink-0">
        {results.totalMatches} result{results.totalMatches !== 1 ? 's' : ''} in {results.totalFiles} file{results.totalFiles !== 1 ? 's' : ''}
        {results.truncated && ' (truncated)'}
      </div>

      {/* File list — scrollable */}
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
