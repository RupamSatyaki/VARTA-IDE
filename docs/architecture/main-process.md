# Main Process

The Electron main process is the Node.js backend of Varta. It has full access to the operating system and is responsible for all I/O, native integrations, and security-sensitive operations.

## Entry Point

`src/main/index.ts` is the main process entry point. It runs in this order:

```typescript
// src/main/index.ts (simplified startup sequence)
import { app } from 'electron'
import { WindowManager } from './window/WindowManager'
import { registerAllHandlers } from './ipc'
import { logger } from './utils/logger'

// 1. Single instance lock
const gotLock = app.requestSingleInstanceLock()
if (!gotLock) {
  app.quit()
  process.exit(0)
}

// 2. Handle second-instance (focus existing window)
app.on('second-instance', () => {
  WindowManager.getInstance().focusMainWindow()
})

// 3. App ready
app.whenReady().then(async () => {
  logger.info('App starting')

  // 4. Register all IPC handlers (before window creation)
  registerAllHandlers()

  // 5. Create main window (restores last size/position)
  await WindowManager.getInstance().createMainWindow()

  logger.info('App ready')
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
```

## Single Instance Lock

Varta enforces a single running instance using `app.requestSingleInstanceLock()`. If a second instance is launched (e.g., double-clicking the app while it's already open), the second instance immediately quits and the first instance's window is focused and brought to the front.

## WindowManager

`src/main/window/WindowManager.ts` is a singleton that manages the main `BrowserWindow`.

Responsibilities:
- Creates the `BrowserWindow` with correct security settings (`contextIsolation: true`, `nodeIntegration: false`)
- Loads the preload script
- Restores window size and position from `windowState.json` (persisted via `electron-store`)
- Saves window state on close
- Handles macOS dock click (re-creates window if closed)
- Exposes `focusMainWindow()` for single-instance handling

```typescript
// Window creation with security settings
const win = new BrowserWindow({
  width: savedState.width,
  height: savedState.height,
  x: savedState.x,
  y: savedState.y,
  webPreferences: {
    preload: path.join(__dirname, '../preload/index.js'),
    contextIsolation: true,   // renderer cannot access Node APIs
    nodeIntegration: false,   // renderer cannot require() Node modules
    sandbox: false,           // preload needs Node access
  },
})
```

## Services

All business logic lives in services under `src/main/services/`. Each service follows the same lifecycle pattern:

```typescript
class SomeService {
  async init(): Promise<void> { /* setup */ }
  async destroy(): Promise<void> { /* cleanup */ }
}
```

Services are initialized before the window is shown and destroyed when the app quits.

### FileService

`src/main/services/FileService.ts`

Handles all filesystem operations:

| Method | Description |
|---|---|
| `readFile(path)` | Read file contents as UTF-8 string |
| `writeFile(path, content)` | Write string content to file |
| `readDirectory(path)` | List directory contents (non-recursive, one level) |
| `createFile(path)` | Create an empty file |
| `createDirectory(path)` | Create a directory (recursive) |
| `deleteFile(path)` | Delete a file |
| `deleteDirectory(path)` | Delete a directory recursively |
| `renameFile(oldPath, newPath)` | Rename or move a file |
| `copyFile(src, dest)` | Copy a file |
| `fileExists(path)` | Check if a path exists |
| `getFileStats(path)` | Get size, mtime, isDirectory |

All methods throw `VartaError` on failure. They never throw raw Node.js errors to IPC callers.

### GitService

`src/main/services/GitService.ts`

Wraps the `simple-git` library:

| Method | Description |
|---|---|
| `getStatus(repoPath)` | Get working tree status (modified, staged, untracked) |
| `stageFile(repoPath, filePath)` | Stage a specific file |
| `unstageFile(repoPath, filePath)` | Unstage a specific file |
| `discardChanges(repoPath, filePath)` | Discard working tree changes |
| `commit(repoPath, message)` | Create a commit |
| `push(repoPath, remote, branch)` | Push to remote |
| `pull(repoPath)` | Pull from remote |
| `fetch(repoPath)` | Fetch from remote |
| `getBranches(repoPath)` | List local and remote branches |
| `checkoutBranch(repoPath, branch)` | Switch branches |
| `createBranch(repoPath, name)` | Create and checkout new branch |
| `deleteBranch(repoPath, name)` | Delete a branch |
| `getDiff(repoPath, filePath)` | Get unified diff for a file |
| `getLog(repoPath, limit)` | Get recent commit log |
| `isGitRepo(path)` | Check if path is inside a git repo |

Non-git folders are handled gracefully — `isGitRepo` returns `false` and the Git panel shows a "Not a repository" state.

### TerminalService

`src/main/services/TerminalService.ts`

Manages `node-pty` pseudo-terminal instances:

| Method | Description |
|---|---|
| `createTerminal(id, cwd, shell?)` | Spawn a new PTY process |
| `writeToTerminal(id, data)` | Send keystrokes to PTY |
| `resizeTerminal(id, cols, rows)` | Resize the PTY |
| `killTerminal(id)` | Kill the PTY process |
| `getTerminalIds()` | List active terminal IDs |

PTY output is pushed to the renderer via `TerminalChannel.DATA` events. The service maintains a `Map<string, IPty>` of active terminals.

Shell auto-detection order:
1. User-configured shell path (from settings)
2. Windows: `pwsh` (PowerShell 7) → `powershell` (PowerShell 5) → `cmd.exe`
3. macOS/Linux: `$SHELL` environment variable → `/bin/zsh` → `/bin/bash`

### AIService

`src/main/services/AIService.ts`

Handles all Anthropic API communication:

| Method | Description |
|---|---|
| `setApiKey(key)` | Store API key in electron-store |
| `hasApiKey()` | Return boolean (key exists, never return the key) |
| `sendMessage(messages, context, model)` | Send chat message, stream response |
| `generateInlineHint(prefix, suffix, language)` | Generate inline code completion |
| `generateCommitMessage(diff)` | Generate a git commit message from diff |
| `cancelStream()` | Cancel the current streaming request |

Streaming works by emitting `AIChannel.STREAM_CHUNK` events for each text delta and `AIChannel.STREAM_END` when complete.

### SearchService

`src/main/services/SearchService.ts`

Performs async file content search:

| Method | Description |
|---|---|
| `search(rootPath, query, options)` | Start a search, stream results via PROGRESS |
| `cancel()` | Cancel the current search |

Files are read in batches of 20 with `setImmediate` between batches to avoid blocking the event loop. Results are pushed via `SearchChannel.PROGRESS` as they are found. Always-excluded directories: `node_modules`, `.git`, `dist`, `build`, `out`, `.next`, `coverage`, `__pycache__`.

### SettingsService

`src/main/services/SettingsService.ts`

Wraps `electron-store` for settings persistence:

| Method | Description |
|---|---|
| `get(key)` | Get a setting value |
| `set(key, value)` | Set a setting value |
| `getAll()` | Get all settings as an object |
| `reset()` | Reset all settings to defaults |
| `export(path)` | Write settings JSON to a file |
| `import(path)` | Read and apply settings from a file |

When any setting changes, `SettingsService` pushes the full settings object to the renderer via `SettingsChannel.CHANGED`.

### WatcherService

`src/main/services/WatcherService.ts`

Uses `@parcel/watcher` to watch the open project directory:

- Watches for `add`, `change`, and `unlink` events
- Highly performant: uses native OS APIs via a C++ core, making it suitable for large monorepos
- Automatically batches events efficiently, reducing IPC overhead
- Pushes `FileChannel.WATCH_EVENT` to the renderer with the event type and path
- Stops watching when a new folder is opened or the app is destroyed

### ExtensionService

`src/main/services/ExtensionService.ts`

Manages extension loading (planned for v2):

- Scans the extensions directory for valid extension manifests
- Validates `package.json` against the `ExtensionManifest` schema
- Loads extension contributions (commands, themes, languages)
- Provides sandboxed execution environment

See [Extension API](../api/extension-api.md) for the extension system design.

## IPC Handler Registration

All IPC handlers are registered in `src/main/ipc/index.ts`:

```typescript
// src/main/ipc/index.ts
import { registerFileHandlers } from './fileHandlers'
import { registerGitHandlers } from './gitHandlers'
import { registerTerminalHandlers } from './terminalHandlers'
// ...

export function registerAllHandlers(): void {
  registerFileHandlers()
  registerGitHandlers()
  registerTerminalHandlers()
  registerAIHandlers()
  registerSearchHandlers()
  registerSettingsHandlers()
  registerThemeHandlers()
  registerWindowHandlers()
  registerDialogHandlers()
  registerAppHandlers()
  registerExtensionHandlers()
}
```

Each handler file follows this pattern:

```typescript
// src/main/ipc/fileHandlers.ts
import { ipcMain } from 'electron'
import { FileChannel } from '../../shared/ipc'
import { FileService } from '../services/FileService'
import { VartaError } from '../../shared/errors'
import { logger } from '../utils/logger'

const fileService = new FileService()

export function registerFileHandlers(): void {
  ipcMain.handle(FileChannel.READ_FILE, async (_event, path: string) => {
    try {
      const content = await fileService.readFile(path)
      return { success: true, data: content }
    } catch (err) {
      logger.error('READ_FILE failed', { path, err })
      return { success: false, error: VartaError.from(err).toPayload() }
    }
  })
  // ... more handlers
}
```

## VartaError

All errors thrown by services and returned from IPC handlers are `VartaError` instances:

```typescript
// Usage in a service
throw new VartaError('FILE_NOT_FOUND', `File not found: ${path}`)

// Converting from a Node error
throw VartaError.from(nodeError)

// Serializing for IPC
return { success: false, error: vartaError.toPayload() }
```

`VartaError` never leaks stack traces to the renderer. The `toPayload()` method returns only `{ code, message }`. See [Error Codes](../api/error-codes.md) for all 68 error codes.

## Logger

`src/main/utils/logger.ts` wraps `electron-log` for structured logging:

```typescript
logger.info('Service started', { service: 'FileService' })
logger.warn('Slow operation', { duration: 1200 })
logger.error('Operation failed', { error: err.message })
```

Log files are written to:
- **Windows:** `%APPDATA%\varta\logs\main.log`
- **macOS:** `~/Library/Logs/varta/main.log`
- **Linux:** `~/.config/varta/logs/main.log`

Never use `console.log` in main process code — use `logger` instead.

## Related

- [Architecture Overview](./overview.md) — Two-process model diagram
- [IPC Contract](./ipc-contract.md) — All 106 channels
- [Security Model](./security-model.md) — Why the main process owns sensitive data
- [Error Codes](../api/error-codes.md) — VartaError reference
