# Editor

The Varta editor is built on [Monaco Editor](https://microsoft.github.io/monaco-editor/) — the same editor that powers VS Code. This document covers tab management, model architecture, language support, and configuration.

## Monaco Overview

Monaco provides:
- Syntax highlighting for 34+ languages
- IntelliSense / autocomplete (language-aware)
- Multi-cursor editing
- Code folding
- Find and replace (within file)
- Bracket pair colorization
- Minimap
- Diff editor (used in Git panel)

Monaco runs entirely in the renderer process. It does not require any main process involvement for editing operations.

## Tab Management

### Preview vs Permanent Tabs

Varta uses a two-mode tab system:

| Mode | How to open | Visual indicator | Behavior |
|---|---|---|---|
| Preview | Single-click in file tree | Italic filename | Replaced by next single-clicked file |
| Permanent | Double-click in file tree | Normal filename | Stays open until explicitly closed |

Only one preview tab exists at a time. When you single-click a second file, the preview tab switches to that file. Double-clicking a file, or starting to edit in a preview tab, promotes it to permanent.

### Dirty Tab Indicator

When a file has unsaved changes, a dot (●) appears before the filename in the tab:

```
● utils.ts    ← unsaved changes
  index.ts    ← saved
```

The dot disappears when you save (`Ctrl+S`). If you try to close a dirty tab, Varta shows a confirmation dialog with Save / Don't Save / Cancel options.

### Tab Keyboard Shortcuts

| Action | Shortcut |
|---|---|
| Close active tab | `Ctrl+W` |
| Close all tabs | `Ctrl+K W` |
| Next tab | `Ctrl+Tab` |
| Previous tab | `Ctrl+Shift+Tab` |
| Reopen closed tab | `Ctrl+Shift+T` |
| Split editor | `Ctrl+\` |

## Model-Per-File-Path Architecture

Varta maintains **one Monaco model per unique file path**. This is the key architectural decision that makes tab switching fast and preserves editor state.

```typescript
// Model creation (first open)
const uri = monaco.Uri.file('/path/to/file.ts')
const model = monaco.editor.createModel(content, 'typescript', uri)

// Tab switch (subsequent opens) — model is reused, not recreated
const existingModel = monaco.editor.getModel(uri)
editorInstance.setModel(existingModel)
```

Benefits of this approach:
- **Undo/redo history** is preserved per file across tab switches
- **Cursor position** is restored when switching back to a tab
- **Unsaved changes** survive tab switches (the model holds the dirty content)
- **No re-parsing** — Monaco doesn't re-tokenize the file on every switch

### View State Persistence

In addition to the model, Varta saves and restores the Monaco "view state" (scroll position, cursor, folded regions) per file:

```typescript
// Save view state before switching away
const viewState = editorInstance.saveViewState()
viewStateCache.set(currentFilePath, viewState)

// Restore view state when switching to a file
const savedState = viewStateCache.get(newFilePath)
if (savedState) {
  editorInstance.restoreViewState(savedState)
}
```

### Model Disposal

Models are disposed when:
1. A tab is closed AND no other tab references the same file path
2. The project folder is changed (all models are disposed)

Models are **not** disposed on tab switch.

## Supported Languages

Varta supports syntax highlighting and IntelliSense for these 34 languages:

| Language | Extension(s) | IntelliSense |
|---|---|---|
| TypeScript | `.ts`, `.tsx` | ✓ (built-in) |
| JavaScript | `.js`, `.jsx`, `.mjs`, `.cjs` | ✓ (built-in) |
| JSON | `.json`, `.jsonc` | ✓ (built-in) |
| CSS | `.css` | ✓ (built-in) |
| SCSS | `.scss`, `.sass` | ✓ (built-in) |
| Less | `.less` | ✓ (built-in) |
| HTML | `.html`, `.htm` | ✓ (built-in) |
| Python | `.py`, `.pyw` | Syntax only |
| Rust | `.rs` | Syntax only |
| Go | `.go` | Syntax only |
| Java | `.java` | Syntax only |
| C | `.c`, `.h` | Syntax only |
| C++ | `.cpp`, `.cc`, `.cxx`, `.hpp` | Syntax only |
| C# | `.cs` | Syntax only |
| PHP | `.php` | Syntax only |
| Ruby | `.rb` | Syntax only |
| Swift | `.swift` | Syntax only |
| Kotlin | `.kt`, `.kts` | Syntax only |
| Dart | `.dart` | Syntax only |
| Shell | `.sh`, `.bash`, `.zsh` | Syntax only |
| PowerShell | `.ps1`, `.psm1` | Syntax only |
| SQL | `.sql` | Syntax only |
| GraphQL | `.graphql`, `.gql` | Syntax only |
| YAML | `.yml`, `.yaml` | Syntax only |
| TOML | `.toml` | Syntax only |
| Markdown | `.md`, `.mdx` | Syntax only |
| XML | `.xml`, `.svg` | Syntax only |
| Dockerfile | `Dockerfile` | Syntax only |
| Makefile | `Makefile` | Syntax only |
| INI | `.ini`, `.env` | Syntax only |
| Lua | `.lua` | Syntax only |
| R | `.r`, `.R` | Syntax only |
| Scala | `.scala` | Syntax only |
| Haskell | `.hs`, `.lhs` | Syntax only |

## Varta Dark Theme Token Colors

The default "Varta Dark" theme uses these token colors:

| Token | Color | Hex |
|---|---|---|
| Keywords (`if`, `const`, `return`) | Purple | `#C792EA` |
| Strings | Green | `#C3E88D` |
| Numbers | Orange | `#F78C6C` |
| Comments | Gray italic | `#546E7A` |
| Functions | Blue | `#82AAFF` |
| Types / Classes | Yellow | `#FFCB6B` |
| Variables | White | `#EEFFFF` |
| Parameters | Light orange | `#F07178` |
| Properties | Cyan | `#89DDFF` |
| Operators | Cyan | `#89DDFF` |
| Decorators | Yellow | `#FFCB6B` |
| Regex | Orange | `#F78C6C` |
| Template literals | Green | `#C3E88D` |

## Configurable Editor Options

All Monaco options are configurable via Settings (`Ctrl+,`):

| Setting | Type | Default | Description |
|---|---|---|---|
| `editor.fontSize` | number | 14 | Font size in pixels |
| `editor.fontFamily` | string | `"JetBrains Mono, Fira Code, monospace"` | Font family |
| `editor.tabSize` | number | 2 | Spaces per tab |
| `editor.insertSpaces` | boolean | true | Use spaces instead of tabs |
| `editor.wordWrap` | string | `"off"` | Word wrap mode |
| `editor.lineNumbers` | string | `"on"` | Line number display |
| `editor.minimap` | boolean | true | Show minimap |
| `editor.renderWhitespace` | string | `"selection"` | Whitespace rendering |
| `editor.formatOnSave` | boolean | false | Auto-format on save |
| `editor.bracketPairColorization` | boolean | true | Colorize bracket pairs |
| `editor.smoothScrolling` | boolean | true | Smooth scroll animation |

## Keybindings Wired in Monaco

These keybindings are registered directly in the Monaco editor instance (not the global keyboard handler):

| Action | Shortcut |
|---|---|
| Save file | `Ctrl+S` |
| Format document | `Shift+Alt+F` |
| Go to definition | `F12` |
| Peek definition | `Alt+F12` |
| Find | `Ctrl+F` |
| Replace | `Ctrl+H` |
| Select all occurrences | `Ctrl+Shift+L` |
| Add cursor above | `Ctrl+Alt+Up` |
| Add cursor below | `Ctrl+Alt+Down` |
| Move line up | `Alt+Up` |
| Move line down | `Alt+Down` |
| Duplicate line | `Shift+Alt+Down` |
| Delete line | `Ctrl+Shift+K` |
| Toggle comment | `Ctrl+/` |
| Indent | `Tab` |
| Outdent | `Shift+Tab` |
| Trigger suggest | `Ctrl+Space` |
| Trigger AI hint | `Ctrl+Alt+Space` |

## Related

- [Keybindings](./keybindings.md) — Full shortcut reference
- [Themes](./themes.md) — Theme system and token colors
- [AI Integration](./ai-integration.md) — Inline hints and right-click AI actions
- [Search & Replace](./search-replace.md) — Cross-file search
