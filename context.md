# VARTA IDE - Project Context

## Overview
VARTA IDE is a modern, cross-platform code editor built with Electron, React, and TypeScript. It aims to provide a fast, extensible, and user-friendly development environment.

## Core Technology Stack
- **Framework**: Electron (for desktop application shell)
- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **State Management**: Zustand (or similar, based on `src/renderer/store`)
- **Package Manager**: npm

## Project Structure Breakdown

### `src/main/`
Contains the Electron main process code.
- `index.ts`: Entry point for the main process.
- `ipc/`: Inter-Process Communication handlers.
- `menu/`: Application menu definitions.
- `services/`: Core services (e.g., file system, git).
- `window/`: Window management logic.

### `src/preload/`
Scripts that run in a privileged context to expose APIs to the renderer process.
- `index.ts`: Main preload script.
- `api/`: Specific API modules exposed via `contextBridge`.

### `src/renderer/`
The React application (UI).
- `App.tsx`: Root React component.
- `components/`: Reusable UI components.
- `hooks/`: Custom React hooks.
- `lib/`: Utility libraries.
- `store/`: State management stores.
- `assets/`: Static assets (images, fonts).

### `src/shared/`
Code shared between main and renderer processes.
- `constants/`: Shared constants.
- `types/`: TypeScript type definitions.
- `ipc.ts`: Shared IPC channel definitions.

## Key Features
- **Editor**: Code editing with syntax highlighting (likely Monaco or CodeMirror).
- **File Tree**: File system navigation.
- **Terminal**: Integrated terminal.
- **Git Integration**: Version control features.
- **Search & Replace**: Code search capabilities.
- **Settings**: User preferences and configuration.
- **Themes**: Customizable UI themes.
- **AI Integration**: AI-powered coding assistance (based on `docs/features/ai-integration.md`).

## Development Workflow
- **Start**: `npm run dev` (likely, check `package.json`)
- **Build**: `npm run build`
- **Test**: `npm test` (using Vitest)

## Documentation
Comprehensive documentation is available in the `docs/` directory, covering:
- Getting Started
- Architecture
- Feature Guides
- Deployment Instructions
- Contribution Guidelines

## Current Focus
Based on the file structure, the project is in active development with a focus on:
1.  Setting up the core Electron + React architecture.
2.  Implementing core IDE features (Editor, Terminal, Git).
3.  Establishing IPC communication patterns.
4.  Building out the UI component library.
