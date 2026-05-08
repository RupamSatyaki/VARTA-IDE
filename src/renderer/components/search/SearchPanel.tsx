import React, { useState } from 'react'
import { SearchInput }    from './SearchInput'
import { ReplaceInput }   from './ReplaceInput'
import { SearchFilters }  from './SearchFilters'
import { SearchToolbar }  from './SearchToolbar'
import { SearchResults }  from './SearchResults'
import { useSearch, navigateToMatch } from '../../hooks/useSearch'
import { useSearchStore } from '../../store/searchStore'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faArrowRightArrowLeft } from '@fortawesome/free-solid-svg-icons'

export function SearchPanel() {
  const [showReplace, setShowReplace] = useState(false)
  const [isReplacing, setIsReplacing] = useState(false)

  const { search, replaceAll, cancelSearch } = useSearch()
  const { clearResults, expandAll, collapseAll, query } = useSearchStore()

  const handleSearch = (text: string) => search({ ...query, text })
  const handleClear  = () => { cancelSearch(); clearResults() }

  const handleReplaceAll = async () => {
    setIsReplacing(true)
    try { await replaceAll() } finally { setIsReplacing(false) }
  }

  return (
    <div className="flex flex-col h-full overflow-hidden bg-[#28242e]">

      {/* Header */}
      <div className="flex items-center justify-between px-3 h-9 border-b border-[#2a1f30] shrink-0">
        <span className="text-[10px] font-bold uppercase tracking-widest text-[#6e6e6e]">
          Search
        </span>
        <button
          onClick={() => setShowReplace(v => !v)}
          title="Toggle Replace (Ctrl+H)"
          className={`w-6 h-6 flex items-center justify-center rounded transition-all duration-150
            ${showReplace ? 'text-[#c084fc] bg-[#7c3aed]/20' : 'text-[#6e6e6e] hover:text-[#cccccc] hover:bg-white/5'}`}
        >
          <FontAwesomeIcon icon={faArrowRightArrowLeft} style={{ fontSize: 11 }} />
        </button>
      </div>

      {/* Search input */}
      <SearchInput onSearch={handleSearch} onClear={handleClear} autoFocus />

      {/* Replace input */}
      {showReplace && (
        <ReplaceInput onReplaceAll={handleReplaceAll} isReplacing={isReplacing} />
      )}

      {/* Filters */}
      <SearchFilters />

      {/* Toolbar */}
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
