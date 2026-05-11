/** Editor types shared between main and renderer */

export type EditorLanguage =
  | 'typescript' | 'javascript' | 'typescriptreact' | 'javascriptreact'
  | 'html' | 'css' | 'scss' | 'less'
  | 'json' | 'jsonc' | 'yaml' | 'toml'
  | 'markdown' | 'mdx'
  | 'python' | 'rust' | 'go' | 'java' | 'c' | 'cpp' | 'csharp'
  | 'ruby' | 'php' | 'swift' | 'kotlin' | 'dart'
  | 'shell' | 'powershell' | 'dockerfile'
  | 'sql' | 'graphql' | 'xml'
  | 'plaintext' | string   // allow unknown languages

export type DiagnosticSeverity = 'error' | 'warning' | 'info' | 'hint'

export interface DiagnosticRange {
  startLine:   number   // 0-indexed
  startColumn: number   // 0-indexed
  endLine:     number
  endColumn:   number
}

export interface Diagnostic {
  severity:  DiagnosticSeverity
  message:   string
  range:     DiagnosticRange
  source?:   string     // e.g. 'typescript', 'eslint'
  code?:     string | number
}

/**
 * EditorContext — passed to AI calls to give the model full awareness
 * of what the user is working on. Built in the renderer, sent via IPC.
 * The API key is NEVER part of this object.
 */
export interface EditorContext {
  activeFilePath:    string
  activeFileContent: string
  selectedText:      string | null
  cursorLine:        number          // 1-indexed
  language:          EditorLanguage
  diagnostics:       Diagnostic[]
  projectRoot:       string
  openTabs:          string[]        // array of file paths
}

export interface EditorTab {
  id:          string
  filePath:    string
  title:       string
  language:    EditorLanguage
  isDirty:     boolean
  isPreview:   boolean    // preview tabs close on next open
  isPinned:    boolean
  scrollTop?:  number
  cursorLine?: number
  cursorCol?:  number
  diffData?: {
    original: string
    modified: string
  }
}

export interface EditorGroup {
  id:          string
  tabs:        EditorTab[]
  activeTabId: string | null
}

export type EditorLayout = 'single' | 'split-horizontal' | 'split-vertical' | 'grid'

export interface EditorState {
  groups:       EditorGroup[]
  activeGroupId: string | null
  layout:       EditorLayout
}

export interface CursorPosition {
  line:   number    // 1-indexed
  column: number    // 1-indexed
}

export interface EditorSelection {
  start:    CursorPosition
  end:      CursorPosition
  text:     string
  isEmpty:  boolean
}

export interface CodeAction {
  title:       string
  kind:        string
  isPreferred: boolean
}

export interface SymbolInfo {
  name:        string
  kind:        string
  range:       DiagnosticRange
  detail?:     string
  children?:   SymbolInfo[]
}

export interface BreadcrumbItem {
  label:    string
  kind:     string
  range?:   DiagnosticRange
}
