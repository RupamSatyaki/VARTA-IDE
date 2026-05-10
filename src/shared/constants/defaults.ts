/** Default values for all Varta settings */
import type { VartaSettings } from '../types/settings.types'

export const DEFAULT_SETTINGS: VartaSettings = {
  editor: {
    fontFamily:           '"JetBrains Mono", "Fira Code", Consolas, monospace',
    fontSize:             14,
    fontWeight:           'normal',
    lineHeight:           1.6,
    letterSpacing:        0,
    tabSize:              2,
    indentStyle:          'spaces',
    wordWrap:             'off',
    wordWrapColumn:       80,
    cursorStyle:          'line',
    cursorBlinking:       'blink',
    renderWhitespace:     'selection',
    showLineNumbers:      true,
    showMinimap:          true,
    minimapMaxColumn:     120,
    showBreadcrumbs:      true,
    smoothScrolling:      true,
    mouseWheelZoom:       false,
    formatOnSave:         false,
    formatOnPaste:        false,
    autoClosingBrackets:  true,
    autoClosingQuotes:    true,
    autoIndent:           true,
    snippetSuggestions:   'inline',
    suggestOnTriggerCharacters: true,
    acceptSuggestionOnEnter: 'on',
    lineEnding:           'lf',
    trimTrailingWhitespace: true,
    insertFinalNewline:   true,
  },

  terminal: {
    fontFamily:     '"JetBrains Mono", Consolas, monospace',
    fontSize:       13,
    lineHeight:     1.2,
    cursorStyle:    'block',
    cursorBlinking: 'blink',
    scrollback:     10000,
    defaultProfile: 'default',
    shell:          '',           // auto-detected at runtime
    shellArgs:      [],
    env:            {},
    copyOnSelect:   false,
    rightClickBehavior: 'copyPaste',
  },

  workbench: {
    theme:              'varta-dark',
    iconTheme:          'varta-icons',
    colorTheme:         'varta-dark',
    sidebarPosition:    'left',
    sidebarVisible:     true,
    activityBarVisible: true,
    statusBarVisible:   true,
    panelPosition:      'bottom',
    panelVisible:       false,
    autoSave:           'afterDelay',
    autoSaveDelay:      1000,
    confirmDelete:      true,
    confirmDragAndDrop: true,
    showOpenedEditors:  true,
    openFilesLimit:     50,
    restoreOpenedEditors: true,
  },

  git: {
    enabled:            true,
    autofetch:          true,
    autofetchPeriod:    180,
    confirmSync:        true,
    enableSmartCommit:  false,
    decorations:        true,
    defaultCloneDir:    '',       // resolved to ~/projects at runtime
  },

  ai: {
    enabled:          true,
    model:            'openrouter/owl-alpha',
    maxTokens:        4096,
    temperature:      0.7,
    inlineHints:      true,
    inlineHintsDelay: 800,
    // API key is NEVER stored here
  },

  keybindings: [],   // user overrides; merged with DEFAULT_KEYBINDINGS at runtime
}

/** App-level constants */
export const APP_CONSTANTS = {
  APP_NAME:           'Varta',
  APP_VERSION:        '0.1.0',
  SETTINGS_FILE:      'settings.json',
  KEYBINDINGS_FILE:   'keybindings.json',
  LOG_FILE:           'varta.log',
  MAX_RECENT_FILES:   20,
  MAX_RECENT_FOLDERS: 10,
  MAX_SEARCH_RESULTS: 1000,
  MAX_TERMINAL_INSTANCES: 10,
  AUTO_SAVE_DEBOUNCE_MS:  300,
  FILE_WATCH_DEBOUNCE_MS: 200,
  AI_STREAM_TIMEOUT_MS:   60000,
  SIDEBAR_MIN_WIDTH:      150,
  SIDEBAR_MAX_WIDTH:      600,
  SIDEBAR_DEFAULT_WIDTH:  240,
  PANEL_MIN_HEIGHT:       80,
  PANEL_MAX_HEIGHT:       800,
  PANEL_DEFAULT_HEIGHT:   200,
} as const

/** Supported platforms */
export type Platform = 'win32' | 'darwin' | 'linux'

/** File size limits */
export const FILE_SIZE_LIMITS = {
  MAX_OPEN_FILE_BYTES:   10 * 1024 * 1024,   // 10 MB — warn above this
  MAX_SEARCH_FILE_BYTES: 5  * 1024 * 1024,   // 5 MB  — skip in search
} as const
