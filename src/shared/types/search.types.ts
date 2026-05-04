/** Search & replace types shared between main and renderer */

export interface SearchQuery {
  text:           string
  isRegex?:       boolean
  isCaseSensitive?: boolean
  isWholeWord?:   boolean
  includePattern?: string   // glob, e.g. '**/*.ts'
  excludePattern?: string   // glob, e.g. '**/node_modules/**'
  maxResults?:    number    // default: 1000
}

export interface ReplaceQuery extends SearchQuery {
  replaceText: string
}

export interface SearchMatch {
  lineNumber:   number      // 1-indexed
  column:       number      // 1-indexed
  matchText:    string
  lineText:     string      // full line content for context
  matchStart:   number      // char offset in lineText
  matchEnd:     number      // char offset in lineText
}

export interface SearchResultFile {
  filePath:     string
  matches:      SearchMatch[]
  matchCount:   number
}

export interface SearchResult {
  query:        SearchQuery
  files:        SearchResultFile[]
  totalMatches: number
  totalFiles:   number
  truncated:    boolean     // true if maxResults was hit
  durationMs:   number
}

export interface ReplaceResult {
  query:          ReplaceQuery
  filesModified:  number
  totalReplacements: number
  errors:         Array<{ filePath: string; message: string }>
}

export interface SearchProgressEvent {
  scannedFiles:   number
  matchedFiles:   number
  totalMatches:   number
  currentFile:    string
}
