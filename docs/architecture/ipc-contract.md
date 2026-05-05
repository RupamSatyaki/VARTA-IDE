# IPC Contract

Varta uses 106 named IPC channels to communicate between the renderer and main processes. All channels are defined as TypeScript enums in `src/shared/ipc.ts`.

## Channel Types

**invoke** — Request/response. The renderer calls `ipcRenderer.invoke(channel, ...args)` and awaits a result. The main process handles it with `ipcMain.handle(channel, handler)`. All invoke responses use `IPCResponse<T>`.

**push** — One-way event from main to renderer. The main process calls `webContents.send(channel, data)`. The renderer listens with `ipcRenderer.on(channel, handler)`. Push channels are used for streaming data (terminal output, search results, AI chunks) and change notifications (file watch events, settings changes).

## IPCResponse<T> Pattern

All invoke channels return this envelope:

```typescript
interface IPCResponse<T = void> {
  success: boolean
  data?: T
  error?: {
    code: string    // VartaError code, e.g. "FILE_NOT_FOUND"
    message: string // Human-readable message
  }
}
```

Renderer usage:

```typescript
const result = await window.varta.fs.readFile('/path/to/file.ts')
if (!result.success) {
  console.error(result.error!.code, result.error!.message)
  return
}
const content = result.data! // typed as string
```

## All 106 Channels

### FileChannel (15 channels)

| Channel | Enum Value | Type | Description |
|---|---|---|---|
| `FileChannel.READ_FILE` | `file:read-file` | invoke | Read file contents as string |
| `FileChannel.WRITE_FILE` | `file:write-file` | invoke | Write string content to file |
| `FileChannel.READ_DIRECTORY` | `file:read-directory` | invoke | List directory contents (one level) |
| `FileChannel.CREATE_FILE` | `file:create-file` | invoke | Create a new empty file |
| `FileChannel.CREATE_DIRECTORY` | `file:create-directory` | invoke | Create a directory (recursive) |
| `FileChannel.DELETE_FILE` | `file:delete-file` | invoke | Delete a file |
| `FileChannel.DELETE_DIRECTORY` | `file:delete-directory` | invoke | Delete a directory recursively |
| `FileChannel.RENAME` | `file:rename` | invoke | Rename or move a file/directory |
| `FileChannel.COPY_FILE` | `file:copy-file` | invoke | Copy a file |
| `FileChannel.FILE_EXISTS` | `file:file-exists` | invoke | Check if path exists |
| `FileChannel.GET_STATS` | `file:get-stats` | invoke | Get file size, mtime, type |
| `FileChannel.GET_PATH_INFO` | `file:get-path-info` | invoke | Get basename, dirname, extension |
| `FileChannel.WATCH_START` | `file:watch-start` | invoke | Start watching a directory |
| `FileChannel.WATCH_STOP` | `file:watch-stop` | invoke | Stop watching |
| `FileChannel.WATCH_EVENT` | `file:watch-event` | push | File system change event |

### DialogChannel (6 channels)

| Channel | Enum Value | Type | Description |
|---|---|---|---|
| `DialogChannel.OPEN_FOLDER` | `dialog:open-folder` | invoke | Show native folder picker |
| `DialogChannel.OPEN_FILE` | `dialog:open-file` | invoke | Show native file picker |
| `DialogChannel.SAVE_FILE` | `dialog:save-file` | invoke | Show native save dialog |
| `DialogChannel.SHOW_MESSAGE` | `dialog:show-message` | invoke | Show native message box |
| `DialogChannel.SHOW_ERROR` | `dialog:show-error` | invoke | Show native error dialog |
| `DialogChannel.SHOW_CONFIRM` | `dialog:show-confirm` | invoke | Show native confirm dialog |

### TerminalChannel (9 channels)

| Channel | Enum Value | Type | Description |
|---|---|---|---|
| `TerminalChannel.CREATE` | `terminal:create` | invoke | Spawn a new PTY terminal |
| `TerminalChannel.WRITE` | `terminal:write` | invoke | Send input to PTY |
| `TerminalChannel.RESIZE` | `terminal:resize` | invoke | Resize PTY dimensions |
| `TerminalChannel.KILL` | `terminal:kill` | invoke | Kill a terminal session |
| `TerminalChannel.LIST` | `terminal:list` | invoke | List active terminal IDs |
| `TerminalChannel.GET_SHELL` | `terminal:get-shell` | invoke | Get auto-detected shell path |
| `TerminalChannel.DATA` | `terminal:data` | push | PTY output data chunk |
| `TerminalChannel.EXIT` | `terminal:exit` | push | PTY process exited |
| `TerminalChannel.TITLE` | `terminal:title` | push | Terminal title changed |

### GitChannel (21 channels)

| Channel | Enum Value | Type | Description |
|---|---|---|---|
| `GitChannel.IS_REPO` | `git:is-repo` | invoke | Check if path is a git repo |
| `GitChannel.GET_STATUS` | `git:get-status` | invoke | Get working tree status |
| `GitChannel.STAGE_FILE` | `git:stage-file` | invoke | Stage a file |
| `GitChannel.UNSTAGE_FILE` | `git:unstage-file` | invoke | Unstage a file |
| `GitChannel.STAGE_ALL` | `git:stage-all` | invoke | Stage all changes |
| `GitChannel.UNSTAGE_ALL` | `git:unstage-all` | invoke | Unstage all changes |
| `GitChannel.DISCARD_CHANGES` | `git:discard-changes` | invoke | Discard working tree changes |
| `GitChannel.COMMIT` | `git:commit` | invoke | Create a commit |
| `GitChannel.PUSH` | `git:push` | invoke | Push to remote |
| `GitChannel.PULL` | `git:pull` | invoke | Pull from remote |
| `GitChannel.FETCH` | `git:fetch` | invoke | Fetch from remote |
| `GitChannel.GET_BRANCHES` | `git:get-branches` | invoke | List branches |
| `GitChannel.CHECKOUT_BRANCH` | `git:checkout-branch` | invoke | Switch branches |
| `GitChannel.CREATE_BRANCH` | `git:create-branch` | invoke | Create new branch |
| `GitChannel.DELETE_BRANCH` | `git:delete-branch` | invoke | Delete a branch |
| `GitChannel.GET_DIFF` | `git:get-diff` | invoke | Get file diff |
| `GitChannel.GET_LOG` | `git:get-log` | invoke | Get commit log |
| `GitChannel.GET_REMOTE` | `git:get-remote` | invoke | Get remote URL |
| `GitChannel.INIT` | `git:init` | invoke | Initialize a new repo |
| `GitChannel.STATUS_CHANGED` | `git:status-changed` | push | Git status updated (auto-refresh) |
| `GitChannel.BRANCH_CHANGED` | `git:branch-changed` | push | Current branch changed |

### SearchChannel (4 channels)

| Channel | Enum Value | Type | Description |
|---|---|---|---|
| `SearchChannel.START` | `search:start` | invoke | Begin a search |
| `SearchChannel.CANCEL` | `search:cancel` | invoke | Cancel current search |
| `SearchChannel.REPLACE_ALL` | `search:replace-all` | invoke | Replace all occurrences |
| `SearchChannel.PROGRESS` | `search:progress` | push | Streaming search results |

### SettingsChannel (8 channels)

| Channel | Enum Value | Type | Description |
|---|---|---|---|
| `SettingsChannel.GET_ALL` | `settings:get-all` | invoke | Get all settings |
| `SettingsChannel.GET` | `settings:get` | invoke | Get a single setting |
| `SettingsChannel.SET` | `settings:set` | invoke | Set a single setting |
| `SettingsChannel.SET_MANY` | `settings:set-many` | invoke | Set multiple settings |
| `SettingsChannel.RESET` | `settings:reset` | invoke | Reset to defaults |
| `SettingsChannel.EXPORT` | `settings:export` | invoke | Export settings to file |
| `SettingsChannel.IMPORT` | `settings:import` | invoke | Import settings from file |
| `SettingsChannel.CHANGED` | `settings:changed` | push | Settings updated notification |

### ThemeChannel (5 channels)

| Channel | Enum Value | Type | Description |
|---|---|---|---|
| `ThemeChannel.GET_THEMES` | `theme:get-themes` | invoke | List available themes |
| `ThemeChannel.GET_ACTIVE` | `theme:get-active` | invoke | Get active theme |
| `ThemeChannel.SET_THEME` | `theme:set-theme` | invoke | Set active theme by ID |
| `ThemeChannel.LOAD_CUSTOM` | `theme:load-custom` | invoke | Load a custom theme from file |
| `ThemeChannel.CHANGED` | `theme:changed` | push | Active theme changed |

### WindowChannel (12 channels)

| Channel | Enum Value | Type | Description |
|---|---|---|---|
| `WindowChannel.MINIMIZE` | `window:minimize` | invoke | Minimize window |
| `WindowChannel.MAXIMIZE` | `window:maximize` | invoke | Maximize/restore window |
| `WindowChannel.CLOSE` | `window:close` | invoke | Close window |
| `WindowChannel.IS_MAXIMIZED` | `window:is-maximized` | invoke | Check if maximized |
| `WindowChannel.GET_SIZE` | `window:get-size` | invoke | Get window dimensions |
| `WindowChannel.SET_SIZE` | `window:set-size` | invoke | Set window dimensions |
| `WindowChannel.GET_POSITION` | `window:get-position` | invoke | Get window position |
| `WindowChannel.SET_POSITION` | `window:set-position` | invoke | Set window position |
| `WindowChannel.SET_TITLE` | `window:set-title` | invoke | Set window title |
| `WindowChannel.TOGGLE_FULLSCREEN` | `window:toggle-fullscreen` | invoke | Toggle fullscreen |
| `WindowChannel.MAXIMIZED_CHANGED` | `window:maximized-changed` | push | Maximize state changed |
| `WindowChannel.FOCUS_CHANGED` | `window:focus-changed` | push | Window focus changed |

### AIChannel (10 channels)

| Channel | Enum Value | Type | Description |
|---|---|---|---|
| `AIChannel.SET_API_KEY` | `ai:set-api-key` | invoke | Store API key (write-only) |
| `AIChannel.HAS_API_KEY` | `ai:has-api-key` | invoke | Check if key is set (boolean) |
| `AIChannel.SEND_MESSAGE` | `ai:send-message` | invoke | Send chat message |
| `AIChannel.CANCEL_STREAM` | `ai:cancel-stream` | invoke | Cancel streaming response |
| `AIChannel.GET_INLINE_HINT` | `ai:get-inline-hint` | invoke | Get inline code completion |
| `AIChannel.GENERATE_COMMIT_MSG` | `ai:generate-commit-msg` | invoke | Generate commit message |
| `AIChannel.GET_MODELS` | `ai:get-models` | invoke | List available models |
| `AIChannel.STREAM_CHUNK` | `ai:stream-chunk` | push | Streaming response chunk |
| `AIChannel.STREAM_END` | `ai:stream-end` | push | Stream completed |
| `AIChannel.STREAM_ERROR` | `ai:stream-error` | push | Stream error |

### ExtensionChannel (7 channels)

| Channel | Enum Value | Type | Description |
|---|---|---|---|
| `ExtensionChannel.LIST` | `extension:list` | invoke | List installed extensions |
| `ExtensionChannel.INSTALL` | `extension:install` | invoke | Install an extension |
| `ExtensionChannel.UNINSTALL` | `extension:uninstall` | invoke | Uninstall an extension |
| `ExtensionChannel.ENABLE` | `extension:enable` | invoke | Enable an extension |
| `ExtensionChannel.DISABLE` | `extension:disable` | invoke | Disable an extension |
| `ExtensionChannel.GET_CONTRIBUTIONS` | `extension:get-contributions` | invoke | Get extension contributions |
| `ExtensionChannel.RELOAD` | `extension:reload` | invoke | Reload all extensions |

### AppChannel (9 channels)

| Channel | Enum Value | Type | Description |
|---|---|---|---|
| `AppChannel.GET_VERSION` | `app:get-version` | invoke | Get app version string |
| `AppChannel.GET_PLATFORM` | `app:get-platform` | invoke | Get OS platform |
| `AppChannel.GET_PATHS` | `app:get-paths` | invoke | Get app/user data paths |
| `AppChannel.OPEN_EXTERNAL` | `app:open-external` | invoke | Open URL in browser |
| `AppChannel.SHOW_ITEM_IN_FOLDER` | `app:show-item-in-folder` | invoke | Reveal file in Finder/Explorer |
| `AppChannel.RELAUNCH` | `app:relaunch` | invoke | Relaunch the app |
| `AppChannel.QUIT` | `app:quit` | invoke | Quit the app |
| `AppChannel.READY` | `app:ready` | push | App finished initializing |
| `AppChannel.UPDATE_AVAILABLE` | `app:update-available` | push | Auto-update available |

## Adding a New IPC Channel

Follow these four steps to add a new channel:

**Step 1: Add the channel to the enum in `src/shared/ipc.ts`**

```typescript
// src/shared/ipc.ts
export enum FileChannel {
  // ... existing channels
  MY_NEW_CHANNEL = 'file:my-new-channel',  // add here
}
```

**Step 2: Add the handler in `src/main/ipc/fileHandlers.ts`**

```typescript
ipcMain.handle(FileChannel.MY_NEW_CHANNEL, async (_event, arg: string) => {
  try {
    const result = await fileService.myNewOperation(arg)
    return { success: true, data: result }
  } catch (err) {
    logger.error('MY_NEW_CHANNEL failed', { err })
    return { success: false, error: VartaError.from(err).toPayload() }
  }
})
```

**Step 3: Add the wrapper in `src/preload/api/fileApi.ts`**

```typescript
export const fileApi = {
  // ... existing methods
  myNewOperation: (arg: string): Promise<IPCResponse<ReturnType>> =>
    ipcRenderer.invoke(FileChannel.MY_NEW_CHANNEL, arg),
}
```

**Step 4: Add the type to `src/preload/varta.d.ts`**

```typescript
interface VartaFileAPI {
  // ... existing methods
  myNewOperation(arg: string): Promise<IPCResponse<ReturnType>>
}
```

## Related

- [Architecture Overview](./overview.md) — Two-process model
- [Main Process](./main-process.md) — Handler registration pattern
- [window.varta API](../api/window-varta-api.md) — Renderer-side API reference
- [Error Codes](../api/error-codes.md) — VartaError codes used in responses
