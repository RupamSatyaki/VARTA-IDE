# Error Codes

Varta uses a typed error system based on the `VartaError` class. All errors that cross the IPC boundary are `VartaError` instances serialized to `{ code, message }` payloads.

## VartaError Class

```typescript
// src/shared/errors.ts
export class VartaError extends Error {
  constructor(
    public readonly code: string,
    message: string,
  ) {
    super(message)
    this.name = 'VartaError'
  }

  /** Serialize for IPC transport — strips stack trace */
  toPayload(): { code: string; message: string } {
    return { code: this.code, message: this.message }
  }

  /** Convert any error to VartaError */
  static from(err: unknown): VartaError {
    if (err instanceof VartaError) return err
    if (err instanceof Error) {
      // Map common Node.js error codes
      const nodeErr = err as NodeJS.ErrnoException
      if (nodeErr.code === 'ENOENT') return new VartaError('FILE_NOT_FOUND', err.message)
      if (nodeErr.code === 'EACCES') return new VartaError('PERMISSION_DENIED', err.message)
      if (nodeErr.code === 'EEXIST') return new VartaError('FILE_ALREADY_EXISTS', err.message)
      if (nodeErr.code === 'ENOTDIR') return new VartaError('NOT_A_DIRECTORY', err.message)
      if (nodeErr.code === 'EISDIR') return new VartaError('IS_A_DIRECTORY', err.message)
      if (nodeErr.code === 'ENOTEMPTY') return new VartaError('DIRECTORY_NOT_EMPTY', err.message)
      return new VartaError('UNKNOWN_ERROR', err.message)
    }
    return new VartaError('UNKNOWN_ERROR', String(err))
  }
}

/** Type guard */
export function isVartaError(err: unknown): err is VartaError {
  return err instanceof VartaError
}
```

## Usage in Services

```typescript
// Throwing in a service
async readFile(path: string): Promise<string> {
  try {
    return await fs.readFile(path, 'utf-8')
  } catch (err) {
    throw VartaError.from(err)  // converts Node error to VartaError
  }
}

// Throwing with a specific code
async commit(repoPath: string, message: string): Promise<void> {
  if (!message.trim()) {
    throw new VartaError('GIT_EMPTY_COMMIT_MESSAGE', 'Commit message cannot be empty')
  }
  // ...
}
```

## Usage in IPC Handlers

```typescript
ipcMain.handle(FileChannel.READ_FILE, async (_event, path: string) => {
  try {
    const content = await fileService.readFile(path)
    return { success: true, data: content }
  } catch (err) {
    logger.error('READ_FILE failed', { path, err })
    // VartaError.from() ensures we always return a clean payload
    return { success: false, error: VartaError.from(err).toPayload() }
  }
})
```

## Usage in Renderer

```typescript
const result = await window.varta.fs.readFile(path)
if (!result.success) {
  const { code, message } = result.error!
  switch (code) {
    case 'FILE_NOT_FOUND':
      showNotification({ type: 'warning', message: `File not found: ${path}` })
      break
    case 'PERMISSION_DENIED':
      showNotification({ type: 'error', message: 'Permission denied' })
      break
    default:
      showNotification({ type: 'error', message })
  }
}
```

## All 68 Error Codes

### File System Errors (FILE_*)

| Code | Description | When Thrown |
|---|---|---|
| `FILE_NOT_FOUND` | File or directory does not exist | `readFile`, `getStats`, `deleteFile` on missing path |
| `FILE_ALREADY_EXISTS` | File already exists at target path | `createFile` when file exists, `rename` to existing path |
| `PERMISSION_DENIED` | Insufficient permissions | Any file operation on protected path |
| `IS_A_DIRECTORY` | Expected file, got directory | `readFile` on a directory |
| `NOT_A_DIRECTORY` | Expected directory, got file | `readDirectory` on a file |
| `DIRECTORY_NOT_EMPTY` | Cannot delete non-empty directory | `deleteDirectory` without recursive flag |
| `FILE_TOO_LARGE` | File exceeds size limit | `readFile` on files > 50MB |
| `INVALID_FILE_PATH` | Path is empty, null, or contains invalid characters | Any file operation with bad path |
| `FILE_READ_ERROR` | Generic read failure | `readFile` on unreadable file |
| `FILE_WRITE_ERROR` | Generic write failure | `writeFile` on unwritable path |
| `FILE_DELETE_ERROR` | Generic delete failure | `deleteFile` when delete fails |
| `FILE_RENAME_ERROR` | Generic rename failure | `rename` when rename fails |
| `FILE_COPY_ERROR` | Generic copy failure | `copyFile` when copy fails |
| `WATCH_ERROR` | File watcher failed to start | `watchStart` on invalid path |
| `WATCH_NOT_ACTIVE` | No active watcher to stop | `watchStop` when not watching |

### Git Errors (GIT_*)

| Code | Description | When Thrown |
|---|---|---|
| `GIT_NOT_A_REPO` | Path is not inside a git repository | Any git operation on non-repo path |
| `GIT_REPO_INIT_FAILED` | Failed to initialize repository | `git init` failure |
| `GIT_STATUS_FAILED` | Failed to get git status | `getStatus` failure |
| `GIT_STAGE_FAILED` | Failed to stage file | `stageFile` failure |
| `GIT_UNSTAGE_FAILED` | Failed to unstage file | `unstageFile` failure |
| `GIT_DISCARD_FAILED` | Failed to discard changes | `discardChanges` failure |
| `GIT_COMMIT_FAILED` | Failed to create commit | `commit` failure |
| `GIT_EMPTY_COMMIT_MESSAGE` | Commit message is empty | `commit` with empty message |
| `GIT_NOTHING_TO_COMMIT` | No staged changes to commit | `commit` with empty index |
| `GIT_PUSH_FAILED` | Failed to push | `push` failure |
| `GIT_NO_UPSTREAM` | Branch has no upstream tracking branch | `push` without upstream |
| `GIT_PUSH_REJECTED` | Remote rejected the push | `push` when remote has newer commits |
| `GIT_PULL_FAILED` | Failed to pull | `pull` failure |
| `GIT_MERGE_CONFLICT` | Pull resulted in merge conflict | `pull` with conflicting changes |
| `GIT_FETCH_FAILED` | Failed to fetch | `fetch` failure |
| `GIT_CHECKOUT_FAILED` | Failed to checkout branch | `checkoutBranch` failure |
| `GIT_BRANCH_EXISTS` | Branch already exists | `createBranch` with existing name |
| `GIT_BRANCH_NOT_FOUND` | Branch does not exist | `checkoutBranch`, `deleteBranch` |
| `GIT_DELETE_CURRENT_BRANCH` | Cannot delete checked-out branch | `deleteBranch` on current branch |
| `GIT_DIFF_FAILED` | Failed to get diff | `getDiff` failure |
| `GIT_LOG_FAILED` | Failed to get commit log | `getLog` failure |

### Terminal Errors (TERMINAL_*)

| Code | Description | When Thrown |
|---|---|---|
| `TERMINAL_CREATE_FAILED` | Failed to spawn PTY | `create` when node-pty fails |
| `TERMINAL_NOT_FOUND` | Terminal session ID not found | `write`, `resize`, `kill` with invalid ID |
| `TERMINAL_WRITE_FAILED` | Failed to write to PTY | `write` when PTY is dead |
| `TERMINAL_RESIZE_FAILED` | Failed to resize PTY | `resize` failure |
| `TERMINAL_SHELL_NOT_FOUND` | Configured shell does not exist | `create` with invalid shell path |
| `TERMINAL_ALREADY_DEAD` | Terminal process has already exited | `write` after exit |

### AI Errors (AI_*)

| Code | Description | When Thrown |
|---|---|---|
| `AI_NO_API_KEY` | No API key configured | Any AI operation without key |
| `AI_INVALID_API_KEY` | API key is invalid or expired | API call with bad key |
| `AI_RATE_LIMITED` | Anthropic API rate limit exceeded | Too many requests |
| `AI_QUOTA_EXCEEDED` | Anthropic account quota exceeded | Monthly limit reached |
| `AI_REQUEST_FAILED` | Generic API request failure | Network error, 5xx response |
| `AI_STREAM_FAILED` | Streaming response failed mid-stream | Connection dropped during stream |
| `AI_CONTEXT_TOO_LARGE` | Context exceeds model's token limit | Very large files in context |
| `AI_MODEL_NOT_FOUND` | Specified model does not exist | Invalid model ID in settings |

### Search Errors (SEARCH_*)

| Code | Description | When Thrown |
|---|---|---|
| `SEARCH_INVALID_REGEX` | Search query is not valid regex | `start` with invalid regex pattern |
| `SEARCH_ROOT_NOT_FOUND` | Search root directory does not exist | `start` with invalid root path |
| `SEARCH_CANCELLED` | Search was cancelled | `start` result when cancelled |
| `SEARCH_REPLACE_FAILED` | Replace All failed for one or more files | `replaceAll` partial failure |

### Settings Errors (SETTINGS_*)

| Code | Description | When Thrown |
|---|---|---|
| `SETTINGS_INVALID_KEY` | Unknown settings key | `set` with unrecognized key |
| `SETTINGS_INVALID_VALUE` | Value fails type validation | `set` with wrong type |
| `SETTINGS_EXPORT_FAILED` | Failed to write settings file | `export` with unwritable path |
| `SETTINGS_IMPORT_FAILED` | Failed to read or parse settings file | `import` with invalid file |
| `SETTINGS_IMPORT_INVALID` | Imported JSON is not valid settings | `import` with wrong schema |

### Extension Errors (EXTENSION_*)

| Code | Description | When Thrown |
|---|---|---|
| `EXTENSION_NOT_FOUND` | Extension ID not found | `enable`, `disable`, `uninstall` |
| `EXTENSION_INSTALL_FAILED` | Failed to install extension | `install` failure |
| `EXTENSION_INVALID_MANIFEST` | Extension manifest is invalid | `install` with bad package.json |
| `EXTENSION_LOAD_FAILED` | Failed to load extension | `reload` when extension errors |

### General Errors

| Code | Description | When Thrown |
|---|---|---|
| `INVALID_ARGUMENT` | Function argument is invalid type or value | Any handler with bad input |
| `UNKNOWN_ERROR` | Unclassified error | Catch-all for unexpected errors |
| `NOT_IMPLEMENTED` | Feature not yet implemented | Stub handlers |
| `INTERNAL_ERROR` | Internal service error | Unexpected service state |

## Adding a New Error Code

1. Add the code string to `src/shared/errors.ts` as a constant or document it:

```typescript
// src/shared/errors.ts
export const ErrorCodes = {
  // ... existing codes
  MY_NEW_ERROR: 'MY_NEW_ERROR',
} as const
```

2. Throw it in the appropriate service:

```typescript
throw new VartaError('MY_NEW_ERROR', 'Descriptive message about what went wrong')
```

3. Handle it in the renderer where appropriate:

```typescript
if (result.error?.code === 'MY_NEW_ERROR') {
  // specific handling
}
```

4. Document it in this file.

## Related

- [window.varta API](./window-varta-api.md) — Error handling pattern
- [Main Process](../architecture/main-process.md) — VartaError usage in services
- [Security Model](../architecture/security-model.md) — Why stack traces are stripped
