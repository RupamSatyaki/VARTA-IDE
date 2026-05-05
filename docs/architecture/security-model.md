# Security Model

Varta follows Electron's security best practices. This document explains the security decisions made in the architecture and why they matter.

## Core Security Settings

Every `BrowserWindow` in Varta is created with these settings:

```typescript
new BrowserWindow({
  webPreferences: {
    contextIsolation: true,   // renderer JS cannot access Node.js APIs
    nodeIntegration: false,   // renderer cannot require() Node modules
    sandbox: false,           // preload script needs Node access
    preload: path.join(__dirname, '../preload/index.js'),
  },
})
```

### contextIsolation: true

Context isolation means the renderer's JavaScript world is completely separate from the preload script's world. Even though both run in the same Chromium process, they cannot access each other's variables or prototypes.

Without context isolation, a malicious script in the renderer (e.g., from a compromised npm package in the user's project) could access `require`, `process`, or `ipcRenderer` directly and make arbitrary system calls.

With context isolation, the renderer can only access what is explicitly exposed via `contextBridge.exposeInMainWorld()`.

### nodeIntegration: false

With `nodeIntegration: false`, the renderer process cannot use Node.js APIs (`require`, `fs`, `child_process`, etc.) at all. All Node.js operations must go through the preload bridge.

### The contextBridge Pattern

The preload script (`src/preload/index.ts`) is the only place where Node.js APIs and browser APIs coexist. It uses `contextBridge` to expose a safe, typed API surface:

```typescript
// src/preload/index.ts
import { contextBridge, ipcRenderer } from 'electron'
import { fileApi } from './api/fileApi'
import { gitApi } from './api/gitApi'

contextBridge.exposeInMainWorld('varta', {
  fs: fileApi,
  git: gitApi,
  terminal: terminalApi,
  ai: aiApi,
  settings: settingsApi,
  theme: themeApi,
  dialog: dialogApi,
  window: windowApi,
  app: appApi,
})
```

The renderer accesses this as `window.varta.fs.readFile(...)`. The raw `ipcRenderer` object is **never** exposed.

### Why Not Expose ipcRenderer Directly?

Exposing `ipcRenderer` directly would allow the renderer to call any IPC channel, including internal ones, with arbitrary arguments. This is a common Electron security mistake.

```typescript
// WRONG — never do this
contextBridge.exposeInMainWorld('electron', {
  ipcRenderer: ipcRenderer  // ← exposes all channels, no validation
})

// RIGHT — expose only specific, typed functions
contextBridge.exposeInMainWorld('varta', {
  fs: {
    readFile: (path: string) => ipcRenderer.invoke(FileChannel.READ_FILE, path)
  }
})
```

By wrapping each channel in a typed function, the preload acts as a validation layer. Arguments are typed, and only the channels that the preload explicitly wraps are accessible.

## AI API Key Security

The AI API key is the most sensitive piece of data Varta handles. The security model for it is:

```
Renderer                Preload              Main Process
   │                       │                      │
   │  setApiKey(key)        │                      │
   ├──────────────────────►│                      │
   │                       │  invoke(SET_API_KEY) │
   │                       ├─────────────────────►│
   │                       │                      │ stores in electron-store
   │                       │                      │ (encrypted, main only)
   │                       │◄─────────────────────┤
   │◄──────────────────────┤  { success: true }   │
   │                       │                      │
   │  hasApiKey()           │                      │
   ├──────────────────────►│                      │
   │                       │  invoke(HAS_API_KEY) │
   │                       ├─────────────────────►│
   │                       │                      │ checks if key exists
   │                       │◄─────────────────────┤
   │◄──────────────────────┤  { data: true }      │ returns BOOLEAN only
   │                       │                      │
   │  getApiKey() ← DOES NOT EXIST                │
   │                       │                      │
```

Key rules:
1. `setApiKey` is a write-only operation — the key goes in, it never comes back out
2. `hasApiKey` returns a boolean — the renderer knows whether a key is set, not what it is
3. There is no `getApiKey` function in the preload or renderer
4. The key is stored in `electron-store` which encrypts values using the OS keychain on macOS and Windows
5. AI API calls are made in the main process — the key never travels over IPC

```typescript
// src/preload/api/aiApi.ts
export const aiApi = {
  setApiKey: (key: string): Promise<IPCResponse> =>
    ipcRenderer.invoke(AIChannel.SET_API_KEY, key),

  hasApiKey: (): Promise<IPCResponse<boolean>> =>
    ipcRenderer.invoke(AIChannel.HAS_API_KEY),

  // getApiKey does NOT exist — intentionally omitted
}
```

## IPC Input Validation

All IPC handlers validate their inputs before passing them to services:

```typescript
ipcMain.handle(FileChannel.READ_FILE, async (_event, path: unknown) => {
  // Validate input type
  if (typeof path !== 'string') {
    return { success: false, error: { code: 'INVALID_ARGUMENT', message: 'path must be a string' } }
  }

  // Validate path is not empty
  if (!path.trim()) {
    return { success: false, error: { code: 'INVALID_ARGUMENT', message: 'path cannot be empty' } }
  }

  // Proceed with validated input
  try {
    const content = await fileService.readFile(path)
    return { success: true, data: content }
  } catch (err) {
    return { success: false, error: VartaError.from(err).toPayload() }
  }
})
```

Path traversal is not a primary concern since Varta only operates on user-selected directories, but inputs are still validated for type safety.

## VartaError Never Leaks Stack Traces

When errors are serialized for IPC transport, stack traces are stripped:

```typescript
class VartaError extends Error {
  constructor(
    public readonly code: string,
    message: string,
  ) {
    super(message)
  }

  toPayload(): { code: string; message: string } {
    // Stack trace intentionally excluded
    return {
      code: this.code,
      message: this.message,
    }
  }

  static from(err: unknown): VartaError {
    if (err instanceof VartaError) return err
    if (err instanceof Error) {
      return new VartaError('UNKNOWN_ERROR', err.message)
      // err.stack is NOT forwarded
    }
    return new VartaError('UNKNOWN_ERROR', String(err))
  }
}
```

Stack traces can reveal internal file paths, library versions, and code structure. By stripping them at the IPC boundary, this information stays in the main process logs and never reaches the renderer.

## Content Security Policy

Varta sets a strict CSP for the renderer:

```typescript
// src/main/window/createMainWindow.ts
session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
  callback({
    responseHeaders: {
      ...details.responseHeaders,
      'Content-Security-Policy': [
        "default-src 'self'; " +
        "script-src 'self'; " +
        "style-src 'self' 'unsafe-inline'; " +  // needed for Monaco
        "img-src 'self' data:; " +
        "connect-src 'none'",  // renderer cannot make network requests
      ],
    },
  })
})
```

The `connect-src 'none'` directive ensures the renderer cannot make outbound network requests. All API calls (Anthropic, etc.) go through the main process.

## Navigation and New Windows

Varta prevents the renderer from navigating to external URLs or opening new windows:

```typescript
win.webContents.on('will-navigate', (event, url) => {
  if (!url.startsWith('file://') && !url.startsWith('http://localhost')) {
    event.preventDefault()
    logger.warn('Blocked navigation to external URL', { url })
  }
})

win.webContents.setWindowOpenHandler(({ url }) => {
  // Open external links in the system browser, not in Electron
  shell.openExternal(url)
  return { action: 'deny' }
})
```

## Related

- [Architecture Overview](./overview.md) — Two-process model
- [IPC Contract](./ipc-contract.md) — All 106 channels
- [AI Integration](../features/ai-integration.md) — API key setup
- [Error Codes](../api/error-codes.md) — VartaError reference
