# Keybindings

Varta provides 40+ keyboard shortcuts covering all major features. This document lists every shortcut and explains how the keybinding system works.

## Full Keybindings Reference

### File Operations

| Shortcut | Action |
|---|---|
| `Ctrl+N` | New File |
| `Ctrl+O` | Open File |
| `Ctrl+K Ctrl+O` | Open Folder |
| `Ctrl+S` | Save File |
| `Ctrl+K S` | Save All |
| `Ctrl+Shift+S` | Save As |
| `Ctrl+W` | Close Tab |
| `Ctrl+K W` | Close All Tabs |
| `Ctrl+Shift+T` | Reopen Closed Tab |

### Edit Operations

| Shortcut | Action |
|---|---|
| `Ctrl+Z` | Undo |
| `Ctrl+Y` / `Ctrl+Shift+Z` | Redo |
| `Ctrl+X` | Cut |
| `Ctrl+C` | Copy |
| `Ctrl+V` | Paste |
| `Ctrl+A` | Select All |
| `Ctrl+D` | Select Next Occurrence |
| `Ctrl+Shift+L` | Select All Occurrences |
| `Alt+Click` | Add Cursor |
| `Ctrl+Alt+↑` | Add Cursor Above |
| `Ctrl+Alt+↓` | Add Cursor Below |
| `Alt+↑` | Move Line Up |
| `Alt+↓` | Move Line Down |
| `Shift+Alt+↓` | Duplicate Line Down |
| `Ctrl+Shift+K` | Delete Line |
| `Ctrl+/` | Toggle Line Comment |
| `Shift+Alt+A` | Toggle Block Comment |
| `Shift+Alt+F` | Format Document |
| `Ctrl+Space` | Trigger IntelliSense |

### View

| Shortcut | Action |
|---|---|
| `Ctrl+B` | Toggle Sidebar |
| `Ctrl+Shift+E` | Focus File Explorer |
| `Ctrl+Shift+F` | Focus Search |
| `Ctrl+Shift+G` | Focus Source Control |
| `Ctrl+Shift+A` | Focus AI Chat |
| `Ctrl+=` | Zoom In |
| `Ctrl+-` | Zoom Out |
| `Ctrl+0` | Reset Zoom |
| `F11` | Toggle Fullscreen |
| `Ctrl+\` | Split Editor |

### Navigation

| Shortcut | Action |
|---|---|
| `Ctrl+P` | Go to File |
| `Ctrl+Shift+P` | Command Palette |
| `Ctrl+G` | Go to Line |
| `Ctrl+Shift+O` | Go to Symbol in File |
| `Ctrl+T` | Go to Symbol in Workspace |
| `F12` | Go to Definition |
| `Alt+F12` | Peek Definition |
| `Shift+F12` | Find All References |
| `Alt+←` | Go Back |
| `Alt+→` | Go Forward |
| `Ctrl+Tab` | Next Tab |
| `Ctrl+Shift+Tab` | Previous Tab |
| `Ctrl+1` through `Ctrl+9` | Go to Tab by Position |

### Terminal

| Shortcut | Action |
|---|---|
| `` Ctrl+` `` | Toggle Terminal |
| `` Ctrl+Shift+` `` | New Terminal |
| `Ctrl+Shift+C` | Copy (terminal, Windows/Linux) |
| `Ctrl+Shift+V` | Paste (terminal, Windows/Linux) |
| `Cmd+C` | Copy (terminal, macOS) |
| `Cmd+V` | Paste (terminal, macOS) |

### Git

| Shortcut | Action |
|---|---|
| `Ctrl+Shift+G` | Open Git Panel |
| `Ctrl+Enter` | Commit (in commit message field) |

### AI

| Shortcut | Action |
|---|---|
| `Ctrl+Shift+A` | Open AI Chat |
| `Tab` | Accept inline hint |
| `Escape` | Dismiss inline hint |
| `Ctrl+Alt+Space` | Trigger inline hint manually |

### Settings

| Shortcut | Action |
|---|---|
| `Ctrl+,` | Open Settings |
| `Ctrl+K Ctrl+T` | Open Theme Picker |
| `Ctrl+K Ctrl+S` | Open Keybindings |

## How Keybindings Work

Varta uses a layered keybinding system:

### Layer 1: Global Keyboard Handler

A `keydown` event listener on `document` handles global shortcuts. When a key combination is pressed, it looks up the command in the `commandRegistry` and executes it:

```typescript
// src/renderer/hooks/useKeyboardShortcuts.ts
document.addEventListener('keydown', (e) => {
  const combo = getKeyCombo(e)  // e.g., "ctrl+shift+p"
  const command = commandRegistry.findByShortcut(combo)
  
  if (command) {
    e.preventDefault()
    commandRegistry.execute(command.id)
  }
})
```

### Layer 2: Monaco Internal Keybindings

Monaco handles its own keybindings internally (find, replace, format, go to definition, etc.). These are registered directly in the Monaco editor instance and take priority when the editor is focused.

### Layer 3: Global Key Overrides

Some shortcuts must work even when Monaco is focused (e.g., `Ctrl+S` to save, `Ctrl+W` to close tab). These are in the `globalKeys` list and are intercepted before Monaco can handle them:

```typescript
const globalKeys = [
  'ctrl+s',       // save — must work in editor
  'ctrl+w',       // close tab — must work in editor
  'ctrl+shift+p', // command palette — must work in editor
  'ctrl+`',       // terminal toggle — must work in editor
]
```

When a key in `globalKeys` is pressed while Monaco is focused, the global handler intercepts it and prevents Monaco from receiving it.

## Customizing Keybindings

### Via Settings UI

1. Open Settings: `Ctrl+,`
2. Navigate to **Keybindings** (or press `Ctrl+K Ctrl+S`)
3. Search for the command you want to rebind
4. Click the pencil icon next to the current binding
5. Press the new key combination
6. Press `Enter` to confirm

### Via settings.json

Add a `keybindings` array to your settings file:

```json
{
  "keybindings": [
    {
      "command": "editor.action.formatDocument",
      "key": "ctrl+shift+i",
      "when": "editorFocus"
    },
    {
      "command": "workbench.action.toggleTerminal",
      "key": "ctrl+j"
    },
    {
      "command": "git.commit",
      "key": "ctrl+alt+c"
    }
  ]
}
```

### Keybinding Recording

The Settings UI includes a keybinding recorder. When you click the pencil icon next to a binding:

1. A recording overlay appears: "Press the key combination..."
2. Press your desired key combination
3. If the combination is already used, a warning shows which command it conflicts with
4. Press `Enter` to save or `Escape` to cancel

### When Clauses

Keybindings can be conditional using `when` clauses:

| When Clause | Description |
|---|---|
| `editorFocus` | Editor has keyboard focus |
| `terminalFocus` | Terminal has keyboard focus |
| `sidebarFocus` | Sidebar panel has focus |
| `inputFocus` | Any input field has focus |
| `!inputFocus` | No input field has focus |

## macOS Differences

On macOS, `Ctrl` in the table above maps to `Cmd` for most shortcuts:

| Windows/Linux | macOS |
|---|---|
| `Ctrl+S` | `Cmd+S` |
| `Ctrl+P` | `Cmd+P` |
| `Ctrl+Shift+P` | `Cmd+Shift+P` |
| `Ctrl+,` | `Cmd+,` |
| `Ctrl+W` | `Cmd+W` |

Terminal copy/paste uses `Cmd+C` / `Cmd+V` on macOS (not `Ctrl+Shift+C/V`).

## Related

- [Settings](./settings.md) — Settings file location and format
- [Configuration](../getting-started/configuration.md) — Full settings reference
- [Command Palette](../getting-started/first-steps.md#the-command-palette) — Discovering commands
