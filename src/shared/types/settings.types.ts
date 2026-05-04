/** Settings types shared between main and renderer */

export type FontWeight = 'normal' | 'bold' | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900'
export type CursorStyle = 'line' | 'block' | 'underline'
export type CursorBlinking = 'blink' | 'smooth' | 'phase' | 'expand' | 'solid'
export type WordWrap = 'off' | 'on' | 'wordWrapColumn' | 'bounded'
export type LineEnding = 'lf' | 'crlf' | 'auto'
export type IndentStyle = 'spaces' | 'tabs'
export type RenderWhitespace = 'none' | 'boundary' | 'selection' | 'trailing' | 'all'
export type AutoSaveMode = 'off' | 'afterDelay' | 'onFocusChange' | 'onWindowChange'

export interface EditorSettings {
  fontFamily:           string
  fontSize:             number
  fontWeight:           FontWeight
  lineHeight:           number
  letterSpacing:        number
  tabSize:              number
  indentStyle:          IndentStyle
  wordWrap:             WordWrap
  wordWrapColumn:       number
  cursorStyle:          CursorStyle
  cursorBlinking:       CursorBlinking
  renderWhitespace:     RenderWhitespace
  showLineNumbers:      boolean
  showMinimap:          boolean
  minimapMaxColumn:     number
  showBreadcrumbs:      boolean
  smoothScrolling:      boolean
  mouseWheelZoom:       boolean
  formatOnSave:         boolean
  formatOnPaste:        boolean
  autoClosingBrackets:  boolean
  autoClosingQuotes:    boolean
  autoIndent:           boolean
  snippetSuggestions:   'top' | 'bottom' | 'inline' | 'none'
  suggestOnTriggerCharacters: boolean
  acceptSuggestionOnEnter: 'on' | 'smart' | 'off'
  lineEnding:           LineEnding
  trimTrailingWhitespace: boolean
  insertFinalNewline:   boolean
}

export interface TerminalSettings {
  fontFamily:     string
  fontSize:       number
  lineHeight:     number
  cursorStyle:    CursorStyle
  cursorBlinking: CursorBlinking
  scrollback:     number
  defaultProfile: string
  shell:          string
  shellArgs:      string[]
  env:            Record<string, string>
  copyOnSelect:   boolean
  rightClickBehavior: 'default' | 'copyPaste' | 'paste' | 'selectWord'
}

export interface WorkbenchSettings {
  theme:              string
  iconTheme:          string
  colorTheme:         string
  sidebarPosition:    'left' | 'right'
  sidebarVisible:     boolean
  activityBarVisible: boolean
  statusBarVisible:   boolean
  panelPosition:      'bottom' | 'right'
  panelVisible:       boolean
  autoSave:           AutoSaveMode
  autoSaveDelay:      number        // ms, used when autoSave === 'afterDelay'
  confirmDelete:      boolean
  confirmDragAndDrop: boolean
  showOpenedEditors:  boolean
  openFilesLimit:     number
  restoreOpenedEditors: boolean
}

export interface GitSettings {
  enabled:            boolean
  autofetch:          boolean
  autofetchPeriod:    number        // seconds
  confirmSync:        boolean
  enableSmartCommit:  boolean
  decorations:        boolean
  defaultCloneDir:    string
}

export interface AISettings {
  enabled:            boolean
  model:              string        // e.g. 'claude-3-5-sonnet-20241022'
  maxTokens:          number
  temperature:        number
  inlineHints:        boolean
  inlineHintsDelay:   number        // ms
  // NOTE: API key is NEVER stored here — it lives in encrypted store (main only)
}

export interface KeybindingEntry {
  command:    string
  key:        string
  when?:      string
  args?:      unknown
}

export interface VartaSettings {
  editor:     EditorSettings
  terminal:   TerminalSettings
  workbench:  WorkbenchSettings
  git:        GitSettings
  ai:         AISettings
  keybindings: KeybindingEntry[]
}

/** Partial deep settings update payload */
export type SettingsUpdate = {
  [K in keyof VartaSettings]?: Partial<VartaSettings[K]>
}
