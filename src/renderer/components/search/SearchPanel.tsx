import React, { useState } from 'react'
import { SearchInput }    from './SearchInput'
import { ReplaceInput }   from './ReplaceInput'
import { SearchFilters }  from './SearchFilters'
import { SearchToolbar }  from './SearchToolbar'
import { SearchResults }  from './SearchResults'
import { useSearch, navigateToMatch } from '../../hooks/useSearch'
import { useSearchStore } from '../../store/searchStore'

export function SearchPanel() {
  const [showReplace, setShowReplace] = useState(false)
  const [isReplacing, setIsReplacing] = useState(false)

  const { search, replaceAll, cancelSearch } = useSearch()
  const { clearResults, expandAll, collapseAll, query } = useSearchStore()

  const handleSearch = (text: string) => {
    search({ ...query, text })
  }

  const handleClear = () => {
    cancelSearch()
    clearResults()
  }

  const handleReplaceAll = async () => {
    setIsReplacing(true)
    try {
      await replaceAll()
    } finally {
      setIsReplacing(false)
    }
  }

  return (
    <div className="flex flex-col h-full overflow-hidden bg-[#252526]">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-[#333333] shrink-0">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-[#6e6e6e]">
          Search
        </span>
        <button
          onClick={() => setShowReplace((v) => !v)}
          title="Toggle Replace"
          className="text-[#6e6e6e] hover:text-[#d4d4d4] transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
            <path d="M3.221 3.739l2.261 2.269L7.7 3.784l-.7-.7-1.012 1.007-.008-1.6a.523.523 0 01.5-.526H8V1H6.48A1.482 1.482 0 005 2.489V4.1L3.927 3.033l-.706.706zm6.67 1.794h-.01c-.313 0-.61.12-.83.34l-1.24 1.24a1.18 1.18 0 000 1.66l.84.84a1.18 1.18 0 001.66 0l1.24-1.24a1.18 1.18 0 000-1.66l-.84-.84a1.17 1.17 0 00-.82-.34zm-1.4 2.88l-.84-.84 1.24-1.24.84.84-1.24 1.24zM13 7h-1.5v1H13v5H8v-1.5H7V13a1 1 0 001 1h5a1 1 0 001-1V8a1 1 0 00-1-1z"/>
          </svg>
        </button>
      </div>

      {/* Search input */}
      <SearchInput
        onSearch={handleSearch}
        onClear={handleClear}
        autoFocus
      />

      {/* Replace input (collapsible) */}
      {showReplace && (
        <ReplaceInput
          onReplaceAll={handleReplaceAll}
          isReplacing={isReplacing}
        />
      )}

      {/* Filters (collapsible) */}
      <SearchFilters />

      {/* Toolbar (only when results exist) */}
      <SearchToolbar
        onRefresh={() => query.text && search({ ...query })}
        onClear={handleClear}
        onExpandAll={expandAll}
        onCollapseAll={collapseAll}
      />

      {/* Results */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <SearchResults
          onMatchClick={(filePath, lineNumber, column, matchLength) =>
            navigateToMatch(filePath, lineNumber, column, matchLength)
          }
        />
      </div>
    </div>
  )
}
