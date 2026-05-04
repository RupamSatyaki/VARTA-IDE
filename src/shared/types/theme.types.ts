/** Theme types shared between main and renderer */

export type ThemeType = 'dark' | 'light' | 'high-contrast'

export interface ThemeColors {
  // Background layers
  bg:              string
  bgSecondary:     string
  bgTertiary:      string

  // Borders
  border:          string
  borderFocus:     string

  // Text
  text:            string
  textMuted:       string
  textFaint:       string
  textDisabled:    string

  // Accent / brand
  accent:          string
  accentHover:     string
  accentForeground: string

  // Semantic
  success:         string
  warning:         string
  error:           string
  info:            string

  // Interactive states
  selection:       string
  hover:           string
  active:          string
  focus:           string

  // Editor-specific
  editorBg:        string
  editorLineHighlight: string
  editorSelection: string
  editorCursor:    string
  editorWhitespace: string
  editorIndentGuide: string
  editorRuler:     string

  // Tabs
  tabActiveBg:     string
  tabActiveFg:     string
  tabInactiveBg:   string
  tabInactiveFg:   string
  tabBorder:       string
  tabDirtyIndicator: string

  // Sidebar
  sidebarBg:       string
  sidebarFg:       string
  sidebarBorder:   string

  // Activity bar
  activityBarBg:   string
  activityBarFg:   string
  activityBarActiveBorder: string
  activityBarBadgeBg: string
  activityBarBadgeFg: string

  // Status bar
  statusBarBg:     string
  statusBarFg:     string
  statusBarBorder: string
  statusBarDebuggingBg: string
  statusBarNoFolderBg: string

  // Title bar
  titleBarBg:      string
  titleBarFg:      string
  titleBarBorder:  string

  // Panel (terminal, search, etc.)
  panelBg:         string
  panelBorder:     string
  panelTabActiveBg: string
  panelTabActiveFg: string

  // Terminal
  terminalBg:      string
  terminalFg:      string
  terminalCursor:  string
  terminalSelectionBg: string

  // Git decorations
  gitAdded:        string
  gitModified:     string
  gitDeleted:      string
  gitConflicting:  string
  gitUntracked:    string
  gitIgnored:      string

  // Scrollbar
  scrollbarThumb:  string
  scrollbarThumbHover: string
  scrollbarTrack:  string

  // Shadows
  shadowSm:        string
  shadowMd:        string
  shadowLg:        string
  shadowPopup:     string
}

export interface ThemeFonts {
  editorFontFamily: string
  editorFontSize:   number
  uiFontFamily:     string
  uiFontSize:       number
  monoFontFamily:   string
}

export interface ThemeSpacing {
  sidebarWidth:      number   // px
  activityBarWidth:  number
  statusBarHeight:   number
  titleBarHeight:    number
  tabHeight:         number
  panelHeight:       number
  borderRadius:      number
}

export interface VartaTheme {
  id:          string
  name:        string
  type:        ThemeType
  colors:      ThemeColors
  fonts?:      Partial<ThemeFonts>
  spacing?:    Partial<ThemeSpacing>
  monacoTheme?: string    // name of registered Monaco theme to activate
}

export interface ThemeChangeEvent {
  previousThemeId: string
  newThemeId:      string
  theme:           VartaTheme
}
