# Development Setup

This guide walks you through setting up a local development environment for contributing to Varta.

## Prerequisites

- Node.js 20+ (use [nvm](https://github.com/nvm-sh/nvm) or [fnm](https://github.com/Schniz/fnm))
- npm 10+
- Git 2+
- Platform-specific build tools (see [Installation](../getting-started/installation.md))

## Fork and Clone

1. Fork the repository on GitHub
2. Clone your fork:

```bash
git clone https://github.com/YOUR_USERNAME/varta.git
cd varta
```

3. Add the upstream remote:

```bash
git remote add upstream https://github.com/your-org/varta.git
```

## Install Dependencies

```bash
npm install
```

This installs all dependencies and compiles native modules (`node-pty`) for the current Electron version. Takes 1–3 minutes on first run.

## Start Development Mode

```bash
npm run dev
```

This starts:
- Vite dev server for the renderer (hot module replacement)
- Electron main process with file watching

The app window opens automatically. Renderer changes hot-reload. Main process changes restart Electron.

## Available Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start in development mode |
| `npm run build` | Build for current platform |
| `npm run build:all` | Build for all platforms |
| `npm run typecheck` | Run TypeScript type checking |
| `npm run lint` | Run ESLint |
| `npm run lint:fix` | Run ESLint with auto-fix |
| `npm run format` | Run Prettier |
| `npm run test` | Run tests |
| `npm run package:win` | Package Windows installer |
| `npm run package:mac` | Package macOS DMG |
| `npm run package:linux` | Package Linux AppImage |

## Project Structure Tour

```
varta/
├── src/
│   ├── main/                    # Electron main process (Node.js)
│   │   ├── index.ts             # Entry point
│   │   ├── ipc/                 # IPC handler registration
│   │   │   ├── index.ts         # registerAllHandlers()
│   │   │   ├── fileHandlers.ts
│   │   │   ├── gitHandlers.ts
│   │   │   └── ...
│   │   ├── services/            # Business logic
│   │   │   ├── FileService.ts
│   │   │   ├── GitService.ts
│   │   │   └── ...
│   │   ├── window/              # Window management
│   │   │   ├── WindowManager.ts
│   │   │   └── createMainWindow.ts
│   │   ├── menu/                # Native menus
│   │   │   ├── AppMenu.ts
│   │   │   └── ContextMenu.ts
│   │   └── utils/
│   │       ├── logger.ts
│   │       └── pathUtils.ts
│   │
│   ├── preload/                 # Preload bridge (contextBridge)
│   │   ├── index.ts             # exposeInMainWorld('varta', ...)
│   │   ├── varta.d.ts           # TypeScript types for window.varta
│   │   └── api/                 # Per-domain API wrappers
│   │       ├── fileApi.ts
│   │       ├── gitApi.ts
│   │       └── ...
│   │
│   ├── renderer/                # React frontend
│   │   ├── main.tsx             # React entry point
│   │   ├── App.tsx              # Root component
│   │   ├── components/          # React components
│   │   │   ├── editor/
│   │   │   ├── filetree/
│   │   │   ├── terminal/
│   │   │   ├── git/
│   │   │   ├── ai/
│   │   │   └── ...
│   │   ├── hooks/               # Custom hooks (IPC callers)
│   │   ├── stores/              # Zustand stores
│   │   └── assets/
│   │       └── styles/
│   │
│   └── shared/                  # Shared between main and renderer
│       ├── ipc.ts               # Channel enums
│       ├── errors.ts            # VartaError
│       └── types.ts             # Shared TypeScript types
│
├── docs/                        # This documentation
├── electron-builder.yml         # Packaging configuration
├── electron.vite.config.ts      # Build configuration
├── package.json
└── tsconfig.json
```

## "Where Do I Find...?" Guide

| Task | Location |
|---|---|
| Add a native menu item | `src/main/menu/AppMenu.ts` |
| Add a context menu item | `src/main/menu/ContextMenu.ts` |
| Add a new IPC channel | `src/shared/ipc.ts` + `src/main/ipc/` + `src/preload/api/` + `src/preload/varta.d.ts` |
| Add a new sidebar panel | `src/renderer/components/layout/Sidebar.tsx` |
| Add a new setting | `src/shared/types.ts` (VartaSettings) + `src/main/services/SettingsService.ts` |
| Add a new command | `src/renderer/hooks/useKeyboardShortcuts.ts` + `src/renderer/stores/commandStore.ts` |
| Add a new git operation | `src/main/services/GitService.ts` + `src/main/ipc/gitHandlers.ts` |
| Change editor defaults | `src/renderer/components/editor/CodeCanvas.tsx` |
| Add a new theme | `src/renderer/assets/styles/themes.css` + theme registry |
| Add a new notification type | `src/renderer/stores/notificationStore.ts` |
| Change window behavior | `src/main/window/WindowManager.ts` |

## Running Type Checks

```bash
npm run typecheck
```

This runs `tsc --noEmit` across all three TypeScript configs (main, preload, renderer). Fix all type errors before submitting a PR.

## Running ESLint

```bash
npm run lint
```

Auto-fix most issues:

```bash
npm run lint:fix
```

The ESLint config enforces:
- No `any` types
- No `console.log` (use `logger`)
- No magic strings for IPC channels (use enums)
- Import ordering

## Debugging

### Main Process

Add `--inspect` to the Electron launch args in `package.json`:

```json
{
  "scripts": {
    "dev": "electron-vite dev --inspect"
  }
}
```

Then open `chrome://inspect` in Chrome and connect to the Node.js debugger.

### Renderer Process

Open DevTools in the running app: `Ctrl+Shift+I` (or `Cmd+Option+I` on macOS).

The renderer runs in a standard Chromium context — all Chrome DevTools features work.

## Related

- [Code Style](./code-style.md) — Coding standards and rules
- [Commit Convention](./commit-convention.md) — How to write commit messages
- [Pull Request Guide](./pull-request-guide.md) — PR checklist and process
- [Architecture Overview](../architecture/overview.md) — How the codebase is structured

## Hot Reload Behavior

| Change Type | Behavior |
|---|---|
| Renderer component | Instant hot reload (HMR) |
| Renderer store/hook | Instant hot reload |
| Preload script | Electron restarts |
| Main process file | Electron restarts |
| `src/shared/` types | Electron restarts |

## Useful VS Code Extensions for Development

If you use VS Code to develop Varta:

| Extension | Purpose |
|---|---|
| ESLint | Inline lint errors |
| Tailwind CSS IntelliSense | Tailwind class autocomplete |
| Error Lens | Inline TypeScript errors |
| GitLens | Enhanced git blame |
| Thunder Client | Test IPC via HTTP (for debugging) |
