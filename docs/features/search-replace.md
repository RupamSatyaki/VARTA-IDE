# Search & Replace

Varta's Find in Files feature searches across all files in your project with support for regex, case sensitivity, whole word matching, and streaming results. Replace All can update every match across the entire project in one operation.

## Opening Search

- **Keyboard:** `Ctrl+Shift+F`
- **Sidebar:** Click the magnifier icon
- **Command Palette:** `Ctrl+Shift+P` → `Find in Files`

## Search Options

| Option | Description | Default |
|---|---|---|
| Case Sensitive | Match exact case | Off |
| Whole Word | Match whole words only (word boundaries) | Off |
| Use Regex | Treat query as a regular expression | Off |
| Include Pattern | Glob pattern for files to include (e.g., `**/*.ts`) | All files |
| Exclude Pattern | Glob pattern for files to exclude | See below |

### Always-Excluded Directories

These directories are always excluded from search, regardless of settings:

```
node_modules
.git
dist
build
out
.next
coverage
__pycache__
```

Additional exclusions can be configured in Settings → `search.exclude`.

### Regex Search

When "Use Regex" is enabled, the query is treated as a JavaScript regular expression:

```
# Find all TODO comments
TODO:.*

# Find function declarations
function\s+\w+\s*\(

# Find import statements
^import\s+.*from\s+['"]

# Find console.log calls
console\.(log|warn|error)\(
```

Regex errors (invalid patterns) are shown inline in the search input.

## Streaming Results

Search results stream in as they are found — you don't wait for the entire search to complete before seeing results. This is implemented via the `SearchChannel.PROGRESS` push channel:

```
Renderer                    Main Process (SearchService)
   │                                │
   │  search.start(query, options)  │
   ├──────────────────────────────►│
   │                                │ reads files in batches of 20
   │                                │ setImmediate between batches
   │◄── PROGRESS (batch 1) ─────────┤
   │◄── PROGRESS (batch 2) ─────────┤
   │◄── PROGRESS (batch 3) ─────────┤
   │         ...                    │
   │◄── PROGRESS (done: true) ──────┤
```

Each `PROGRESS` event contains an array of `SearchResult` objects for the current batch. The renderer appends them to the results list as they arrive.

### Async Batched File Reading

The `SearchService` reads files in batches of 20 to avoid blocking the Node.js event loop:

```typescript
async search(rootPath: string, query: string, options: SearchOptions) {
  const files = await this.collectFiles(rootPath, options)
  
  for (let i = 0; i < files.length; i += BATCH_SIZE) {
    if (this.cancelled) break
    
    const batch = files.slice(i, i + BATCH_SIZE)
    const results = await this.searchBatch(batch, query, options)
    
    // Push results to renderer
    this.webContents.send(SearchChannel.PROGRESS, { results, done: false })
    
    // Yield to event loop between batches
    await new Promise(resolve => setImmediate(resolve))
  }
  
  this.webContents.send(SearchChannel.PROGRESS, { results: [], done: true })
}
```

`setImmediate` between batches ensures that IPC messages (terminal data, file watch events) are processed between search batches, keeping the app responsive during large searches.

## Cancelling a Search

Click the **×** button next to the search input, or start a new search, to cancel the current one. The `SearchChannel.CANCEL` invoke channel signals the `SearchService` to set its `cancelled` flag, which stops the batch loop.

## Navigating Results

Search results are grouped by file:

```
src/utils/helpers.ts (3 matches)
  Line 12: export function formatDate(date: Date) {
  Line 45: export function formatCurrency(amount: number) {
  Line 78: export function formatBytes(bytes: number) {

src/components/Header.tsx (1 match)
  Line 23: import { formatDate } from '../utils/helpers'
```

Click any result to:
1. Open the file in the editor (permanent tab)
2. Scroll to the matching line (`Monaco.revealLineInCenter`)
3. Select the matching text (`Monaco.setSelection`)

The editor highlights all matches in the file using Monaco's decoration API.

## Replace

### Single File Replace

Use Monaco's built-in `Ctrl+H` for find/replace within the current file.

### Replace All (Cross-File)

The Replace All feature replaces every match across all files in the project:

1. Enter your search query
2. Enter the replacement text in the Replace field
3. Click **Replace All** (or press `Ctrl+Alt+Enter`)
4. Confirm the dialog showing the number of files and matches affected

**Replace All flow:**

```
1. SearchChannel.REPLACE_ALL invoked with { query, replacement, options }
2. SearchService re-runs the search to get current matches
3. For each file with matches:
   a. Read current file content
   b. Apply all replacements (regex or string)
   c. Write updated content back to disk
4. For each file that was open in a tab:
   a. Reload the Monaco model with new content
   b. Mark tab as clean (saved)
5. Return { filesChanged, matchesReplaced }
```

Open tabs are reloaded automatically — you don't need to close and reopen them.

### Regex Replace with Capture Groups

When regex mode is enabled, you can use capture groups in the replacement:

```
Search:  (function\s+)(\w+)
Replace: $1renamed_$2
```

This uses JavaScript's `String.replace()` with the regex, so `$1`, `$2`, etc. reference capture groups.

## Result Count

The search panel shows:
- Total number of matches
- Number of files containing matches
- A warning if results were truncated (configurable via `search.maxResults`)

## Keyboard Shortcuts in Search Panel

| Shortcut | Action |
|---|---|
| `Enter` | Start search / go to next result |
| `Shift+Enter` | Go to previous result |
| `Escape` | Close search panel |
| `Ctrl+Shift+F` | Focus search input |
| `Alt+Enter` | Select all matches in editor |
| `Ctrl+Alt+Enter` | Replace All |

## Related

- [Editor](./editor.md) — Monaco find/replace within a single file
- [File Tree](./file-tree.md) — Search scoped to a folder (right-click → Find in Folder)
- [IPC Contract](../architecture/ipc-contract.md) — SearchChannel channels
- [Configuration](../getting-started/configuration.md) — search.exclude and search.maxResults settings

## Include / Exclude Patterns

Narrow your search to specific file types using glob patterns:

| Pattern | Matches |
|---|---|
| `**/*.ts` | All TypeScript files |
| `src/**/*.tsx` | TSX files under src/ |
| `!**/*.test.ts` | Exclude test files |
| `**/*.{js,ts}` | JS and TS files |

Enter include patterns in the "Files to include" field and exclude patterns in "Files to exclude" in the search panel.

## Performance Tips

For large projects (10,000+ files):

1. Use include patterns to narrow scope: `src/**/*.ts` instead of all files
2. Lower `search.maxResults` to 200 for faster display
3. Add large generated directories to `search.exclude`
4. Use whole-word matching when possible (faster than regex)
