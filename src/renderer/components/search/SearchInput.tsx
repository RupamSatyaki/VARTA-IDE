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
    <div className="px-3 py-2 border-b border-varta-border">
      <div className={cn(
        'flex items-center rounded-lg border bg-varta-bg-secondary transition-all duration-150',
        regexError
          ? 'border-varta-error'
          : 'border-varta-border focus-within:border-varta-accent',
      )}>
        {/* Search icon */}
        <span className="pl-2.5 text-varta-text-faint shrink-0">
          <FontAwesomeIcon icon={faMagnifyingGlass} style={{ fontSize: 11 }} />
        </span>

        <input
          ref={inputRef}
          value={query.text}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="Search files…"
          spellCheck={false}
          className="flex-1 min-w-0 h-7 px-2 bg-transparent text-[12px] text-varta-text placeholder:text-varta-text-faint outline-none"
        />

        {/* Clear button */}
        {query.text && (
          <button
            onClick={() => { setQuery({ text: '' }); onClear() }}
            className="px-1.5 text-varta-text-faint hover:text-varta-text transition-colors"
          >
            <FontAwesomeIcon icon={faXmark} style={{ fontSize: 11 }} />
          </button>
        )}

        {/* Toggle buttons */}
        <div className="flex items-center gap-0.5 pr-1.5 border-l border-varta-border ml-1 pl-1.5">
          <ToggleBtn active={query.isCaseSensitive ?? false} onClick={() => toggleOption('isCaseSensitive')} title="Match Case (Alt+C)" label="Aa" />
          <ToggleBtn active={query.isWholeWord ?? false}     onClick={() => toggleOption('isWholeWord')}     title="Whole Word (Alt+W)"  label="ab" border />
          <ToggleBtn active={query.isRegex ?? false}         onClick={() => toggleOption('isRegex')}         title="Regex (Alt+R)"       label=".*" />
        </div>
      </div>

      {regexError && (
        <p className="text-[10px] text-varta-error mt-1 px-1">Invalid regular expression</p>
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
          ? 'text-varta-accent bg-varta-accent/25'
          : 'text-varta-text-faint hover:text-varta-text hover:bg-white/5',
      )}
    >
      {label}
    </button>
  )
}
