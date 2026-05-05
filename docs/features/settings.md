# Settings

Varta's settings system provides a comprehensive configuration UI and JSON-based persistence. All settings apply instantly without restarting the app.

## Opening Settings

| Method | Action |
|---|---|
| Keyboard | `Ctrl+,` (Windows/Linux) or `Cmd+,` (macOS) |
| Menu | File → Preferences → Settings |
| Command Palette | `Ctrl+Shift+P` → `Open Settings` |

## Settings UI

The Settings panel is organized into sections:

- **Editor** — Font, tab size, word wrap, minimap, formatting
- **Terminal** — Shell, font, scrollback, cursor
- **AI** — API key, models, inline hints
- **Appearance** — Theme, sidebar width, status bar
- **Git** — Auto-fetch, confirm before discard
- **Search** — Exclude patterns, max results
- **Keybindings** — Keyboard shortcut customization

Each setting shows its current value, type, and a description. Changes apply immediately.

## Complete Settings Reference

### Editor

| Key | Type | Default | Description |
|---|---|---|---|
| `editor.fontSize` | `number` | `14` | Font size in pixels |
| `editor.fontFamily` | `string` | `"JetBrains Mono, Fira Code, monospace"` | Font family |
| `editor.tabSize` | `number` | `2` | Spaces per tab stop |
| `editor.insertSpaces` | `boolean` | `true` | Insert spaces when Tab is pressed |
| `editor.wordWrap` | `"off"\|"on"\|"wordWrapColumn"\|"bounded"` | `"off"` | Word wrap mode |
| `editor.wordWrapColumn` | `number` | `80` | Wrap column (when wordWrap is wordWrapColumn) |
| `editor.lineNumbers` | `"on"\|"off"\|"relative"\|"interval"` | `"on"` | Line number display |
| `editor.minimap` | `boolean` | `true` | Show minimap |
| `editor.minimapMaxColumn` | `number` | `120` | Max columns in minimap |
| `editor.renderWhitespace` | `"none"\|"boundary"\|"selection"\|"trailing"\|"all"` | `"selection"` | Whitespace rendering |
| `editor.cursorStyle` | `"line"\|"block"\|"underline"` | `"line"` | Cursor shape |
| `editor.cursorBlinking` | `"blink"\|"smooth"\|"phase"\|"expand"\|"solid"` | `"blink"` | Cursor animation |
| `editor.formatOnSave` | `boolean` | `false` | Format document on save |
| `editor.formatOnPaste` | `boolean` | `false` | Format pasted content |
| `editor.autoClosingBrackets` | `"always"\|"languageDefined"\|"beforeWhitespace"\|"never"` | `"languageDefined"` | Auto-close brackets |
| `editor.autoClosingQuotes` | `"always"\|"languageDefined"\|"beforeWhitespace"\|"never"` | `"languageDefined"` | Auto-close quotes |
| `editor.bracketPairColorization` | `boolean` | `true` | Colorize bracket pairs |
| `editor.guides.bracketPairs` | `boolean` | `true` | Show bracket pair guides |
| `editor.smoothScrolling` | `boolean` | `true` | Smooth scroll animation |
| `editor.mouseWheelZoom` | `boolean` | `false` | Zoom with Ctrl+scroll |
| `editor.linkedEditing` | `boolean` | `false` | Rename HTML tags simultaneously |
| `editor.stickyScroll` | `boolean` | `true` | Sticky scroll for scope headers |

### Terminal

| Key | Type | Default | Description |
|---|---|---|---|
| `terminal.fontSize` | `number` | `13` | Terminal font size |
| `terminal.fontFamily` | `string` | `"JetBrains Mono, monospace"` | Terminal font |
| `terminal.shell` | `string` | `""` | Shell path (empty = auto-detect) |
| `terminal.shellArgs` | `string[]` | `[]` | Shell startup arguments |
| `terminal.scrollback` | `number` | `1000` | Scrollback buffer lines |
| `terminal.cursorStyle` | `"block"\|"underline"\|"bar"` | `"block"` | Terminal cursor shape |
| `terminal.cursorBlink` | `boolean` | `true` | Blink terminal cursor |
| `terminal.copyOnSelect` | `boolean` | `false` | Auto-copy on selection |
| `terminal.env` | `Record<string, string>` | `{}` | Extra environment variables |

### AI

| Key | Type | Default | Description |
|---|---|---|---|
| `ai.apiKey` | `string` | `""` | Anthropic API key (write-only, never returned) |
| `ai.chatModel` | `string` | `"claude-sonnet-4-5"` | Chat model |
| `ai.inlineModel` | `string` | `"claude-haiku-3-5"` | Inline hints model |
| `ai.inlineHintsEnabled` | `boolean` | `true` | Enable inline ghost text |
| `ai.inlineHintDelay` | `number` | `600` | Idle ms before triggering hint |
| `ai.maxTokens` | `number` | `4096` | Max tokens per response |
| `ai.temperature` | `number` | `0.7` | Response temperature (0–1) |
| `ai.systemPrompt` | `string` | `""` | Custom system prompt prefix |

### Appearance

| Key | Type | Default | Description |
|---|---|---|---|
| `appearance.theme` | `string` | `"varta-dark"` | Active theme ID |
| `appearance.sidebarWidth` | `number` | `240` | Sidebar width in pixels |
| `appearance.terminalHeight` | `number` | `200` | Terminal panel height |
| `appearance.showStatusBar` | `boolean` | `true` | Show status bar |
| `appearance.showBreadcrumbs` | `boolean` | `true` | Show editor breadcrumbs |
| `appearance.compactMode` | `boolean` | `false` | Reduce UI padding |
| `appearance.fontAntialiasing` | `"auto"\|"none"\|"subpixel"\|"grayscale"` | `"auto"` | Font rendering |

### Git

| Key | Type | Default | Description |
|---|---|---|---|
| `git.autofetch` | `boolean` | `true` | Auto-fetch from remote |
| `git.autofetchInterval` | `number` | `180` | Seconds between auto-fetches |
| `git.confirmBeforeDiscard` | `boolean` | `true` | Confirm before discarding changes |
| `git.defaultBranch` | `string` | `"main"` | Default branch for new repos |
| `git.enableSmartCommit` | `boolean` | `false` | Commit all changes if nothing staged |

### Search

| Key | Type | Default | Description |
|---|---|---|---|
| `search.exclude` | `string[]` | `["node_modules",".git","dist","build","out",".next","coverage","__pycache__"]` | Excluded directories |
| `search.maxResults` | `number` | `1000` | Max results to return |
| `search.followSymlinks` | `boolean` | `false` | Follow symbolic links |

## Settings Persistence

Settings are stored in `electron-store` in the main process. The file is written to disk on every change.

When a setting changes:
1. `SettingsService.set(key, value)` updates the store
2. `SettingsChannel.CHANGED` is pushed to the renderer with the full settings object
3. `useSettingsStore.setSettings()` updates the Zustand store
4. Components that read from `useSettingsStore` re-render with the new value
5. Monaco editor options are updated via `editor.updateOptions()`

## Live Settings

All settings apply instantly. Examples:

- Change `editor.fontSize` → Monaco updates font size immediately
- Change `appearance.theme` → Theme switches without restart
- Change `terminal.fontSize` → Terminal font updates on next terminal creation
- Change `ai.inlineHintsEnabled` → Hints enable/disable immediately

## Export and Import

### Export

1. Settings → scroll to bottom → **Export Settings**
2. Choose save location
3. Varta writes `varta-settings.json`

Or copy the file directly from the [settings file location](../getting-started/configuration.md#settings-file-location).

### Import

1. Settings → scroll to bottom → **Import Settings**
2. Select a `varta-settings.json` file
3. Varta validates and applies the settings

Unknown keys in the imported file are ignored. Invalid values (wrong type) are skipped with a warning notification.

## Reset to Defaults

Settings → scroll to bottom → **Reset to Defaults** → Confirm.

This deletes the settings file and recreates it with all defaults. Your API key is also cleared.

## Related

- [Configuration](../getting-started/configuration.md) — Settings file location and JSON example
- [Themes](./themes.md) — Theme settings
- [Keybindings](./keybindings.md) — Keybinding customization
- [IPC Contract](../architecture/ipc-contract.md) — SettingsChannel (8 channels)

## Settings Validation

When you enter an invalid value (wrong type, out of range), Varta shows an inline error and reverts to the previous value. For example:

- `editor.fontSize` below 6 or above 72 → reverted with a warning
- `terminal.scrollback` above 10000 → capped at 10000
- `ai.temperature` outside 0–1 → reverted with a warning

## Settings in the Renderer

Components access settings via `useSettingsStore`:

```typescript
import { useSettingsStore } from '../stores/settingsStore'

function MyComponent() {
  const fontSize = useSettingsStore(s => s.settings['editor.fontSize'])
  return <div style={{ fontSize }}>...</div>
}
```

Settings are always up to date — the store is updated whenever `SettingsChannel.CHANGED` is received from the main process.

## Workspace Settings (Planned)

A future version will support per-workspace settings stored in `.varta/settings.json` at the project root. Workspace settings override user settings for that project only.
