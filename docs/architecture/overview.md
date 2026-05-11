# Architecture Overview

Varta IDE is built on Electron's two-process model. Understanding the separation between the main process and renderer process is essential for contributing to or extending Varta.

## The Two-Process Model

```
┌─────────────────────────────────────────────────────────────────┐
│                        RENDERER PROCESS                         │
│                                                                 │
│  React UI  ──►  Zustand Stores  ──►  Hooks (IPC callers)       │
│                                           │                     │
│  Monaco Editor                            │ window.varta.*      │
│  File Tree                                │ (contextBridge)     │
│  Terminal UI (xterm.js)                   │                     │
│  Git Panel                                ▼                     │
│  AI Chat Panel                    ┌───────────────┐            │
│  Search Panel                     │    PRELOAD    │            │
│                                   │  (bridge.ts)  │            │
└───────────────────────────────────┴───────┬───────┘────────────┘
                                            │
                              IPC (106 channels)
                              invoke / push events
                                            │
┌───────────────────────────────────────────▼────────────────────┐
│                         MAIN PROCESS                            │
│                                                                 │
│  WindowManager  ──►  IPC Handlers  ──►  Services               │
│                                                                 │
│  Services:                                                      │
│    FileService      — read/write/watch files                    │
│    GitService       — simple-git wrapper                        │
│    TerminalService  — node-pty PTY management                   │
│    AIService        — Anthropic API calls                       │
│    SearchService    — async file content search                 │
│    SettingsService  — electron-store persistence                │
│    WatcherService   — @parcel/watcher file system watcher              │
│    ExtensionService — extension loading (v2)                    │
│                                                                 │
│  Logger  ──►  log files on disk                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Main Process Responsibilities

The main process runs in Node.js with full system access. It owns:

- **File I/O** — All file reads, writes, directory listings, and renames go through `FileService`. The renderer never touches the filesystem directly.
- **Git operations** — `GitService` wraps `simple-git` and exposes status, stage, commit, push, pull, branch management, and diff.
- **Terminal PTY** — `TerminalService` creates and manages `node-pty` pseudo-terminals. PTY data streams to the renderer via push IPC events.
- **AI API calls** — `AIService` makes HTTPS requests to the Anthropic API. The API key lives only in the main process and is never sent to the renderer.
- **Settings persistence** — `SettingsService` reads and writes `varta-settings.json` via `electron-store`. Settings changes are pushed to the renderer.
- **File watching** — `WatcherService` uses `@parcel/watcher` to watch the open project directory and pushes change events to the renderer.
- **Window management** — `WindowManager` creates the `BrowserWindow`, persists window size/position, and handles single-instance lock.

## Renderer Process Responsibilities

The renderer runs in a sandboxed Chromium context with `nodeIntegration: false` and `contextIsolation: true`. It owns:

- **React UI** — All visual components, layouts, and interactions
- **Monaco Editor** — Code editing, syntax highlighting, IntelliSense
- **Zustand stores** — All client-side state (see [Store Architecture](#store-architecture))
- **xterm.js** — Terminal rendering (data comes from main via IPC)
- **Theme application** — CSS variables on `:root` + Monaco theme registration

The renderer **never** accesses the filesystem, spawns processes, or makes network requests directly. Everything goes through `window.varta.*`.

## The Preload Bridge

The preload script (`src/preload/index.ts`) runs in a privileged context that has access to both the Node.js `ipcRenderer` and the browser `window`. It uses Electron's `contextBridge` to expose a safe, typed API:

```typescript
// src/preload/index.ts (simplified)
import { contextBridge } from 'electron'
import { fileApi } from './api/fileApi'
import { gitApi } from './api/gitApi'
// ...

contextBridge.exposeInMainWorld('varta', {
  fs: fileApi,
  git: gitApi,
  terminal: terminalApi,
  ai: aiApi,
  // ...
})
```

The renderer accesses this as `window.varta.fs.readFile(...)`. Raw `ipcRenderer` is never exposed. See [Security Model](./security-model.md) for why this matters.

## IPC Communication

Varta uses 106 named IPC channels organized into 10 domains:

| Domain | Channels | Type |
|---|---|---|
| FileChannel | 15 | invoke + push |
| DialogChannel | 6 | invoke |
| TerminalChannel | 9 | invoke + push |
| GitChannel | 21 | invoke + push |
| SearchChannel | 4 | invoke + push |
| SettingsChannel | 8 | invoke + push |
| ThemeChannel | 5 | invoke + push |
| WindowChannel | 12 | invoke + push |
| AIChannel | 10 | invoke + push |
| ExtensionChannel | 7 | invoke |
| AppChannel | 9 | invoke + push |

**invoke** channels are request/response (renderer calls main, awaits result).
**push** channels are one-way events (main pushes data to renderer without a request).

All invoke responses use the `IPCResponse<T>` envelope:

```typescript
interface IPCResponse<T> {
  success: boolean
  data?: T
  error?: { code: string; message: string }
}
```

See [IPC Contract](./ipc-contract.md) for the full channel listing.

## Store Architecture

The renderer uses 12 Zustand stores, each owning a distinct slice of state:

| Store | Holds |
|---|---|
| `useEditorStore` | Open tabs, active tab, dirty files, cursor positions |
| `useFileTreeStore` | Directory tree nodes, expanded folders, selected item |
| `useTerminalStore` | Terminal sessions, active terminal ID |
| `useGitStore` | Git status, staged/unstaged changes, current branch, commits |
| `useSearchStore` | Search query, results, replace text, search options |
| `useSettingsStore` | All settings values (synced from main) |
| `useThemeStore` | Active theme, available themes |
| `useAIStore` | Chat messages, streaming state, API key status |
| `useNotificationStore` | Toast notifications queue |
| `useCommandStore` | Registered commands, command palette open state |
| `useLayoutStore` | Sidebar width, panel heights, panel visibility |
| `useExtensionStore` | Loaded extensions, extension state |

Stores hold **state only**. They do not call IPC. All IPC calls happen in hooks.

## Hook Layer

13 custom hooks act as the only bridge between the React component tree and the IPC layer:

| Hook | IPC Domain |
|---|---|
| `useFileOperations` | FileChannel |
| `useFileWatcher` | FileChannel (push) |
| `useTerminal` | TerminalChannel |
| `useGit` | GitChannel |
| `useSearch` | SearchChannel |
| `useSettings` | SettingsChannel |
| `useTheme` | ThemeChannel |
| `useDialog` | DialogChannel |
| `useWindow` | WindowChannel |
| `useAI` | AIChannel |
| `useExtensions` | ExtensionChannel |
| `useApp` | AppChannel |
| `useKeyboardShortcuts` | (command registry, no IPC) |

Components call hooks. Hooks call `window.varta.*`. This keeps components pure and testable.

## Component Tree Overview

```
App
├── CommandPalette (global overlay)
├── NotificationContainer (global overlay)
├── TitleBar
├── MainLayout
│   ├── Sidebar
│   │   ├── SidebarIcons
│   │   └── SidebarPanel (active panel)
│   │       ├── FileTree
│   │       ├── SearchPanel
│   │       ├── GitPanel
│   │       ├── AIChatPanel
│   │       └── ExtensionsPanel
│   ├── EditorArea
│   │   ├── EditorTabs
│   │   └── EditorPane
│   │       ├── CodeCanvas (Monaco)
│   │       └── DiffEditor
│   └── BottomPanel
│       └── TerminalPanel
│           ├── TerminalTabs
│           └── TerminalInstance (xterm.js)
└── StatusBar
```

## Related

- [Main Process](./main-process.md) — Services, IPC handlers, and lifecycle
- [Renderer Process](./renderer-process.md) — Stores, hooks, and component details
- [IPC Contract](./ipc-contract.md) — All 106 channels documented
- [Security Model](./security-model.md) — Why contextIsolation matters
