# File Tree

The file tree provides a hierarchical view of your project's directory structure. It supports keyboard navigation, git status badges, context menus, and real-time file system updates.

## Lazy Loading

The file tree uses **non-recursive, lazy loading**. When you open a folder, only the top-level contents are loaded. Child directories are loaded on demand when you expand them.

This approach keeps startup fast even for large projects (monorepos, projects with thousands of files). The tree never reads the entire directory tree upfront.

```
project/                ← loaded on open
├── src/                ← children loaded when expanded
│   ├── components/     ← children loaded when expanded
│   └── utils/
├── tests/
└── package.json
```

When a directory is expanded for the first time, Varta calls `FileChannel.READ_DIRECTORY` for that path and populates the children. Subsequent expansions use the cached result (invalidated by file watch events).

## Virtual List for Performance

The file tree uses a virtual list (windowed rendering) to handle projects with thousands of files. Only the visible rows are rendered in the DOM — off-screen items are not mounted.

This means the file tree stays responsive even when displaying 10,000+ files. The virtual list calculates item positions based on the flattened, visible tree nodes and renders only the viewport slice.

## Keyboard Navigation

The file tree supports full keyboard navigation:

| Key | Action |
|---|---|
| `↑` / `↓` | Move selection up/down |
| `→` | Expand folder / enter folder |
| `←` | Collapse folder / go to parent |
| `Enter` | Open file (permanent tab) |
| `Space` | Preview file (preview tab) |
| `F2` | Rename selected item |
| `Delete` | Delete selected item (with confirmation) |
| `Ctrl+C` | Copy file path |
| `Ctrl+X` | Cut (move) file |
| `Ctrl+V` | Paste file |
| `Escape` | Cancel rename / deselect |

Click to select, double-click to open as permanent tab.

## Git Status Badges

When the open folder is a git repository, the file tree shows status badges next to modified files:

| Badge | Color | Meaning |
|---|---|---|
| `M` | Yellow/Orange | Modified (unstaged changes) |
| `A` | Green | Added (new file, staged) |
| `D` | Red | Deleted |
| `R` | Blue | Renamed |
| `U` | Orange | Untracked (new file, not staged) |
| `C` | Purple | Copied |
| `!` | Gray | Ignored |

Badges propagate up the tree — if a file inside `src/components/` is modified, the `src/` and `src/components/` folders also show a badge, making it easy to spot changes in collapsed directories.

Git status is refreshed:
- On file save
- On git operations (stage, commit, checkout)
- Every 30 seconds (auto-refresh)
- When the file watcher detects changes in `.git/`

## File Icons

Files are displayed with icons based on their extension. The icon set covers common file types:

| Extension(s) | Icon |
|---|---|
| `.ts`, `.tsx` | TypeScript blue |
| `.js`, `.jsx`, `.mjs` | JavaScript yellow |
| `.json` | JSON orange |
| `.css`, `.scss`, `.less` | CSS blue |
| `.html` | HTML orange |
| `.md` | Markdown gray |
| `.py` | Python blue/yellow |
| `.rs` | Rust orange |
| `.go` | Go cyan |
| `.java` | Java red |
| `.rb` | Ruby red |
| `.sh`, `.bash` | Shell green |
| `.yml`, `.yaml` | YAML purple |
| `.toml` | TOML gray |
| `Dockerfile` | Docker blue |
| `.gitignore`, `.gitattributes` | Git orange |
| `.env`, `.env.*` | Lock icon |
| Folders | Folder icon (open when expanded) |
| Unknown | Generic file icon |

## Context Menu

Right-clicking a file or folder opens a context menu:

### File Context Menu

| Action | Description |
|---|---|
| Open | Open file in permanent tab |
| Open to the Side | Open in split editor |
| Rename | Inline rename (F2) |
| Delete | Delete with confirmation dialog |
| Copy | Copy file to clipboard |
| Cut | Cut file (move on paste) |
| Copy Path | Copy absolute path to clipboard |
| Copy Relative Path | Copy path relative to project root |
| Reveal in Finder/Explorer | Open containing folder in OS file manager |
| Stage Changes | Stage this file in git |
| Discard Changes | Discard working tree changes (with confirmation) |

### Folder Context Menu

| Action | Description |
|---|---|
| New File | Create a new file inside this folder |
| New Folder | Create a new subfolder |
| Rename | Rename the folder |
| Delete | Delete folder recursively (with confirmation) |
| Copy Path | Copy absolute path |
| Copy Relative Path | Copy relative path |
| Reveal in Finder/Explorer | Open in OS file manager |
| Find in Folder | Open search scoped to this folder |

### Empty Area Context Menu

Right-clicking the empty area below the tree:

| Action | Description |
|---|---|
| New File | Create file in project root |
| New Folder | Create folder in project root |
| Collapse All | Collapse all expanded folders |
| Refresh | Force refresh the entire tree |

## Inline Rename

Press `F2` or select "Rename" from the context menu to rename a file or folder inline:

1. The filename becomes an editable input field
2. The current name is pre-selected
3. Type the new name and press `Enter` to confirm
4. Press `Escape` to cancel

If the renamed file is open in a tab, the tab title and file path update automatically. The Monaco model is remapped to the new path.

## New File / New Folder Input

Clicking "New File" or "New Folder" shows an inline input field at the appropriate location in the tree:

```
src/
├── components/
│   ├── [new-file-name.tsx]  ← inline input
│   └── Button.tsx
└── utils/
```

Type the filename and press `Enter`. Press `Escape` to cancel. The new file is created via `FileChannel.CREATE_FILE` and the tree refreshes automatically.

## File Watcher Integration

The file tree stays in sync with the filesystem via `WatcherService` (chokidar):

- **File added** — New node appears in the tree
- **File deleted** — Node is removed; if the file was open in a tab, the tab shows a "file deleted" state
- **File renamed** — Node updates in place
- **Directory added/removed** — Parent node refreshes its children

Events are debounced by 100ms to avoid flooding the renderer during bulk operations like `git checkout` or `npm install`.

## Drag and Drop

Files and folders can be reordered by dragging:

1. Click and hold a file or folder
2. Drag to the target location (a folder or between items)
3. Release to drop

Dropping onto a folder moves the item inside that folder. Dropping between items moves it to that position within the parent folder. The operation calls `FileChannel.RENAME` (move) under the hood.

## Toolbar Actions

The file tree toolbar (above the tree) provides:

| Button | Action |
|---|---|
| New File | Create file in root |
| New Folder | Create folder in root |
| Refresh | Force refresh tree |
| Collapse All | Collapse all expanded folders |

## Related

- [Editor](./editor.md) — Tab management and preview tabs
- [Git Integration](./git-integration.md) — Git status badges
- [Search & Replace](./search-replace.md) — Search scoped to folder
- [Architecture Overview](../architecture/overview.md) — WatcherService and FileService
