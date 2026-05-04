import { create } from 'zustand'
import type { SearchQuery, SearchResult, SearchProgressEvent } from '../../shared/types/search.types'

export interface SearchState {
  query:         SearchQuery
  results:       SearchResult | null
  isSearching:   boolean
  progress:      SearchProgressEvent | null
  lastError:     string | null
  expandedFiles: Set<string>   // which file paths are expanded in results
  replaceText:   string
}

export interface SearchActions {
  setQuery:        (query: Partial<SearchQuery>) => void
  setResults:      (results: SearchResult | null) => void
  setSearching:    (v: boolean) => void
  setProgress:     (p: SearchProgressEvent | null) => void
  updateProgress:  (scanned: number, total: number) => void
  setError:        (e: string | null) => void
  clearResults:    () => void
  setReplaceText:  (t: string) => void
  toggleFileExpanded: (filePath: string) => void
  expandAll:       () => void
  collapseAll:     () => void
  reset:           () => void
}

const DEFAULT_QUERY: SearchQuery = {
  text:            '',
  isRegex:         false,
  isCaseSensitive: false,
  isWholeWord:     false,
  includePattern:  '',
  excludePattern:  '',
  maxResults:      1000,
}

export const useSearchStore = create<SearchState & SearchActions>()((set, get) => ({
  query:         DEFAULT_QUERY,
  results:       null,
  isSearching:   false,
  progress:      null,
  lastError:     null,
  expandedFiles: new Set<string>(),
  replaceText:   '',

  setQuery: (q) => set((s) => ({ query: { ...s.query, ...q } })),

  setResults: (results) => {
    // Auto-expand all files on new results
    const expanded = new Set<string>(results?.files.map((f) => f.filePath) ?? [])
    set({ results, isSearching: false, progress: null, lastError: null, expandedFiles: expanded })
  },

  setSearching: (v) => set({ isSearching: v }),

  setProgress: (p) => set({ progress: p }),

  updateProgress: (scanned, total) => set((s) => ({
    progress: s.progress
      ? { ...s.progress, scannedFiles: scanned }
      : { scannedFiles: scanned, matchedFiles: 0, totalMatches: 0, currentFile: '' },
  })),

  setError: (e) => set({ lastError: e, isSearching: false }),

  clearResults: () => set({ results: null, progress: null, lastError: null, expandedFiles: new Set() }),

  setReplaceText: (t) => set({ replaceText: t }),

  toggleFileExpanded: (filePath) => {
    const next = new Set(get().expandedFiles)
    if (next.has(filePath)) { next.delete(filePath) } else { next.add(filePath) }
    set({ expandedFiles: next })
  },

  expandAll: () => {
    const all = new Set(get().results?.files.map((f) => f.filePath) ?? [])
    set({ expandedFiles: all })
  },

  collapseAll: () => set({ expandedFiles: new Set() }),

  reset: () => set({
    query: { ...DEFAULT_QUERY },
    results: null, isSearching: false, progress: null,
    lastError: null, expandedFiles: new Set(), replaceText: '',
  }),
}))
