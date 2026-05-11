# Varta IDE

A modern desktop code editor built with Electron, React, and TypeScript. Varta combines a fast Monaco-powered editor with an integrated terminal, git panel, and AI assistant — all in a single, focused application.

![Varta IDE Screenshot](docs/assets/screenshot.png)

> Screenshot placeholder — replace with an actual screenshot after first launch.

## Features

- **Monaco Editor** — The same editor that powers VS Code, with syntax highlighting for 34+ languages, IntelliSense, multi-cursor editing, and code folding
- **File Tree** — Lazy-loading directory tree with git status badges, keyboard navigation, inline rename, and real-time file watching
- **Integrated Terminal** — Full PTY terminal via node-pty and xterm.js, with multiple tabs and shell auto-detection
- **Find in Files** — Streaming cross-project search with regex, case sensitivity, whole word matching, and Replace All
- **Git Integration** — Stage, commit, push, pull, branch management, and diff viewer — all without leaving the editor
- **AI Chat** — Conversational AI assistant powered by Claude, with full editor context injection and streaming responses
- **Inline AI Hints** — Ghost text code completions that appear as you type, accepted with Tab
- **Themes** — 5 built-in themes (Varta Dark, Varta Light, Monokai, GitHub Dark, Solarized Dark) with custom theme support
- **Command Palette** — `Ctrl+Shift+P` access to every command in the app
- **40+ Keyboard Shortcuts** — Full keyboard-driven workflow

## Quick Start

```bash
# Clone the repository
git clone https://github.com/your-org/varta.git
cd varta

# Install dependencies (compiles node-pty natively)
npm install

# Start in development mode
npm run dev
```

The app window opens automatically. See [Installation](docs/getting-started/installation.md) for platform-specific prerequisites.

## Tech Stack

| Layer | Technology |
|---|---|
| Desktop shell | [Electron](https://electronjs.org) |
| Build system | [electron-vite](https://electron-vite.org) |
| UI framework | [React](https://react.dev) + [TypeScript](https://typescriptlang.org) |
| Styling | [Tailwind CSS](https://tailwindcss.com) |
| Code editor | [Monaco Editor](https://microsoft.github.io/monaco-editor/) |
| State management | [Zustand](https://zustand-demo.pmnd.rs) |
| Terminal renderer | [xterm.js](https://xtermjs.org) |
| Terminal PTY | [node-pty](https://github.com/microsoft/node-pty) |
| Git operations | [simple-git](https://github.com/steveukx/git-js) |
| File watching | [@parcel/watcher](https://github.com/parcel-bundler/watcher) |
| Settings storage | [electron-store](https://github.com/sindresorhus/electron-store) |
| AI provider | [Anthropic Claude](https://anthropic.com) |
| Packaging | [electron-builder](https://www.electron.build) |

## Documentation

### Getting Started
- [Installation](docs/getting-started/installation.md) — System requirements and setup
- [First Steps](docs/getting-started/first-steps.md) — Open a folder, edit files, use the terminal
- [Configuration](docs/getting-started/configuration.md) — Settings reference and file locations
- [FAQ](docs/getting-started/faq.md) — Common issues and solutions

### Architecture
- [Overview](docs/architecture/overview.md) — Two-process model, IPC, stores, and component tree
- [Main Process](docs/architecture/main-process.md) — Services, IPC handlers, and lifecycle
- [Renderer Process](docs/architecture/renderer-process.md) — Stores, hooks, Monaco models, and themes
- [IPC Contract](docs/architecture/ipc-contract.md) — All 106 IPC channels documented
- [Security Model](docs/architecture/security-model.md) — contextIsolation, API key security, CSP

### Features
- [Editor](docs/features/editor.md) — Monaco, tabs, models, and language support
- [File Tree](docs/features/file-tree.md) — Navigation, git badges, and file operations
- [Terminal](docs/features/terminal.md) — PTY architecture, multiple tabs, and configuration
- [Search & Replace](docs/features/search-replace.md) — Cross-file search with streaming results
- [Git Integration](docs/features/git-integration.md) — Stage, commit, push, branches, and diffs
- [AI Integration](docs/features/ai-integration.md) — Chat, inline hints, and commit messages
- [Themes](docs/features/themes.md) — Built-in themes and custom theme creation
- [Keybindings](docs/features/keybindings.md) — Full shortcut reference
- [Settings](docs/features/settings.md) — All settings with types and defaults

### API Reference
- [window.varta API](docs/api/window-varta-api.md) — Complete renderer API (78 functions)
- [IPC Channels](docs/api/ipc-channels.md) — All 106 channels with enum values
- [Error Codes](docs/api/error-codes.md) — All 68 VartaError codes
- [Extension API](docs/api/extension-api.md) — Extension system design (v2)

### Contributing
- [Setup](docs/contributing/setup.md) — Fork, clone, and run locally
- [Code Style](docs/contributing/code-style.md) — TypeScript, IPC, and component rules
- [Commit Convention](docs/contributing/commit-convention.md) — Conventional Commits format
- [Pull Request Guide](docs/contributing/pull-request-guide.md) — PR checklist and process

### Deployment
- [Packaging](docs/deployment/packaging.md) — electron-builder config and version bumping
- [Windows Build](docs/deployment/windows-build.md) — NSIS installer and code signing
- [macOS Build](docs/deployment/macos-build.md) — DMG, signing, and notarization
- [Linux Build](docs/deployment/linux-build.md) — AppImage, .deb, and .rpm

## Development Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start in development mode (hot reload) |
| `npm run build` | Build for current platform |
| `npm run typecheck` | TypeScript type checking |
| `npm run lint` | ESLint |
| `npm run package:win` | Windows NSIS installer |
| `npm run package:mac` | macOS DMG |
| `npm run package:linux` | Linux AppImage |

## License

MIT — see [LICENSE](LICENSE) for details.
