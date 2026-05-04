import { create } from 'zustand'
import { immer }  from 'zustand/middleware/immer'
import type { SearchQuery, SearchResult, SearchProgressEvent } from '../../shared/types/search.types'

export interface SearchState {
  query:       SearchQuery
  results:     SearchResult | null
  isSearching: boolean
  progress:    SearchProgressEvent | null
  lastError:   string | null
}

export interface SearchActions {
  setQuery:     (query: Partial<SearchQuery>) => void
  setResults:   (results: SearchResult | null) => void
  setSearching: (v: boolean) => void
  setProgress:  (p: SearchProgressEvent | null) => void
  setError:     (e: string | null) => void
  clearResults: () => void
  reset:        () => void
}

const DEFAULT_QUERY: SearchQuery = {
  text:             '',
  isRegex:          false,
  isCaseSensitive:  false,
  isWholeWord:      false,
  includePattern:   '',
  excludePattern:   '',
  maxResults:       1000,
}

const INITIAL: SearchState = {
  query:       DEFAULT_QUERY,
  results:     null,
  isSearching: false,
  progress:    null,
  lastError:   null,
}

export const useSearchStore = create<SearchState & SearchActions>()(
  immer((set) => ({
    ...INITIAL,

    setQuery:     (q)  => set((s) => { Object.assign(s.query, q) }),
    setResults:   (r)  => set((s) => { s.results = r; s.isSearching = false; s.progress = null }),
    setSearching: (v)  => set((s) => { s.isSearching = v }),
    setProgress:  (p)  => set((s) => { s.progress = p }),
    setError:     (e)  => set((s) => { s.lastError = e; s.isSearching = false }),
    clearResults: ()   => set((s) => { s.results = null; s.progress = null }),
    reset:        ()   => set(() => ({ ...INITIAL, query: { ...DEFAULT_QUERY } })),
  }))
)
