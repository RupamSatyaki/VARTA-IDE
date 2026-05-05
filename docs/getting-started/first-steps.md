# First Steps

Welcome to Varta IDE. This guide walks you through the core workflows you'll use every day — opening projects, editing files, using the terminal, and setting up AI assistance.

## Opening a Folder

Varta works with folders (projects), not individual files. To get started:

**Via keyboard:** Press `Ctrl+K` then `Ctrl+O` (hold Ctrl, press K, release, press O)

**Via menu:** File → Open Folder

**Via welcome screen:** Click "Open Folder" on the welcome tab that appears on first launch

Once you select a folder, the file tree on the left populates with your project's contents. Varta remembers the last opened folder and reopens it automatically on next launch.

## Understanding Preview vs Permanent Tabs

Varta uses a two-mode tab system borrowed from VS Code:

| Mode | How to open | Visual indicator | Behavior |
|---|---|---|---|
| Preview | Single-click a file | Italic filename | Replaced by next single-clicked file |
| Permanent | Double-click a file | Normal filename | Stays open until explicitly closed |

**Preview tabs** let you browse files without cluttering your tab bar. When you single-click `utils.ts` to peek at it, then single-click `helpers.ts`, the preview tab switches to `helpers.ts` — you don't accumulate tabs.

**To make a preview tab permanent** without editing it: double-click the tab itself, or double-click the file in the tree, or start typing in the editor.

**Dirty indicator:** When a file has unsaved changes, a dot (●) appears before the filename in the tab. The dot disappears on save.

## Editing and Saving Files

Click any file in the tree to open it. The Monaco editor provides:

- Syntax highlighting for 34+ languages (auto-detected from file extension)
- IntelliSense / autocomplete
- Multi-cursor editing (`Alt+Click` to add cursors)
- Code folding (click the gutter arrows)

**Save:** `Ctrl+S` (Windows/Linux) or `Cmd+S` (macOS)

**Save All:** `Ctrl+K S`

When you close a tab with unsaved changes, Varta shows a confirmation dialog asking whether to save, discard, or cancel.

## Opening the Integrated Terminal

Press `` Ctrl+` `` to toggle the terminal panel open and closed.

The terminal opens in your project's root directory. Varta auto-detects the best available shell:

- **Windows:** PowerShell 7 → PowerShell 5 → Command Prompt
- **macOS / Linux:** `$SHELL` environment variable → zsh → bash

You can open multiple terminal tabs by clicking the **+** button in the terminal toolbar. Each tab runs an independent shell session.

See [Terminal](../features/terminal.md) for full details on terminal configuration.

## Setting Up Your AI API Key

Varta's AI features require an Anthropic API key.

1. Get a key at [console.anthropic.com](https://console.anthropic.com) → API Keys → Create Key
2. In Varta, open Settings: `Ctrl+,`
3. Scroll to the **AI** section
4. Paste your key (starts with `sk-ant-...`) into the **API Key** field
5. Press Enter or click Save

Your key is stored securely in the OS keychain via `electron-store` in the main process. It is never exposed back to the renderer — the renderer only receives a boolean indicating whether a key is set. See [Security Model](../architecture/security-model.md) for details.

## Your First AI Conversation

Once your API key is set:

1. Press `Ctrl+Shift+A` to open the AI Chat panel (or click the robot icon in the sidebar)
2. Open a file in the editor — the AI automatically receives context about your active file
3. Type a question or request, for example: `Explain what this function does` or `Add error handling to this code`
4. Press Enter to send

The AI receives your active file's content, selected text (if any), cursor position, language, and open tabs as context. Responses stream in real time.

**Response action buttons:**

- `<varta:replace>` blocks show an **Apply** button — clicking it replaces the selected text in the editor
- `<varta:terminal>` blocks show a **Run** button — clicking it executes the command in the terminal
- `<varta:newfile>` blocks show a **Create File** button — clicking it writes the file to disk

See [AI Integration](../features/ai-integration.md) for the full feature reference.

## The Command Palette

Press `Ctrl+Shift+P` to open the Command Palette — your fastest way to access any Varta feature.

The palette shows all registered commands with their keyboard shortcuts. Start typing to filter:

```
> git commit          # Git: Commit staged changes
> new file            # File: New File
> toggle terminal     # View: Toggle Terminal
> open settings       # Settings: Open Settings
> format document     # Editor: Format Document
```

The `>` prefix filters to commands. Remove it to search open files by name (like `Ctrl+P`).

## Navigating Your Project

| Action | Shortcut |
|---|---|
| Go to file (fuzzy search) | `Ctrl+P` |
| Go to symbol in file | `Ctrl+Shift+O` |
| Go to line | `Ctrl+G` |
| Go to definition | `F12` |
| Peek definition | `Alt+F12` |
| Find in files | `Ctrl+Shift+F` |
| Toggle sidebar | `Ctrl+B` |
| Focus file tree | `Ctrl+Shift+E` |
| Focus editor | `Escape` (from tree/panel) |

## The Sidebar Panels

The left sidebar contains five panels, switchable by clicking the icons or using shortcuts:

| Panel | Icon | Shortcut | Purpose |
|---|---|---|---|
| File Explorer | Files | `Ctrl+Shift+E` | Browse and manage project files |
| Search | Magnifier | `Ctrl+Shift+F` | Find and replace across files |
| Source Control | Branch | `Ctrl+Shift+G` | Git status, stage, commit, push |
| AI Chat | Robot | `Ctrl+Shift+A` | Conversational AI assistant |
| Extensions | Puzzle | — | Manage extensions (v2) |

## Customizing the Layout

- **Resize panels:** Drag the divider between the sidebar and editor
- **Hide sidebar:** `Ctrl+B`
- **Move terminal:** The terminal panel is at the bottom; drag its top edge to resize
- **Zoom:** `Ctrl+=` to zoom in, `Ctrl+-` to zoom out, `Ctrl+0` to reset

## Next Steps

- [Configuration](./configuration.md) — Set up your preferred theme, font, and editor options
- [Keybindings](../features/keybindings.md) — Full shortcut reference
- [AI Integration](../features/ai-integration.md) — Get the most out of AI assistance
- [Git Integration](../features/git-integration.md) — Commit, push, and manage branches

## Status Bar

The status bar at the bottom of the window shows:

| Section | Information |
|---|---|
| Left | Current git branch name |
| Left | Git sync status (↑ commits to push, ↓ commits to pull) |
| Center | Active file language |
| Right | Cursor position (line:column) |
| Right | File encoding (UTF-8) |
| Right | Line ending (LF / CRLF) |
| Right | Indentation (Spaces: 2 or Tab Size: 4) |

Click any status bar item to perform a related action — click the language to change it, click the branch to open the branch picker, click indentation to change tab size.

## Saving Your Session

Varta automatically saves your session (open folder, open tabs, cursor positions) when you close the app. On next launch, it restores exactly where you left off.

To disable session restore, set `editor.restoreSession: false` in Settings.
