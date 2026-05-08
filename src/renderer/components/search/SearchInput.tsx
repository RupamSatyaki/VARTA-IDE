import React, { useRef, useEffect, useCallback, useState } from 'react'
import { cn } from '../../utils/cn'
import { useSearchStore } from '../../store/searchStore'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faMagnifyingGlass, faXmark } from '@fortawesome/free-solid-svg-icons'

export interface SearchInputProps {
  onSearch:   (text: string) => void
  onClear:    () => void
  autoFocus?: boolean
}

export const FOCUS_SEARCH_EVENT = 'varta:focus-search'

export function SearchInput({ onSearch, onClear, autoFocus }: SearchInputProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const { query, setQuery } = useSearchStore()
  const [regexError, setRegexError] = useState(false)

  useEffect(() => {
    if (autoFocus) { inputRef.current?.focus() }
    const handler = () => { inputRef.current?.focus(); inputRef.current?.select() }
    window.addEventListener(FOCUS_SEARCH_EVENT, handler)
    return () => window.removeEventListener(FOCUS_SEARCH_EVENT, handler)
  }, [autoFocus])

  const triggerSearch = useCallback((text: string) => {
    if (!text.trim()) { onClear(); return }
    if (query.isRegex) {
      try { new RegExp(text) } catch { setRegexError(true); return }
    }
    setRegexError(false)
    onSearch(text)
  }, [query.isRegex, onSearch, onClear])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value
    setQuery({ text })
    setRegexError(false)
    onSearch(text)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') { triggerSearch(query.text) }
    if (e.key === 'Escape') { setQuery({ text: '' }); setRegexError(false); onClear() }
  }

  const toggleOption = (key: 'isCaseSensitive' | 'isWholeWord' | 'isRegex') => {
    const newVal = !query[key]
    setQuery({ [key]: newVal })
    if (query.text) {
      const updated = { ...query, [key]: newVal }
      if (updated.isRegex) {
        try { new RegExp(updated.text) } catch { setRegexError(true); return }
      }
      setRegexError(false)
      onSearch(updated.text)
    }
  }

  return (
    <div className="px-3 py-2 border-b border-[#2a1f30]">
      <div className={cn(
        'flex items-center rounded-lg border bg-[#1e1a24] transition-all duration-150',
        regexError
          ? 'border-[#f44747]'
          : 'border-[#3a2f45] focus-within:border-[#7c3aed]',
      )}>
        {/* Search icon */}
        <span className="pl-2.5 text-[#5a4a6a] shrink-0">
          <FontAwesomeIcon icon={faMagnifyingGlass} style={{ fontSize: 11 }} />
        </span>

        <input
          ref={inputRef}
          value={query.text}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="Search files…"
          spellCheck={false}
          className="flex-1 min-w-0 h-7 px-2 bg-transparent text-[12px] text-[#cccccc] placeholder:text-[#4a3a5a] outline-none"
        />

        {/* Clear button */}
        {query.text && (
          <button
            onClick={() => { setQuery({ text: '' }); onClear() }}
            className="px-1.5 text-[#5a4a6a] hover:text-[#cccccc] transition-colors"
          >
            <FontAwesomeIcon icon={faXmark} style={{ fontSize: 11 }} />
          </button>
        )}

        {/* Toggle buttons */}
        <div className="flex items-center gap-0.5 pr-1.5 border-l border-[#3a2f45] ml-1 pl-1.5">
          <ToggleBtn active={query.isCaseSensitive ?? false} onClick={() => toggleOption('isCaseSensitive')} title="Match Case (Alt+C)" label="Aa" />
          <ToggleBtn active={query.isWholeWord ?? false}     onClick={() => toggleOption('isWholeWord')}     title="Whole Word (Alt+W)"  label="ab" border />
          <ToggleBtn active={query.isRegex ?? false}         onClick={() => toggleOption('isRegex')}         title="Regex (Alt+R)"       label=".*" />
        </div>
      </div>

      {regexError && (
        <p className="text-[10px] text-[#f44747] mt-1 px-1">Invalid regular expression</p>
      )}
    </div>
  )
}

function ToggleBtn({ active, onClick, title, label, border }: {
  active: boolean; onClick: () => void; title: string; label: string; border?: boolean
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={cn(
        'w-6 h-5 flex items-center justify-center text-[10px] font-mono rounded transition-all duration-150',
        border && 'border border-current',
        active
          ? 'text-[#c084fc] bg-[#7c3aed]/25'
          : 'text-[#5a4a6a] hover:text-[#cccccc] hover:bg-white/5',
      )}
    >
      {label}
    </button>
  )
}
