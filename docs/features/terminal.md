# Terminal

Varta includes a fully-featured integrated terminal powered by `node-pty` (pseudo-terminal) and `xterm.js` (terminal renderer). The terminal runs real shell sessions — not a simulated shell.

## Architecture

```
Renderer (xterm.js)          Main Process (node-pty)
        │                              │
  User keypress                        │
        │                              │
  xterm captures input                 │
        │                              │
  window.varta.terminal.write(data)    │
        │                              │
        ├──── IPC invoke ─────────────►│
        │   TerminalChannel.WRITE      │
        │                              │ PTY.write(data)
        │                              │ (shell receives input)
        │                              │
        │                              │ PTY output event
        │                              │
        │◄──── IPC push ───────────────┤
        │   TerminalChannel.DATA       │
        │                              │
  xterm.write(data)                    │
  (renders output)                     │
```

The PTY runs in the main process because it requires Node.js native modules (`node-pty`). The renderer only handles display (xterm.js) and input forwarding.

## Shell Auto-Detection

When no shell is configured in settings, Varta auto-detects the best available shell:

**Windows (in order of preference):**
1. `pwsh` — PowerShell 7 (cross-platform)
2. `powershell` — PowerShell 5 (built-in)
3. `cmd.exe` — Command Prompt (fallback)

**macOS / Linux (in order of preference):**
1. `$SHELL` environment variable (user's configured shell)
2. `/bin/zsh`
3. `/bin/bash`

To override the auto-detected shell, set `terminal.shell` in Settings:

```json
{
  "terminal.shell": "/opt/homebrew/bin/fish",
  "terminal.shellArgs": ["--login"]
}
```

## Multiple Terminal Tabs

Varta supports multiple simultaneous terminal sessions. Each session is an independent PTY process.

- **New terminal:** Click the `+` button in the terminal toolbar, or press `Ctrl+Shift+\``
- **Switch terminals:** Click the tab in the terminal tab bar
- **Kill terminal:** Click the trash icon, or type `exit` in the shell
- **Rename terminal:** Double-click the tab label

Each terminal session has a unique ID (UUID). The `TerminalService` maintains a `Map<string, IPty>` of active sessions.

## Data Flow in Detail

### Keypress → PTY

```typescript
// xterm.js onData callback (renderer)
xterm.onData((data) => {
  window.varta.terminal.write(sessionId, data)
})

// Preload (bridge)
write: (id: string, data: string) =>
  ipcRenderer.invoke(TerminalChannel.WRITE, id, data)

// Main process handler
ipcMain.handle(TerminalChannel.WRITE, (_event, id, data) => {
  terminalService.writeToTerminal(id, data)
})

// TerminalService
writeToTerminal(id: string, data: string) {
  this.terminals.get(id)?.write(data)
}
```

### PTY Output → xterm.js

```typescript
// TerminalService — PTY data event
pty.onData((data) => {
  mainWindow.webContents.send(TerminalChannel.DATA, { id, data })
})

// Preload — push listener
onData: (callback) => {
  const handler = (_event, payload) => callback(payload)
  ipcRenderer.on(TerminalChannel.DATA, handler)
  return () => ipcRenderer.removeListener(TerminalChannel.DATA, handler)
}

// Renderer — useTerminal hook
useEffect(() => {
  const off = window.varta.terminal.onData(({ id, data }) => {
    if (id === activeSessionId) {
      xtermInstance.write(data)
    }
  })
  return off
}, [activeSessionId])
```

## Resize Flow

When the terminal panel is resized, the PTY dimensions must be updated to match:

```
ResizeObserver detects panel size change
        │
  fitAddon.fit()  ← calculates cols/rows from pixel dimensions
        │
  xterm emits onResize({ cols, rows })
        │
  window.varta.terminal.resize(id, cols, rows)
        │
  IPC → TerminalService.resizeTerminal(id, cols, rows)
        │
  pty.resize(cols, rows)
```

The `xterm-addon-fit` addon handles the pixel-to-character conversion. The PTY is resized to match, which updates the `$COLUMNS` and `$LINES` environment variables in the shell.

## Why Terminals Stay Mounted

Terminal instances are **never unmounted** when you switch to a different terminal tab or hide the terminal panel. Instead, they are hidden with CSS:

```css
.terminal-instance {
  display: none;  /* hidden */
}
.terminal-instance.active {
  display: block; /* visible */
}
```

This is intentional. Unmounting an xterm.js instance destroys its scroll buffer, cursor state, and selection. By keeping all terminals mounted and toggling visibility, switching between terminals is instant and preserves all state.

The same applies when the terminal panel is collapsed — the xterm instances remain mounted, just hidden.

## Context Menu

Right-clicking in the terminal shows a context menu:

| Action | Description |
|---|---|
| Copy | Copy selected text |
| Paste | Paste from clipboard |
| Select All | Select all terminal content |
| Clear | Clear the terminal buffer |
| Find | Open xterm find widget |

On macOS, `Cmd+C` / `Cmd+V` work for copy/paste. On Windows/Linux, use `Ctrl+Shift+C` / `Ctrl+Shift+V` (to avoid conflicting with shell shortcuts like `Ctrl+C` for SIGINT).

## Terminal Settings

| Setting | Type | Default | Description |
|---|---|---|---|
| `terminal.fontSize` | number | 13 | Font size in pixels |
| `terminal.fontFamily` | string | `"JetBrains Mono, monospace"` | Font family |
| `terminal.shell` | string | `""` | Shell path (empty = auto-detect) |
| `terminal.shellArgs` | string[] | `[]` | Shell startup arguments |
| `terminal.scrollback` | number | 1000 | Lines of scrollback buffer |
| `terminal.cursorStyle` | string | `"block"` | Cursor shape: block, underline, bar |
| `terminal.cursorBlink` | boolean | true | Blink the cursor |
| `terminal.copyOnSelect` | boolean | false | Auto-copy on text selection |

## xterm.js Theme

The terminal colors follow the active Varta theme. The xterm theme is updated when the app theme changes:

```typescript
xterm.options.theme = {
  background: theme.cssVars['--terminal-bg'],
  foreground: theme.cssVars['--terminal-fg'],
  cursor: theme.cssVars['--terminal-cursor'],
  black: '#000000',
  red: '#F07178',
  green: '#C3E88D',
  yellow: '#FFCB6B',
  blue: '#82AAFF',
  magenta: '#C792EA',
  cyan: '#89DDFF',
  white: '#EEFFFF',
  // ... bright variants
}
```

## Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `` Ctrl+` `` | Toggle terminal panel |
| `Ctrl+Shift+\`` | New terminal tab |
| `Ctrl+Shift+C` | Copy selection (Windows/Linux) |
| `Ctrl+Shift+V` | Paste (Windows/Linux) |
| `Cmd+C` | Copy selection (macOS) |
| `Cmd+V` | Paste (macOS) |
| `Ctrl+C` | Send SIGINT to shell process |
| `Ctrl+D` | Send EOF (exit shell) |
| `Ctrl+L` | Clear terminal (shell built-in) |
| `Ctrl+F` | Find in terminal |

## Related

- [Architecture Overview](../architecture/overview.md) — TerminalService and PTY management
- [IPC Contract](../architecture/ipc-contract.md) — TerminalChannel channels
- [Configuration](../getting-started/configuration.md) — Terminal settings reference
- [Installation](../getting-started/installation.md) — node-pty build requirements
