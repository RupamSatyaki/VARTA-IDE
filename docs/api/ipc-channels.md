# IPC Channels

All 106 IPC channels used in Varta, with their enum values, types, and descriptions. Channels are defined in `src/shared/ipc.ts`.

## Channel Types

**invoke** — Request/response. Renderer calls `ipcRenderer.invoke(channel, ...args)`, main handles with `ipcMain.handle(channel, handler)`. Returns `IPCResponse<T>`.

**push** — One-way event from main to renderer. Main calls `webContents.send(channel, data)`. Renderer listens with `ipcRenderer.on(channel, handler)`. No return value.

## All Channels

### FileChannel

| Channel Name | Enum Value | Type | Description |
|---|---|---|---|
| `FileChannel.READ_FILE` | `file:read-file` | invoke | Read file as UTF-8 string |
| `FileChannel.WRITE_FILE` | `file:write-file` | invoke | Write string to file |
| `FileChannel.READ_DIRECTORY` | `file:read-directory` | invoke | List directory (one level) |
| `FileChannel.CREATE_FILE` | `file:create-file` | invoke | Create empty file |
| `FileChannel.CREATE_DIRECTORY` | `file:create-directory` | invoke | Create directory recursively |
| `FileChannel.DELETE_FILE` | `file:delete-file` | invoke | Delete a file |
| `FileChannel.DELETE_DIRECTORY` | `file:delete-directory` | invoke | Delete directory recursively |
| `FileChannel.RENAME` | `file:rename` | invoke | Rename or move file/directory |
| `FileChannel.COPY_FILE` | `file:copy-file` | invoke | Copy a file |
| `FileChannel.FILE_EXISTS` | `file:file-exists` | invoke | Check if path exists |
| `FileChannel.GET_STATS` | `file:get-stats` | invoke | Get file size, mtime, type |
| `FileChannel.GET_PATH_INFO` | `file:get-path-info` | invoke | Get basename, dirname, extension |
| `FileChannel.WATCH_START` | `file:watch-start` | invoke | Start watching a directory |
| `FileChannel.WATCH_STOP` | `file:watch-stop` | invoke | Stop watching |
| `FileChannel.WATCH_EVENT` | `file:watch-event` | push | File system change event |

### DialogChannel

| Channel Name | Enum Value | Type | Description |
|---|---|---|---|
| `DialogChannel.OPEN_FOLDER` | `dialog:open-folder` | invoke | Native folder picker |
| `DialogChannel.OPEN_FILE` | `dialog:open-file` | invoke | Native file picker |
| `DialogChannel.SAVE_FILE` | `dialog:save-file` | invoke | Native save dialog |
| `DialogChannel.SHOW_MESSAGE` | `dialog:show-message` | invoke | Native message box |
| `DialogChannel.SHOW_ERROR` | `dialog:show-error` | invoke | Native error dialog |
| `DialogChannel.SHOW_CONFIRM` | `dialog:show-confirm` | invoke | Native confirm dialog |

### TerminalChannel

| Channel Name | Enum Value | Type | Description |
|---|---|---|---|
| `TerminalChannel.CREATE` | `terminal:create` | invoke | Spawn new PTY |
| `TerminalChannel.WRITE` | `terminal:write` | invoke | Send input to PTY |
| `TerminalChannel.RESIZE` | `terminal:resize` | invoke | Resize PTY dimensions |
| `TerminalChannel.KILL` | `terminal:kill` | invoke | Kill terminal session |
| `TerminalChannel.LIST` | `terminal:list` | invoke | List active terminal IDs |
| `TerminalChannel.GET_SHELL` | `terminal:get-shell` | invoke | Get auto-detected shell |
| `TerminalChannel.DATA` | `terminal:data` | push | PTY output data chunk |
| `TerminalChannel.EXIT` | `terminal:exit` | push | PTY process exited |
| `TerminalChannel.TITLE` | `terminal:title` | push | Terminal title changed |

### GitChannel

| Channel Name | Enum Value | Type | Description |
|---|---|---|---|
| `GitChannel.IS_REPO` | `git:is-repo` | invoke | Check if path is git repo |
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
| `GitChannel.INIT` | `git:init` | invoke | Initialize new repo |
| `GitChannel.STATUS_CHANGED` | `git:status-changed` | push | Git status updated |
| `GitChannel.BRANCH_CHANGED` | `git:branch-changed` | push | Current branch changed |

### SearchChannel

| Channel Name | Enum Value | Type | Description |
|---|---|---|---|
| `SearchChannel.START` | `search:start` | invoke | Begin a search |
| `SearchChannel.CANCEL` | `search:cancel` | invoke | Cancel current search |
| `SearchChannel.REPLACE_ALL` | `search:replace-all` | invoke | Replace all occurrences |
| `SearchChannel.PROGRESS` | `search:progress` | push | Streaming search results |

### SettingsChannel

| Channel Name | Enum Value | Type | Description |
|---|---|---|---|
| `SettingsChannel.GET_ALL` | `settings:get-all` | invoke | Get all settings |
| `SettingsChannel.GET` | `settings:get` | invoke | Get a single setting |
| `SettingsChannel.SET` | `settings:set` | invoke | Set a single setting |
| `SettingsChannel.SET_MANY` | `settings:set-many` | invoke | Set multiple settings |
| `SettingsChannel.RESET` | `settings:reset` | invoke | Reset to defaults |
| `SettingsChannel.EXPORT` | `settings:export` | invoke | Export settings to file |
| `SettingsChannel.IMPORT` | `settings:import` | invoke | Import settings from file |
| `SettingsChannel.CHANGED` | `settings:changed` | push | Settings updated |

### ThemeChannel

| Channel Name | Enum Value | Type | Description |
|---|---|---|---|
| `ThemeChannel.GET_THEMES` | `theme:get-themes` | invoke | List available themes |
| `ThemeChannel.GET_ACTIVE` | `theme:get-active` | invoke | Get active theme |
| `ThemeChannel.SET_THEME` | `theme:set-theme` | invoke | Set active theme by ID |
| `ThemeChannel.LOAD_CUSTOM` | `theme:load-custom` | invoke | Load custom theme from file |
| `ThemeChannel.CHANGED` | `theme:changed` | push | Active theme changed |

### WindowChannel

| Channel Name | Enum Value | Type | Description |
|---|---|---|---|
| `WindowChannel.MINIMIZE` | `window:minimize` | invoke | Minimize window |
| `WindowChannel.MAXIMIZE` | `window:maximize` | invoke | Maximize/restore |
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

### AIChannel

| Channel Name | Enum Value | Type | Description |
|---|---|---|---|
| `AIChannel.SET_API_KEY` | `ai:set-api-key` | invoke | Store API key (write-only) |
| `AIChannel.HAS_API_KEY` | `ai:has-api-key` | invoke | Check if key is set |
| `AIChannel.SEND_MESSAGE` | `ai:send-message` | invoke | Send chat message |
| `AIChannel.CANCEL_STREAM` | `ai:cancel-stream` | invoke | Cancel streaming |
| `AIChannel.GET_INLINE_HINT` | `ai:get-inline-hint` | invoke | Get inline completion |
| `AIChannel.GENERATE_COMMIT_MSG` | `ai:generate-commit-msg` | invoke | Generate commit message |
| `AIChannel.GET_MODELS` | `ai:get-models` | invoke | List available models |
| `AIChannel.STREAM_CHUNK` | `ai:stream-chunk` | push | Streaming response chunk |
| `AIChannel.STREAM_END` | `ai:stream-end` | push | Stream completed |
| `AIChannel.STREAM_ERROR` | `ai:stream-error` | push | Stream error |

### ExtensionChannel

| Channel Name | Enum Value | Type | Description |
|---|---|---|---|
| `ExtensionChannel.LIST` | `extension:list` | invoke | List installed extensions |
| `ExtensionChannel.INSTALL` | `extension:install` | invoke | Install an extension |
| `ExtensionChannel.UNINSTALL` | `extension:uninstall` | invoke | Uninstall an extension |
| `ExtensionChannel.ENABLE` | `extension:enable` | invoke | Enable an extension |
| `ExtensionChannel.DISABLE` | `extension:disable` | invoke | Disable an extension |
| `ExtensionChannel.GET_CONTRIBUTIONS` | `extension:get-contributions` | invoke | Get contributions |
| `ExtensionChannel.RELOAD` | `extension:reload` | invoke | Reload all extensions |

### AppChannel

| Channel Name | Enum Value | Type | Description |
|---|---|---|---|
| `AppChannel.GET_VERSION` | `app:get-version` | invoke | Get app version |
| `AppChannel.GET_PLATFORM` | `app:get-platform` | invoke | Get OS platform |
| `AppChannel.GET_PATHS` | `app:get-paths` | invoke | Get app/user data paths |
| `AppChannel.OPEN_EXTERNAL` | `app:open-external` | invoke | Open URL in browser |
| `AppChannel.SHOW_ITEM_IN_FOLDER` | `app:show-item-in-folder` | invoke | Reveal in Finder/Explorer |
| `AppChannel.RELAUNCH` | `app:relaunch` | invoke | Relaunch the app |
| `AppChannel.QUIT` | `app:quit` | invoke | Quit the app |
| `AppChannel.READY` | `app:ready` | push | App finished initializing |
| `AppChannel.UPDATE_AVAILABLE` | `app:update-available` | push | Auto-update available |

## Adding a New Channel

Follow these four steps:

**Step 1: Add to `src/shared/ipc.ts`**

```typescript
export enum FileChannel {
  // ... existing
  MY_NEW_CHANNEL = 'file:my-new-channel',
}
```

**Step 2: Add handler in `src/main/ipc/fileHandlers.ts`**

```typescript
ipcMain.handle(FileChannel.MY_NEW_CHANNEL, async (_event, arg: string) => {
  try {
    const result = await fileService.myNewOperation(arg)
    return { success: true, data: result }
  } catch (err) {
    return { success: false, error: VartaError.from(err).toPayload() }
  }
})
```

**Step 3: Add wrapper in `src/preload/api/fileApi.ts`**

```typescript
myNewOperation: (arg: string): Promise<IPCResponse<string>> =>
  ipcRenderer.invoke(FileChannel.MY_NEW_CHANNEL, arg),
```

**Step 4: Add type to `src/preload/varta.d.ts`**

```typescript
interface VartaFileAPI {
  // ...
  myNewOperation(arg: string): Promise<IPCResponse<string>>
}
```

## Related

- [window.varta API](./window-varta-api.md) — Renderer-side API reference
- [IPC Contract](../architecture/ipc-contract.md) — Architecture and patterns
- [Error Codes](./error-codes.md) — Error codes in IPCResponse.error
