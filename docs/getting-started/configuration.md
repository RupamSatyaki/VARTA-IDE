# Configuration

Varta stores all settings in a JSON file on disk, managed by `electron-store` in the main process. This guide covers where settings live, what every setting does, and how to export, import, and reset them.

## Settings File Location

| Platform | Path |
|---|---|
| Windows | `%APPDATA%\varta\varta-settings.json` |
| macOS | `~/Library/Application Support/varta/varta-settings.json` |
| Linux | `~/.config/varta/varta-settings.json` |

You can open this file directly in any text editor, but changes made while Varta is running will be overwritten when Varta saves settings. Use the in-app Settings UI (`Ctrl+,`) for live changes.

## Opening Settings

- **Keyboard:** `Ctrl+,` (Windows/Linux) or `Cmd+,` (macOS)
- **Menu:** File → Preferences → Settings
- **Command Palette:** `Ctrl+Shift+P` → `Open Settings`

Settings changes apply instantly — no restart required. The main process pushes the updated settings object to the renderer via `SettingsChannel.CHANGED`.

## Complete Settings Reference

### Editor Settings

| Key | Type | Default | Description |
|---|---|---|---|
| `editor.fontSize` | `number` | `14` | Editor font size in pixels |
| `editor.fontFamily` | `string` | `"JetBrains Mono, Fira Code, monospace"` | Font family for the editor |
| `editor.tabSize` | `number` | `2` | Number of spaces per tab |
| `editor.insertSpaces` | `boolean` | `true` | Insert spaces when Tab is pressed |
| `editor.wordWrap` | `"off" \| "on" \| "wordWrapColumn" \| "bounded"` | `"off"` | Word wrap mode |
| `editor.wordWrapColumn` | `number` | `80` | Column at which to wrap (when wordWrap is `wordWrapColumn`) |
| `editor.lineNumbers` | `"on" \| "off" \| "relative" \| "interval"` | `"on"` | Line number display mode |
| `editor.minimap` | `boolean` | `true` | Show the minimap scrollbar |
| `editor.minimapMaxColumn` | `number` | `120` | Max columns rendered in minimap |
| `editor.renderWhitespace` | `"none" \| "boundary" \| "selection" \| "trailing" \| "all"` | `"selection"` | When to render whitespace characters |
| `editor.cursorStyle` | `"line" \| "block" \| "underline"` | `"line"` | Cursor shape |
| `editor.cursorBlinking` | `"blink" \| "smooth" \| "phase" \| "expand" \| "solid"` | `"blink"` | Cursor blink animation |
| `editor.formatOnSave` | `boolean` | `false` | Auto-format document on save |
| `editor.formatOnPaste` | `boolean` | `false` | Auto-format pasted content |
| `editor.autoClosingBrackets` | `"always" \| "languageDefined" \| "beforeWhitespace" \| "never"` | `"languageDefined"` | Auto-close brackets |
| `editor.autoClosingQuotes` | `"always" \| "languageDefined" \| "beforeWhitespace" \| "never"` | `"languageDefined"` | Auto-close quotes |
| `editor.bracketPairColorization` | `boolean` | `true` | Colorize matching bracket pairs |
| `editor.guides.bracketPairs` | `boolean` | `true` | Show bracket pair guides |
| `editor.smoothScrolling` | `boolean` | `true` | Smooth scroll animation in editor |
| `editor.mouseWheelZoom` | `boolean` | `false` | Zoom with Ctrl+scroll |

### Terminal Settings

| Key | Type | Default | Description |
|---|---|---|---|
| `terminal.fontSize` | `number` | `13` | Terminal font size in pixels |
| `terminal.fontFamily` | `string` | `"JetBrains Mono, monospace"` | Terminal font family |
| `terminal.shell` | `string` | `""` | Override shell path (empty = auto-detect) |
| `terminal.shellArgs` | `string[]` | `[]` | Arguments passed to the shell |
| `terminal.scrollback` | `number` | `1000` | Lines of scrollback buffer |
| `terminal.cursorStyle` | `"block" \| "underline" \| "bar"` | `"block"` | Terminal cursor shape |
| `terminal.cursorBlink` | `boolean` | `true` | Blink the terminal cursor |
| `terminal.copyOnSelect` | `boolean` | `false` | Auto-copy selected text |

### AI Settings

| Key | Type | Default | Description |
|---|---|---|---|
| `ai.apiKey` | `string` | `""` | Anthropic API key (stored encrypted, never returned to renderer) |
| `ai.chatModel` | `string` | `"claude-sonnet-4-5"` | Model used for AI Chat |
| `ai.inlineModel` | `string` | `"claude-haiku-3-5"` | Model used for inline ghost text hints |
| `ai.inlineHintsEnabled` | `boolean` | `true` | Enable inline ghost text suggestions |
| `ai.inlineHintDelay` | `number` | `600` | Milliseconds of idle time before triggering inline hint |
| `ai.maxTokens` | `number` | `4096` | Maximum tokens per AI response |
| `ai.temperature` | `number` | `0.7` | Response creativity (0 = deterministic, 1 = creative) |

### Appearance Settings

| Key | Type | Default | Description |
|---|---|---|---|
| `appearance.theme` | `string` | `"varta-dark"` | Active theme ID |
| `appearance.sidebarWidth` | `number` | `240` | Sidebar width in pixels |
| `appearance.terminalHeight` | `number` | `200` | Terminal panel height in pixels |
| `appearance.showStatusBar` | `boolean` | `true` | Show the bottom status bar |
| `appearance.showBreadcrumbs` | `boolean` | `true` | Show editor breadcrumbs |
| `appearance.compactMode` | `boolean` | `false` | Reduce padding throughout the UI |

### Git Settings

| Key | Type | Default | Description |
|---|---|---|---|
| `git.autofetch` | `boolean` | `true` | Periodically fetch from remote |
| `git.autofetchInterval` | `number` | `180` | Seconds between auto-fetches |
| `git.confirmBeforeDiscard` | `boolean` | `true` | Show confirmation before discarding changes |
| `git.defaultBranch` | `string` | `"main"` | Default branch name for new repos |

### Search Settings

| Key | Type | Default | Description |
|---|---|---|---|
| `search.exclude` | `string[]` | `["node_modules","dist","build","out",".next","coverage","__pycache__",".git"]` | Directories excluded from search |
| `search.maxResults` | `number` | `1000` | Maximum search results to return |
| `search.followSymlinks` | `boolean` | `false` | Follow symbolic links during search |

## Exporting Settings

To back up or share your settings:

1. Open Settings (`Ctrl+,`)
2. Scroll to the bottom
3. Click **Export Settings**
4. Choose a save location — Varta writes a `varta-settings.json` file

Or copy the file directly from the path listed in [Settings File Location](#settings-file-location).

## Importing Settings

1. Open Settings (`Ctrl+,`)
2. Scroll to the bottom
3. Click **Import Settings**
4. Select your exported `varta-settings.json`

Varta validates the imported JSON and applies only recognized keys. Unknown keys are ignored. Settings take effect immediately.

## Resetting to Defaults

To reset all settings to their factory defaults:

1. Open Settings (`Ctrl+,`)
2. Scroll to the bottom
3. Click **Reset to Defaults**
4. Confirm the dialog

This deletes the settings file and recreates it with all defaults. Your API key is also cleared.

Alternatively, delete the settings file manually while Varta is closed:

```bash
# macOS
rm ~/Library/Application\ Support/varta/varta-settings.json

# Linux
rm ~/.config/varta/varta-settings.json

# Windows PowerShell
Remove-Item "$env:APPDATA\varta\varta-settings.json"
```

## Settings JSON Example

A minimal `varta-settings.json` with common customizations:

```json
{
  "editor.fontSize": 15,
  "editor.fontFamily": "Fira Code, monospace",
  "editor.tabSize": 4,
  "editor.insertSpaces": true,
  "editor.formatOnSave": true,
  "editor.minimap": false,
  "terminal.fontSize": 14,
  "terminal.shell": "/opt/homebrew/bin/fish",
  "appearance.theme": "monokai",
  "ai.chatModel": "claude-sonnet-4-5",
  "ai.inlineHintsEnabled": true,
  "git.autofetch": true
}
```

## Related

- [Themes](../features/themes.md) — Creating and switching themes
- [Keybindings](../features/keybindings.md) — Customizing keyboard shortcuts
- [Settings API](../api/window-varta-api.md#settings) — Programmatic settings access

## Settings Sync (Planned)

A future version will support syncing settings across machines via:
- GitHub Gist
- Cloud storage (Dropbox, Google Drive)
- Custom sync server

## Portable Mode

To run Varta in portable mode (settings stored alongside the app, not in user data directory):

1. Create a `portable` folder next to the Varta executable
2. Settings will be stored in `portable/varta-settings.json`
3. Useful for running from a USB drive

## Environment Variables

Override settings paths via environment variables:

| Variable | Purpose |
|---|---|
| `VARTA_USER_DATA` | Override user data directory |
| `VARTA_SETTINGS_PATH` | Override settings file path |
| `VARTA_EXTENSIONS_PATH` | Override extensions directory |

Example:

```bash
VARTA_USER_DATA=/tmp/varta-dev npm run dev
```
