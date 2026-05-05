# Themes

Varta supports multiple built-in themes and custom user-defined themes. Themes control both the application UI colors (via CSS variables) and the Monaco editor token colors.

## Built-In Themes

Varta ships with 5 built-in themes:

### Varta Dark (Default)

A dark theme with vibrant, saturated colors inspired by Material Theme Palenight.

| Element | Color |
|---|---|
| Background | `#1A1A2E` |
| Editor background | `#1E1E2E` |
| Sidebar background | `#16213E` |
| Active tab | `#1E1E2E` |
| Inactive tab | `#16213E` |
| Foreground | `#EEFFFF` |
| Accent | `#82AAFF` |
| Keywords | `#C792EA` |
| Strings | `#C3E88D` |

### Varta Light

A clean light theme for daytime use.

| Element | Color |
|---|---|
| Background | `#FAFAFA` |
| Editor background | `#FFFFFF` |
| Sidebar background | `#F3F3F3` |
| Active tab | `#FFFFFF` |
| Foreground | `#383A42` |
| Accent | `#4078F2` |
| Keywords | `#A626A4` |
| Strings | `#50A14F` |

### Monokai

The classic Monokai color scheme, beloved by developers for decades.

| Element | Color |
|---|---|
| Background | `#272822` |
| Editor background | `#272822` |
| Foreground | `#F8F8F2` |
| Keywords | `#F92672` |
| Strings | `#E6DB74` |
| Functions | `#A6E22E` |
| Types | `#66D9EF` |

### GitHub Dark

Matches GitHub's dark mode interface, familiar to anyone who spends time on GitHub.

| Element | Color |
|---|---|
| Background | `#0D1117` |
| Editor background | `#0D1117` |
| Foreground | `#E6EDF3` |
| Keywords | `#FF7B72` |
| Strings | `#A5D6FF` |
| Functions | `#D2A8FF` |
| Types | `#79C0FF` |

### Solarized Dark

The Solarized color scheme with its distinctive warm background and carefully chosen palette.

| Element | Color |
|---|---|
| Background | `#002B36` |
| Editor background | `#002B36` |
| Foreground | `#839496` |
| Keywords | `#859900` |
| Strings | `#2AA198` |
| Functions | `#268BD2` |
| Types | `#B58900` |

## Switching Themes

- **Settings:** `Ctrl+,` → Appearance → Theme
- **Command Palette:** `Ctrl+Shift+P` → `Preferences: Color Theme`
- **Keyboard:** `Ctrl+K Ctrl+T` opens the theme picker

Theme changes apply instantly (hot-reload) — no restart required.

## How Themes Work

Themes are applied in two places simultaneously:

### 1. CSS Variables on `:root`

All UI colors are defined as CSS custom properties on the `:root` element. Components use `var(--variable-name)` instead of hardcoded colors.

```css
/* Applied by applyTheme() */
:root {
  --bg-primary: #1A1A2E;
  --bg-secondary: #16213E;
  --bg-editor: #1E1E2E;
  --bg-tab-active: #1E1E2E;
  --bg-tab-inactive: #16213E;
  --fg-primary: #EEFFFF;
  --fg-secondary: #546E7A;
  --fg-muted: #3D4A5C;
  --accent: #82AAFF;
  --border: #2D3561;
  --terminal-bg: #1A1A2E;
  --terminal-fg: #EEFFFF;
  --terminal-cursor: #82AAFF;
  --scrollbar-thumb: #3D4A5C;
  --scrollbar-track: transparent;
  /* ... more variables */
}
```

### 2. Monaco Theme Registration

Monaco has its own theming system. Varta registers a Monaco theme for each Varta theme:

```typescript
monaco.editor.defineTheme('varta-dark', {
  base: 'vs-dark',
  inherit: true,
  rules: [
    { token: 'keyword', foreground: 'C792EA', fontStyle: 'italic' },
    { token: 'string', foreground: 'C3E88D' },
    { token: 'number', foreground: 'F78C6C' },
    { token: 'comment', foreground: '546E7A', fontStyle: 'italic' },
    { token: 'type', foreground: 'FFCB6B' },
    { token: 'function', foreground: '82AAFF' },
    // ...
  ],
  colors: {
    'editor.background': '#1E1E2E',
    'editor.foreground': '#EEFFFF',
    'editorCursor.foreground': '#82AAFF',
    'editor.lineHighlightBackground': '#2D3561',
    'editorLineNumber.foreground': '#3D4A5C',
    'editorLineNumber.activeForeground': '#82AAFF',
    // ...
  },
})

monaco.editor.setTheme('varta-dark')
```

## Complete CSS Variables Reference

| Variable | Description |
|---|---|
| `--bg-primary` | Main app background |
| `--bg-secondary` | Sidebar, panels background |
| `--bg-editor` | Editor area background |
| `--bg-tab-active` | Active tab background |
| `--bg-tab-inactive` | Inactive tab background |
| `--bg-hover` | Hover state background |
| `--bg-selected` | Selected item background |
| `--bg-input` | Input field background |
| `--fg-primary` | Primary text color |
| `--fg-secondary` | Secondary/muted text |
| `--fg-muted` | Very muted text (line numbers, etc.) |
| `--fg-placeholder` | Input placeholder text |
| `--accent` | Accent/highlight color |
| `--accent-hover` | Accent hover state |
| `--border` | Border color |
| `--border-focus` | Focused element border |
| `--terminal-bg` | Terminal background |
| `--terminal-fg` | Terminal foreground |
| `--terminal-cursor` | Terminal cursor color |
| `--scrollbar-thumb` | Scrollbar thumb color |
| `--scrollbar-track` | Scrollbar track color |
| `--git-added` | Git added badge color |
| `--git-modified` | Git modified badge color |
| `--git-deleted` | Git deleted badge color |
| `--git-untracked` | Git untracked badge color |
| `--notification-info` | Info notification color |
| `--notification-success` | Success notification color |
| `--notification-warning` | Warning notification color |
| `--notification-error` | Error notification color |

## Creating a Custom Theme

### VartaTheme Interface

```typescript
interface VartaTheme {
  id: string              // unique identifier, e.g. "my-theme"
  name: string            // display name, e.g. "My Theme"
  base: 'vs-dark' | 'vs' // Monaco base theme
  cssVars: Record<string, string>  // CSS variable overrides
  monacoRules: monaco.editor.ITokenThemeRule[]
  monacoColors: Record<string, string>
}
```

### Example Custom Theme

```typescript
// my-theme.json
{
  "id": "my-ocean-theme",
  "name": "Ocean Dark",
  "base": "vs-dark",
  "cssVars": {
    "--bg-primary": "#0A192F",
    "--bg-secondary": "#112240",
    "--bg-editor": "#0A192F",
    "--bg-tab-active": "#0A192F",
    "--bg-tab-inactive": "#112240",
    "--fg-primary": "#CCD6F6",
    "--fg-secondary": "#8892B0",
    "--accent": "#64FFDA",
    "--border": "#233554"
  },
  "monacoRules": [
    { "token": "keyword", "foreground": "FF79C6" },
    { "token": "string", "foreground": "F1FA8C" },
    { "token": "number", "foreground": "BD93F9" },
    { "token": "comment", "foreground": "6272A4", "fontStyle": "italic" },
    { "token": "function", "foreground": "50FA7B" },
    { "token": "type", "foreground": "8BE9FD" }
  ],
  "monacoColors": {
    "editor.background": "#0A192F",
    "editor.foreground": "#CCD6F6",
    "editorCursor.foreground": "#64FFDA",
    "editor.lineHighlightBackground": "#112240"
  }
}
```

### Loading a Custom Theme

1. Save your theme as a `.json` file
2. Open Settings → Appearance → Themes → **Load Custom Theme**
3. Select your JSON file
4. The theme appears in the theme picker immediately

Custom themes are stored in the user data directory and persist across app restarts.

## Theme Hot-Reload

Theme changes apply instantly without restarting the app:

1. `ThemeChannel.SET_THEME` is invoked with the new theme ID
2. The main process updates `settings.appearance.theme`
3. `ThemeChannel.CHANGED` is pushed to the renderer
4. The renderer calls `applyTheme(newTheme)`:
   - Updates all CSS variables on `:root`
   - Re-registers and activates the Monaco theme

## Related

- [Configuration](../getting-started/configuration.md) — `appearance.theme` setting
- [Renderer Process](../architecture/renderer-process.md) — Theme application code
- [IPC Contract](../architecture/ipc-contract.md) — ThemeChannel channels
