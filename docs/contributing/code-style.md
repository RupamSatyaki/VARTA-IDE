# Code Style

Varta enforces a consistent code style across the entire codebase. These rules are checked by ESLint and TypeScript — PRs that violate them will not be merged.

## TypeScript Rules

### No `any` Types

Never use `any`. Use `unknown` for truly unknown values and narrow with type guards.

```typescript
// WRONG
function processData(data: any) {
  return data.value
}

// RIGHT
function processData(data: unknown) {
  if (typeof data === 'object' && data !== null && 'value' in data) {
    return (data as { value: unknown }).value
  }
  throw new VartaError('INVALID_ARGUMENT', 'Expected object with value property')
}
```

For IPC handler arguments, always type as `unknown` and validate:

```typescript
// WRONG
ipcMain.handle(FileChannel.READ_FILE, async (_event, path: string) => { ... })

// RIGHT
ipcMain.handle(FileChannel.READ_FILE, async (_event, path: unknown) => {
  if (typeof path !== 'string') {
    return { success: false, error: { code: 'INVALID_ARGUMENT', message: 'path must be a string' } }
  }
  // ...
})
```

### Export Props Interface from Component Files

Every React component file must export its Props interface:

```typescript
// WRONG — props not exported
function MyComponent({ title, onClick }: { title: string; onClick: () => void }) { ... }

// RIGHT
export interface MyComponentProps {
  title: string
  onClick: () => void
}

export function MyComponent({ title, onClick }: MyComponentProps) { ... }
```

This makes it easy to compose components and pass props through.

### Every Async Function Must Have try/catch

```typescript
// WRONG
async function saveFile(path: string, content: string) {
  await window.varta.fs.writeFile(path, content)
}

// RIGHT
async function saveFile(path: string, content: string) {
  try {
    const result = await window.varta.fs.writeFile(path, content)
    if (!result.success) {
      throw new Error(result.error!.message)
    }
  } catch (err) {
    logger.error('saveFile failed', { path, err })
    throw err
  }
}
```

## IPC Rules

### All IPC Errors Must Be VartaError

In main process handlers, never return raw Node.js errors or plain Error objects:

```typescript
// WRONG
ipcMain.handle(FileChannel.READ_FILE, async (_event, path: string) => {
  try {
    return { success: true, data: await fs.readFile(path, 'utf-8') }
  } catch (err) {
    return { success: false, error: { message: (err as Error).message } }
  }
})

// RIGHT
ipcMain.handle(FileChannel.READ_FILE, async (_event, path: string) => {
  try {
    return { success: true, data: await fileService.readFile(path) }
  } catch (err) {
    return { success: false, error: VartaError.from(err).toPayload() }
  }
})
```

### No Magic Strings for IPC Channels

Always use the channel enums from `src/shared/ipc.ts`:

```typescript
// WRONG
ipcRenderer.invoke('file:read-file', path)

// RIGHT
ipcRenderer.invoke(FileChannel.READ_FILE, path)
```

### window.varta Is the ONLY Renderer→Main Path

The renderer must never access `ipcRenderer` directly. All IPC calls go through `window.varta.*`:

```typescript
// WRONG — accessing ipcRenderer directly
const { ipcRenderer } = window.require('electron')
ipcRenderer.invoke('file:read-file', path)

// RIGHT
window.varta.fs.readFile(path)
```

### AI API Key Is Set-Only, Never Returned

The AI API key must never be returned to the renderer. There is no `getApiKey` function:

```typescript
// WRONG — never implement this
export const aiApi = {
  getApiKey: (): Promise<IPCResponse<string>> =>
    ipcRenderer.invoke(AIChannel.GET_API_KEY),  // ← this channel must not exist
}

// RIGHT — only these two exist
export const aiApi = {
  setApiKey: (key: string): Promise<IPCResponse> =>
    ipcRenderer.invoke(AIChannel.SET_API_KEY, key),
  hasApiKey: (): Promise<IPCResponse<boolean>> =>
    ipcRenderer.invoke(AIChannel.HAS_API_KEY),
}
```

## Store Rules

### Stores Hold State Only — IPC in Hooks

Zustand stores must not call `window.varta.*` or any IPC functions. All IPC calls belong in hooks:

```typescript
// WRONG — IPC call inside a store action
const useFileStore = create<FileStore>((set) => ({
  content: '',
  loadFile: async (path: string) => {
    const result = await window.varta.fs.readFile(path)  // ← wrong
    set({ content: result.data })
  },
}))

// RIGHT — store holds state, hook calls IPC
const useFileStore = create<FileStore>((set) => ({
  content: '',
  setContent: (content: string) => set({ content }),
}))

// In a hook:
function useFileOperations() {
  const { setContent } = useFileStore()
  
  const loadFile = async (path: string) => {
    const result = await window.varta.fs.readFile(path)
    if (result.success) setContent(result.data!)
  }
  
  return { loadFile }
}
```

## Component Rules

### Components Must Be Under 200 Lines

If a component exceeds 200 lines, split it into smaller components. Large components are hard to review and test.

```typescript
// WRONG — 400-line component
export function GitPanel() {
  // ... 400 lines of JSX and logic
}

// RIGHT — split into focused components
export function GitPanel() {
  return (
    <div>
      <GitToolbar />
      <GitChanges />
      <GitStagedChanges />
      <GitCommitBox />
    </div>
  )
}
```

### Tailwind Only — No Inline Styles

Use Tailwind CSS classes for all styling. Never use inline `style` props:

```typescript
// WRONG
<div style={{ backgroundColor: '#1a1a2e', padding: '8px' }}>

// RIGHT
<div className="bg-[var(--bg-primary)] p-2">
```

For dynamic values that depend on theme variables, use CSS custom properties via Tailwind's arbitrary value syntax: `bg-[var(--bg-primary)]`.

### No console.log — Use logger

In the main process, always use the `logger` utility:

```typescript
// WRONG
console.log('File saved:', path)
console.error('Error:', err)

// RIGHT
import { logger } from '../utils/logger'
logger.info('File saved', { path })
logger.error('Save failed', { path, err: err.message })
```

In the renderer, use the notification system for user-facing messages and avoid logging entirely in production code.

## File Organization Rules

### One Component Per File

Each React component gets its own file. The filename matches the component name:

```
Button.tsx        → export function Button() {}
EditorTabs.tsx    → export function EditorTabs() {}
```

### Co-locate Types with Their Usage

Types used only in one file live in that file. Shared types live in `src/shared/types.ts`.

### Index Files for Re-exports Only

`index.ts` files should only re-export from sibling files. No logic in index files:

```typescript
// src/renderer/components/editor/index.ts
export { CodeCanvas } from './CodeCanvas'
export { EditorTabs } from './EditorTabs'
export { DiffEditor } from './DiffEditor'
```

## Naming Conventions

| Thing | Convention | Example |
|---|---|---|
| React components | PascalCase | `EditorTabs` |
| Hooks | camelCase with `use` prefix | `useFileOperations` |
| Stores | camelCase with `use` prefix | `useEditorStore` |
| Services | PascalCase with `Service` suffix | `FileService` |
| IPC handlers | camelCase with `register` prefix | `registerFileHandlers` |
| Constants | SCREAMING_SNAKE_CASE | `MAX_FILE_SIZE` |
| Types/Interfaces | PascalCase | `EditorTab`, `VartaSettings` |
| Enums | PascalCase | `FileChannel` |
| Enum values | SCREAMING_SNAKE_CASE | `FileChannel.READ_FILE` |
| CSS variables | kebab-case with `--` prefix | `--bg-primary` |

## Related

- [Setup](./setup.md) — Development environment setup
- [Commit Convention](./commit-convention.md) — Commit message format
- [Pull Request Guide](./pull-request-guide.md) — PR checklist
