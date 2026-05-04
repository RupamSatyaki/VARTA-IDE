import React, { useRef, useEffect, useCallback, useState } from 'react'
import { cn } from '../../utils/cn'
import { useSearchStore } from '../../store/searchStore'

export interface SearchInputProps {
  onSearch:  (text: string) => void
  onClear:   () => void
  autoFocus?: boolean
}

// Custom event to focus search input from anywhere
export const FOCUS_SEARCH_EVENT = 'varta:focus-search'

export function SearchInput({ onSearch, onClear, autoFocus }: SearchInputProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const { query, setQuery } = useSearchStore()
  const [regexError, setRegexError] = useState(false)

  // Focus on mount or when focus event fires
  useEffect(() => {
    if (autoFocus) { inputRef.current?.focus() }
    const handler = () => { inputRef.current?.focus(); inputRef.current?.select() }
    window.addEventListener(FOCUS_SEARCH_EVENT, handler)
    return () => window.removeEventListener(FOCUS_SEARCH_EVENT, handler)
  }, [autoFocus])

  const triggerSearch = useCallback((text: string) => {
    if (!text.trim()) { onClear(); return }

    // Validate regex
    if (query.isRegex) {
      try { new RegExp(text) } catch {
        setRegexError(true)
        return
      }
    }
    setRegexError(false)
    onSearch(text)
  }, [query.isRegex, onSearch, onClear])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value
    setQuery({ text })
    setRegexError(false)
    // Trigger search immediately — useSearch handles debounce internally
    onSearch(text)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      triggerSearch(query.text)
    }
    if (e.key === 'Escape') {
      setQuery({ text: '' })
      setRegexError(false)
      onClear()
    }
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
    <div className="px-3 py-2 border-b border-[#333333]">
      <div
        className={cn(
          'flex items-center rounded border bg-[#3c3c3c] transition-colors',
          regexError
            ? 'border-[#f44747]'
            : 'border-[#3c3c3c] focus-within:border-[#569cd6]',
        )}
      >
        <input
          ref={inputRef}
          value={query.text}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="Search"
          spellCheck={false}
          className="flex-1 min-w-0 h-7 px-2 bg-transparent text-xs text-[#d4d4d4] placeholder:text-[#6e6e6e] outline-none"
        />

        {/* Toggle buttons */}
        <div className="flex items-center gap-0.5 pr-1">
          <ToggleBtn
            active={query.isCaseSensitive ?? false}
            onClick={() => toggleOption('isCaseSensitive')}
            title="Match Case (Alt+C)"
            label="Aa"
          />
          <ToggleBtn
            active={query.isWholeWord ?? false}
            onClick={() => toggleOption('isWholeWord')}
            title="Match Whole Word (Alt+W)"
            label="ab"
            border
          />
          <ToggleBtn
            active={query.isRegex ?? false}
            onClick={() => toggleOption('isRegex')}
            title="Use Regular Expression (Alt+R)"
            label=".*"
          />
        </div>
      </div>

      {regexError && (
        <p className="text-[10px] text-[#f44747] mt-1">Invalid regular expression</p>
      )}
    </div>
  )
}

function ToggleBtn({
  active, onClick, title, label, border,
}: {
  active: boolean; onClick: () => void; title: string; label: string; border?: boolean
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={cn(
        'w-6 h-5 flex items-center justify-center text-[10px] font-mono rounded transition-colors',
        border && 'border border-current',
        active
          ? 'text-[#d4d4d4] bg-[#264f78]'
          : 'text-[#6e6e6e] hover:text-[#d4d4d4] hover:bg-[#2a2d2e]',
      )}
    >
      {label}
    </button>
  )
}
