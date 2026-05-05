# window.varta API

`window.varta` is the complete API surface exposed to the renderer process via Electron's `contextBridge`. It is the only way the renderer communicates with the main process.

All functions return `Promise<IPCResponse<T>>` for invoke channels, or return a cleanup function `() => void` for push listeners.

## IPCResponse<T> Pattern

```typescript
interface IPCResponse<T = void> {
  success: boolean
  data?: T
  error?: { code: string; message: string }
}
```

**Unwrapping pattern:**

```typescript
const result = await window.varta.fs.readFile('/path/to/file.ts')
if (!result.success) {
  // handle error
  console.error(result.error!.code, result.error!.message)
  return
}
const content = result.data! // T is string here
```

## Push Listener Pattern

Push listeners register a callback and return a cleanup function. Always call the cleanup in `useEffect`:

```typescript
useEffect(() => {
  const off = window.varta.fs.onWatchEvent((event) => {
    console.log(event.type, event.path)
  })
  return off  // called on unmount — removes the listener
}, [])
```

## Error Handling Pattern

```typescript
async function saveFile(path: string, content: string) {
  const result = await window.varta.fs.writeFile(path, content)
  if (!result.success) {
    const { code, message } = result.error!
    if (code === 'PERMISSION_DENIED') {
      showNotification({ type: 'error', message: 'Cannot save: permission denied' })
    } else {
      showNotification({ type: 'error', message })
    }
    return false
  }
  return true
}
```

---

## window.varta.fs

File system operations.

| Function | Signature | Returns | Description |
|---|---|---|---|
| `readFile` | `(path: string) => Promise<IPCResponse<string>>` | File content | Read file as UTF-8 string |
| `writeFile` | `(path: string, content: string) => Promise<IPCResponse>` | void | Write string to file |
| `readDirectory` | `(path: string) => Promise<IPCResponse<FileEntry[]>>` | Directory entries | List directory (one level) |
| `createFile` | `(path: string) => Promise<IPCResponse>` | void | Create empty file |
| `createDirectory` | `(path: string) => Promise<IPCResponse>` | void | Create directory (recursive) |
| `deleteFile` | `(path: string) => Promise<IPCResponse>` | void | Delete a file |
| `deleteDirectory` | `(path: string) => Promise<IPCResponse>` | void | Delete directory recursively |
| `rename` | `(oldPath: string, newPath: string) => Promise<IPCResponse>` | void | Rename or move |
| `copyFile` | `(src: string, dest: string) => Promise<IPCResponse>` | void | Copy a file |
| `fileExists` | `(path: string) => Promise<IPCResponse<boolean>>` | boolean | Check if path exists |
| `getStats` | `(path: string) => Promise<IPCResponse<FileStats>>` | FileStats | Get file metadata |
| `getPathInfo` | `(path: string) => Promise<IPCResponse<PathInfo>>` | PathInfo | Get basename, dirname, ext |
| `watchStart` | `(path: string) => Promise<IPCResponse>` | void | Start watching directory |
| `watchStop` | `() => Promise<IPCResponse>` | void | Stop watching |
| `onWatchEvent` | `(cb: (event: WatchEvent) => void) => () => void` | cleanup fn | Listen for file changes |

```typescript
// Example: read a file
const result = await window.varta.fs.readFile('/project/src/index.ts')
if (result.success) {
  console.log(result.data) // string
}

// Example: watch for changes
const off = window.varta.fs.onWatchEvent((event) => {
  // event: { type: 'add'|'change'|'unlink'|'addDir'|'unlinkDir', path: string }
})
```

---

## window.varta.terminal

Terminal (PTY) management.

| Function | Signature | Returns | Description |
|---|---|---|---|
| `create` | `(id: string, cwd: string, shell?: string) => Promise<IPCResponse>` | void | Spawn PTY |
| `write` | `(id: string, data: string) => Promise<IPCResponse>` | void | Send input to PTY |
| `resize` | `(id: string, cols: number, rows: number) => Promise<IPCResponse>` | void | Resize PTY |
| `kill` | `(id: string) => Promise<IPCResponse>` | void | Kill terminal |
| `list` | `() => Promise<IPCResponse<string[]>>` | string[] | List active IDs |
| `getShell` | `() => Promise<IPCResponse<string>>` | string | Get auto-detected shell |
| `onData` | `(cb: (payload: {id: string, data: string}) => void) => () => void` | cleanup fn | PTY output |
| `onExit` | `(cb: (payload: {id: string, code: number}) => void) => () => void` | cleanup fn | PTY exit |
| `onTitle` | `(cb: (payload: {id: string, title: string}) => void) => () => void` | cleanup fn | Title change |

---

## window.varta.git

Git operations.

| Function | Signature | Returns | Description |
|---|---|---|---|
| `isRepo` | `(path: string) => Promise<IPCResponse<boolean>>` | boolean | Check if git repo |
| `getStatus` | `(repoPath: string) => Promise<IPCResponse<GitStatus>>` | GitStatus | Working tree status |
| `stageFile` | `(repoPath: string, filePath: string) => Promise<IPCResponse>` | void | Stage file |
| `unstageFile` | `(repoPath: string, filePath: string) => Promise<IPCResponse>` | void | Unstage file |
| `stageAll` | `(repoPath: string) => Promise<IPCResponse>` | void | Stage all |
| `unstageAll` | `(repoPath: string) => Promise<IPCResponse>` | void | Unstage all |
| `discardChanges` | `(repoPath: string, filePath: string) => Promise<IPCResponse>` | void | Discard changes |
| `commit` | `(repoPath: string, message: string) => Promise<IPCResponse>` | void | Create commit |
| `push` | `(repoPath: string, remote?: string, branch?: string) => Promise<IPCResponse>` | void | Push |
| `pull` | `(repoPath: string) => Promise<IPCResponse>` | void | Pull |
| `fetch` | `(repoPath: string) => Promise<IPCResponse>` | void | Fetch |
| `getBranches` | `(repoPath: string) => Promise<IPCResponse<Branch[]>>` | Branch[] | List branches |
| `checkoutBranch` | `(repoPath: string, branch: string) => Promise<IPCResponse>` | void | Checkout branch |
| `createBranch` | `(repoPath: string, name: string) => Promise<IPCResponse>` | void | Create branch |
| `deleteBranch` | `(repoPath: string, name: string) => Promise<IPCResponse>` | void | Delete branch |
| `getDiff` | `(repoPath: string, filePath: string) => Promise<IPCResponse<string>>` | string | Get diff |
| `getLog` | `(repoPath: string, limit?: number) => Promise<IPCResponse<CommitInfo[]>>` | CommitInfo[] | Commit log |
| `onStatusChanged` | `(cb: (status: GitStatus) => void) => () => void` | cleanup fn | Status push |
| `onBranchChanged` | `(cb: (branch: string) => void) => () => void` | cleanup fn | Branch push |

---

## window.varta.search

File content search.

| Function | Signature | Returns | Description |
|---|---|---|---|
| `start` | `(rootPath: string, query: string, options: SearchOptions) => Promise<IPCResponse>` | void | Start search |
| `cancel` | `() => Promise<IPCResponse>` | void | Cancel search |
| `replaceAll` | `(rootPath: string, query: string, replacement: string, options: SearchOptions) => Promise<IPCResponse<ReplaceResult>>` | ReplaceResult | Replace all |
| `onProgress` | `(cb: (payload: SearchProgress) => void) => () => void` | cleanup fn | Streaming results |

---

## window.varta.settings

Settings management.

| Function | Signature | Returns | Description |
|---|---|---|---|
| `getAll` | `() => Promise<IPCResponse<VartaSettings>>` | VartaSettings | Get all settings |
| `get` | `(key: string) => Promise<IPCResponse<unknown>>` | value | Get one setting |
| `set` | `(key: string, value: unknown) => Promise<IPCResponse>` | void | Set one setting |
| `setMany` | `(settings: Partial<VartaSettings>) => Promise<IPCResponse>` | void | Set multiple |
| `reset` | `() => Promise<IPCResponse>` | void | Reset to defaults |
| `export` | `(path: string) => Promise<IPCResponse>` | void | Export to file |
| `import` | `(path: string) => Promise<IPCResponse>` | void | Import from file |
| `onChanged` | `(cb: (settings: VartaSettings) => void) => () => void` | cleanup fn | Settings push |

---

## window.varta.theme

Theme management.

| Function | Signature | Returns | Description |
|---|---|---|---|
| `getThemes` | `() => Promise<IPCResponse<VartaTheme[]>>` | VartaTheme[] | List themes |
| `getActive` | `() => Promise<IPCResponse<VartaTheme>>` | VartaTheme | Get active theme |
| `setTheme` | `(id: string) => Promise<IPCResponse>` | void | Set active theme |
| `loadCustom` | `(path: string) => Promise<IPCResponse<VartaTheme>>` | VartaTheme | Load custom theme |
| `onChanged` | `(cb: (theme: VartaTheme) => void) => () => void` | cleanup fn | Theme push |

---

## window.varta.dialog

Native OS dialogs.

| Function | Signature | Returns | Description |
|---|---|---|---|
| `openFolder` | `() => Promise<IPCResponse<string \| null>>` | path or null | Folder picker |
| `openFile` | `(options?: OpenFileOptions) => Promise<IPCResponse<string \| null>>` | path or null | File picker |
| `saveFile` | `(options?: SaveFileOptions) => Promise<IPCResponse<string \| null>>` | path or null | Save dialog |
| `showMessage` | `(options: MessageOptions) => Promise<IPCResponse<number>>` | button index | Message box |
| `showError` | `(title: string, message: string) => Promise<IPCResponse>` | void | Error dialog |
| `showConfirm` | `(title: string, message: string) => Promise<IPCResponse<boolean>>` | boolean | Confirm dialog |

---

## window.varta.window

Window management.

| Function | Signature | Returns | Description |
|---|---|---|---|
| `minimize` | `() => Promise<IPCResponse>` | void | Minimize window |
| `maximize` | `() => Promise<IPCResponse>` | void | Maximize/restore |
| `close` | `() => Promise<IPCResponse>` | void | Close window |
| `isMaximized` | `() => Promise<IPCResponse<boolean>>` | boolean | Check maximized |
| `getSize` | `() => Promise<IPCResponse<[number, number]>>` | [w, h] | Window size |
| `setSize` | `(w: number, h: number) => Promise<IPCResponse>` | void | Set size |
| `getPosition` | `() => Promise<IPCResponse<[number, number]>>` | [x, y] | Window position |
| `setPosition` | `(x: number, y: number) => Promise<IPCResponse>` | void | Set position |
| `setTitle` | `(title: string) => Promise<IPCResponse>` | void | Set title bar text |
| `toggleFullscreen` | `() => Promise<IPCResponse>` | void | Toggle fullscreen |
| `onMaximizedChanged` | `(cb: (isMaximized: boolean) => void) => () => void` | cleanup fn | Maximize push |
| `onFocusChanged` | `(cb: (isFocused: boolean) => void) => () => void` | cleanup fn | Focus push |

---

## window.varta.ai

AI operations.

| Function | Signature | Returns | Description |
|---|---|---|---|
| `setApiKey` | `(key: string) => Promise<IPCResponse>` | void | Store API key (write-only) |
| `hasApiKey` | `() => Promise<IPCResponse<boolean>>` | boolean | Check if key set |
| `sendMessage` | `(messages: ChatMessage[], context: EditorContext, model: string) => Promise<IPCResponse>` | void | Send chat message |
| `cancelStream` | `() => Promise<IPCResponse>` | void | Cancel streaming |
| `getInlineHint` | `(prefix: string, suffix: string, language: string) => Promise<IPCResponse<string>>` | string | Get completion |
| `generateCommitMsg` | `(diff: string) => Promise<IPCResponse<string>>` | string | Generate commit message |
| `getModels` | `() => Promise<IPCResponse<string[]>>` | string[] | List available models |
| `onStreamChunk` | `(cb: (chunk: string) => void) => () => void` | cleanup fn | Stream chunk push |
| `onStreamEnd` | `(cb: () => void) => () => void` | cleanup fn | Stream end push |
| `onStreamError` | `(cb: (error: {code: string, message: string}) => void) => () => void` | cleanup fn | Stream error push |

---

## window.varta.app

Application utilities.

| Function | Signature | Returns | Description |
|---|---|---|---|
| `getVersion` | `() => Promise<IPCResponse<string>>` | string | App version |
| `getPlatform` | `() => Promise<IPCResponse<string>>` | string | OS platform |
| `getPaths` | `() => Promise<IPCResponse<AppPaths>>` | AppPaths | App/user data paths |
| `openExternal` | `(url: string) => Promise<IPCResponse>` | void | Open URL in browser |
| `showItemInFolder` | `(path: string) => Promise<IPCResponse>` | void | Reveal in Finder/Explorer |
| `relaunch` | `() => Promise<IPCResponse>` | void | Relaunch app |
| `quit` | `() => Promise<IPCResponse>` | void | Quit app |
| `onReady` | `(cb: () => void) => () => void` | cleanup fn | App ready push |
| `onUpdateAvailable` | `(cb: (version: string) => void) => () => void` | cleanup fn | Update push |

---

## Related

- [IPC Channels](./ipc-channels.md) — All 106 channel names and types
- [IPC Contract](../architecture/ipc-contract.md) — Adding new channels
- [Security Model](../architecture/security-model.md) — Why the API is structured this way
- [Error Codes](./error-codes.md) — All error codes returned in IPCResponse.error
