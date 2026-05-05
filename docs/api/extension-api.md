# Extension API

The Varta extension system (planned for v2) allows third-party developers to add commands, keybindings, language support, themes, and UI contributions to the editor.

> **Status:** The extension infrastructure (`ExtensionService`, `ExtensionChannel`, `ExtensionStore`) is implemented in v1, but the public extension API and marketplace are planned for v2. This document describes the intended design.

## Extension Manifest

Every Varta extension is an npm package with a `package.json` that includes Varta-specific fields:

```json
{
  "name": "varta-my-extension",
  "version": "1.0.0",
  "description": "My Varta extension",
  "main": "dist/extension.js",
  "varta": {
    "displayName": "My Extension",
    "categories": ["Languages", "Themes", "Snippets"],
    "activationEvents": [
      "onLanguage:python",
      "onCommand:myExtension.doSomething",
      "onStartup"
    ],
    "contributes": {
      "commands": [...],
      "keybindings": [...],
      "menus": [...],
      "languages": [...],
      "grammars": [...],
      "themes": [...],
      "snippets": [...]
    },
    "engines": {
      "varta": "^1.0.0"
    }
  }
}
```

## ExtensionContributions Interface

```typescript
interface ExtensionContributions {
  commands?: CommandContribution[]
  keybindings?: KeybindingContribution[]
  menus?: MenuContribution[]
  languages?: LanguageContribution[]
  grammars?: GrammarContribution[]
  themes?: ThemeContribution[]
  snippets?: SnippetContribution[]
}
```

### Commands

```typescript
interface CommandContribution {
  command: string      // unique command ID, e.g. "myExtension.doSomething"
  title: string        // display name in command palette
  category?: string    // groups commands in palette, e.g. "My Extension"
  icon?: string        // icon name or path
}
```

Example:

```json
{
  "commands": [
    {
      "command": "myExtension.formatWithPrettier",
      "title": "Format with Prettier",
      "category": "Prettier"
    }
  ]
}
```

### Keybindings

```typescript
interface KeybindingContribution {
  command: string      // command ID to execute
  key: string          // key combination, e.g. "ctrl+shift+p"
  mac?: string         // macOS override
  when?: string        // when clause, e.g. "editorFocus"
}
```

Example:

```json
{
  "keybindings": [
    {
      "command": "myExtension.formatWithPrettier",
      "key": "ctrl+shift+i",
      "when": "editorFocus"
    }
  ]
}
```

### Menus

```typescript
interface MenuContribution {
  location: 'editor/context' | 'file-tree/context' | 'editor/title'
  command: string
  when?: string
  group?: string       // groups items with separators
}
```

Example:

```json
{
  "menus": [
    {
      "location": "editor/context",
      "command": "myExtension.formatWithPrettier",
      "when": "editorFocus",
      "group": "1_modification"
    }
  ]
}
```

### Languages

```typescript
interface LanguageContribution {
  id: string                    // language ID, e.g. "solidity"
  aliases?: string[]            // display names
  extensions?: string[]         // file extensions, e.g. [".sol"]
  filenames?: string[]          // exact filenames, e.g. ["Dockerfile"]
  mimetypes?: string[]          // MIME types
  configuration?: string        // path to language config JSON
}
```

Example:

```json
{
  "languages": [
    {
      "id": "solidity",
      "aliases": ["Solidity"],
      "extensions": [".sol"],
      "configuration": "./language-configuration.json"
    }
  ]
}
```

### Grammars

TextMate grammars for syntax highlighting:

```typescript
interface GrammarContribution {
  language: string       // language ID this grammar applies to
  scopeName: string      // TextMate scope, e.g. "source.solidity"
  path: string           // path to .tmGrammar.json or .tmLanguage file
  embeddedLanguages?: Record<string, string>
}
```

Example:

```json
{
  "grammars": [
    {
      "language": "solidity",
      "scopeName": "source.solidity",
      "path": "./syntaxes/solidity.tmGrammar.json"
    }
  ]
}
```

### Themes

```typescript
interface ThemeContribution {
  id: string             // unique theme ID
  label: string          // display name
  uiTheme: 'vs-dark' | 'vs'
  path: string           // path to theme JSON file
}
```

The theme JSON file follows the `VartaTheme` interface. See [Themes](../features/themes.md#creating-a-custom-theme).

### Snippets

```typescript
interface SnippetContribution {
  language: string       // language ID
  path: string           // path to snippets JSON file
}
```

Snippets JSON follows the VS Code snippet format:

```json
{
  "Arrow Function": {
    "prefix": "af",
    "body": ["const ${1:name} = (${2:params}) => {", "\t$0", "}"],
    "description": "Arrow function"
  }
}
```

## Extension Host

Extensions run in a sandboxed Node.js context in the main process. The sandbox:

- Has access to a limited `varta` API (subset of the full API)
- Cannot access `ipcMain` directly
- Cannot access `BrowserWindow` or `webContents`
- Has a restricted `require()` that blocks dangerous modules (`child_process`, `fs` direct access)
- Is given a scoped file system API limited to the extension's own directory and the workspace

```typescript
// Extension entry point (dist/extension.js)
export function activate(context: ExtensionContext): void {
  // Register a command
  context.subscriptions.push(
    varta.commands.registerCommand('myExtension.doSomething', () => {
      varta.window.showMessage('Hello from my extension!')
    })
  )
}

export function deactivate(): void {
  // Cleanup (subscriptions are auto-disposed)
}
```

## Extensions Directory

Extensions are installed to:

| Platform | Path |
|---|---|
| Windows | `%APPDATA%\varta\extensions\` |
| macOS | `~/Library/Application Support/varta/extensions/` |
| Linux | `~/.config/varta/extensions\` |

Each extension is a subdirectory named `{publisher}.{name}-{version}`:

```
extensions/
├── acme.prettier-plugin-1.0.0/
│   ├── package.json
│   └── dist/
│       └── extension.js
└── acme.solidity-language-2.1.0/
    ├── package.json
    ├── syntaxes/
    │   └── solidity.tmGrammar.json
    └── dist/
        └── extension.js
```

## Building a Varta Extension (v2)

> Extension tooling is planned for v2. The following describes the intended workflow.

```bash
# Install the extension scaffolding tool
npm install -g @varta/create-extension

# Create a new extension
npx @varta/create-extension my-extension

# Develop with hot reload
npm run watch

# Package for distribution
npm run package

# Publish to Varta marketplace
npx @varta/publish
```

## Recommended Extensions (Planned)

| Extension | Description |
|---|---|
| `varta.prettier` | Format with Prettier on save |
| `varta.eslint` | ESLint integration with inline diagnostics |
| `varta.solidity` | Solidity language support |
| `varta.rust-analyzer` | Rust language server integration |
| `varta.docker` | Dockerfile syntax and Docker commands |
| `varta.remote-ssh` | Edit files on remote servers over SSH |
| `varta.live-share` | Real-time collaborative editing |

## Related

- [Main Process](../architecture/main-process.md) — ExtensionService implementation
- [IPC Channels](./ipc-channels.md) — ExtensionChannel (7 channels)
- [Themes](../features/themes.md) — Theme contribution format
