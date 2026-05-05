# Renderer Process

The renderer process is the Chromium-based frontend of Varta. It runs React, Monaco Editor, and xterm.js in a sandboxed environment with no direct access to Node.js or the filesystem.

## Entry Point

`src/renderer/main.tsx` bootstraps the React application:

```typescript
// src/renderer/main.tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './assets/styles/global.css'
import './assets/styles/scrollbar.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
```

## App.tsx Startup Sequence

`src/renderer/App.tsx` runs an initialization sequence before rendering the main UI:

```
1. loadSettings()     — fetch all settings from main via SettingsChannel.GET_ALL
2. applyTheme()       — apply the saved theme (CSS vars + Monaco theme)
3. checkApiKey()      — check if AI API key is set (boolean only)
4. restoreSession()   — reopen last folder and tabs if configured
5. render UI          — show the main layout
```

If any step fails, the app renders an error screen with the failure reason rather than crashing silently.

## Zustand Stores

The renderer uses 12 Zustand stores. Each store is a singleton accessed via a hook. Stores hold **state only** — they never call IPC directly.

### useEditorStore

Holds the tab system state:

```typescript
interface EditorStore {
  tabs: EditorTab[]           // all open tabs
  activeTabId: string | null  // currently focused tab
  previewTabId: string | null // the current preview tab (italic)
  dirtyFiles: Set<string>     // file paths with unsaved changes
  cursorPositions: Map<string, CursorPosition> // per-file cursor
  
  openTab(file: FileInfo, preview?: boolean): void
  closeTab(tabId: string): void
  setActiveTab(tabId: string): void
  markDirty(filePath: string): void
  markClean(filePath: string): void
  updateCursor(filePath: string, pos: CursorPosition): void
}
```

### useFileTreeStore

Holds the directory tree:

```typescript
interface FileTreeStore {
  rootPath: string | null
  nodes: Map<string, FileTreeNode>  // path → node
  expandedPaths: Set<string>
  selectedPath: string | null
  
  setRoot(path: string): void
  setChildren(parentPath: string, children: FileTreeNode[]): void
  toggleExpand(path: string): void
  setSelected(path: string): void
}
```

### useTerminalStore

Holds terminal session state:

```typescript
interface TerminalStore {
  sessions: TerminalSession[]
  activeSessionId: string | null
  
  addSession(session: TerminalSession): void
  removeSession(id: string): void
  setActive(id: string): void
}
```

### useGitStore

Holds git repository state:

```typescript
interface GitStore {
  isGitRepo: boolean
  currentBranch: string
  branches: Branch[]
  status: GitStatus | null      // staged, unstaged, untracked files
  lastCommit: CommitInfo | null
  isLoading: boolean
  
  setStatus(status: GitStatus): void
  setBranches(branches: Branch[]): void
  setCurrentBranch(branch: string): void
}
```

### useSearchStore

Holds search state:

```typescript
interface SearchStore {
  query: string
  replaceText: string
  results: SearchResult[]
  isSearching: boolean
  options: SearchOptions  // regex, caseSensitive, wholeWord
  
  setQuery(q: string): void
  setResults(results: SearchResult[]): void
  appendResults(results: SearchResult[]): void
  setSearching(v: boolean): void
}
```

### useSettingsStore

Holds all settings values, synced from main:

```typescript
interface SettingsStore {
  settings: VartaSettings
  isLoaded: boolean
  
  setSettings(settings: VartaSettings): void
  updateSetting<K extends keyof VartaSettings>(key: K, value: VartaSettings[K]): void
}
```

### useThemeStore

```typescript
interface ThemeStore {
  activeTheme: VartaTheme
  availableThemes: VartaTheme[]
  
  setTheme(theme: VartaTheme): void
  setAvailableThemes(themes: VartaTheme[]): void
}
```

### useAIStore

```typescript
interface AIStore {
  messages: ChatMessage[]
  isStreaming: boolean
  streamingContent: string   // partial content during stream
  hasApiKey: boolean
  selectedModel: string
  
  addMessage(msg: ChatMessage): void
  setStreaming(v: boolean): void
  appendStreamChunk(chunk: string): void
  finalizeStream(): void
  clearMessages(): void
}
```

### useNotificationStore

```typescript
interface NotificationStore {
  notifications: Notification[]
  
  push(notification: Omit<Notification, 'id'>): void
  dismiss(id: string): void
  dismissAll(): void
}
```

### useCommandStore

```typescript
interface CommandStore {
  commands: Command[]
  isPaletteOpen: boolean
  
  register(command: Command): void
  unregister(id: string): void
  openPalette(): void
  closePalette(): void
  execute(id: string): void
}
```

### useLayoutStore

```typescript
interface LayoutStore {
  sidebarWidth: number
  terminalHeight: number
  isSidebarVisible: boolean
  isTerminalVisible: boolean
  activeSidebarPanel: SidebarPanel
  
  setSidebarWidth(w: number): void
  setTerminalHeight(h: number): void
  toggleSidebar(): void
  toggleTerminal(): void
  setActivePanel(panel: SidebarPanel): void
}
```

### useExtensionStore

```typescript
interface ExtensionStore {
  extensions: Extension[]
  
  setExtensions(extensions: Extension[]): void
  updateExtension(id: string, update: Partial<Extension>): void
}
```

## The Hook Layer

13 hooks are the **only** code in the renderer that calls `window.varta.*`. Components call hooks; hooks call IPC.

### Hook Pattern

```typescript
// src/renderer/hooks/useFileOperations.ts
export function useFileOperations() {
  const { markDirty, markClean } = useEditorStore()
  const { push: notify } = useNotificationStore()

  const saveFile = useCallback(async (path: string, content: string) => {
    const result = await window.varta.fs.writeFile(path, content)
    if (!result.success) {
      notify({ type: 'error', message: result.error!.message })
      return false
    }
    markClean(path)
    return true
  }, [markClean, notify])

  return { saveFile, /* ... */ }
}
```

### Push Listener Pattern

For IPC push events (main → renderer), hooks register listeners in `useEffect` and return cleanup functions:

```typescript
// src/renderer/hooks/useFileWatcher.ts
export function useFileWatcher() {
  const { setChildren } = useFileTreeStore()

  useEffect(() => {
    const off = window.varta.fs.onWatchEvent((event) => {
      // refresh the affected directory
      refreshDirectory(event.dirPath)
    })
    return off  // cleanup: removes the listener
  }, [])
}
```

## Monaco Model Management

Varta maintains **one Monaco model per file path**. Models are created on first open and reused on subsequent opens. This preserves:

- Undo/redo history
- Cursor position
- Scroll position
- Unsaved changes (dirty state)

```typescript
// Model lifecycle
function getOrCreateModel(filePath: string, content: string, language: string) {
  const uri = monaco.Uri.file(filePath)
  let model = monaco.editor.getModel(uri)
  
  if (!model) {
    model = monaco.editor.createModel(content, language, uri)
  }
  
  return model
}

// Tab switching = model swap, not component remount
function switchToTab(tab: EditorTab) {
  const model = getOrCreateModel(tab.filePath, tab.content, tab.language)
  editorInstance.setModel(model)
  editorInstance.restoreViewState(savedViewStates.get(tab.filePath))
}
```

When a tab is closed, the model is disposed only if no other tab references the same file path.

## Theme Application

Themes are applied in two places simultaneously:

1. **CSS variables on `:root`** — Controls all React UI colors (sidebar, tabs, panels, status bar)
2. **Monaco theme registration** — Controls editor token colors and editor background

```typescript
function applyTheme(theme: VartaTheme) {
  // 1. Apply CSS variables
  const root = document.documentElement
  Object.entries(theme.cssVars).forEach(([key, value]) => {
    root.style.setProperty(key, value)
  })

  // 2. Register and activate Monaco theme
  monaco.editor.defineTheme(theme.id, {
    base: theme.base,  // 'vs-dark' or 'vs'
    inherit: true,
    rules: theme.monacoRules,
    colors: theme.monacoColors,
  })
  monaco.editor.setTheme(theme.id)
}
```

Theme changes are hot-reloaded — no restart required.

## Related

- [Architecture Overview](./overview.md) — Two-process model and component tree
- [Main Process](./main-process.md) — Services and IPC handlers
- [IPC Contract](./ipc-contract.md) — All 106 channels
- [Themes](../features/themes.md) — Theme system and custom themes
- [Editor](../features/editor.md) — Monaco model management details
