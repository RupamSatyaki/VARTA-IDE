# Git Integration

Varta's built-in source control panel provides a full git workflow without leaving the editor. It wraps the `simple-git` library in `GitService` and exposes all common operations through a clean UI.

## Opening the Git Panel

- **Keyboard:** `Ctrl+Shift+G`
- **Sidebar:** Click the branch icon
- **Status bar:** Click the branch name in the bottom-left

## Status Badges

Files with git changes are marked with colored badges in both the file tree and the git panel:

| Badge | Color | Meaning |
|---|---|---|
| `M` | Yellow | Modified — file has unstaged changes |
| `A` | Green | Added — new file, staged |
| `D` | Red | Deleted — file deleted |
| `R` | Blue | Renamed — file was renamed |
| `U` | Orange | Untracked — new file, not yet staged |
| `C` | Purple | Copied |
| `MM` | Yellow | Modified in both index and working tree |
| `?` | Gray | Ignored (shown only if configured) |

Badges propagate up the directory tree — parent folders show a badge if any child has changes.

## Stage / Unstage / Discard Workflow

### Staging Files

**Stage a single file:**
- Click the `+` icon next to the file in the "Changes" section
- Right-click the file → Stage Changes
- Right-click the file in the file tree → Stage Changes

**Stage all changes:**
- Click the `+` icon in the "Changes" section header

**Stage a hunk (partial staging):**
- Click the file to open the diff viewer
- Select lines in the diff and right-click → Stage Selected Lines

### Unstaging Files

**Unstage a single file:**
- Click the `-` icon next to the file in the "Staged Changes" section
- Right-click → Unstage Changes

**Unstage all:**
- Click the `-` icon in the "Staged Changes" section header

### Discarding Changes

**Discard a single file:**
- Click the discard icon (↩) next to the file
- Right-click → Discard Changes

A confirmation dialog appears before discarding (configurable via `git.confirmBeforeDiscard`). Discarding is irreversible — the working tree changes are lost.

## Committing

1. Stage the files you want to commit
2. Type your commit message in the text area at the top of the git panel
3. Press `Ctrl+Enter` (or click the **Commit** button)

The commit message field supports multi-line messages. The first line is the subject; subsequent lines (after a blank line) are the body.

### AI Commit Message Generation

Click the **✨ Generate** button above the commit message field to generate a commit message from your staged diff using AI:

1. Varta sends the staged diff to `AIService.generateCommitMessage(diff)`
2. The AI analyzes the changes and generates a conventional commit message
3. The message is inserted into the commit message field
4. You can edit it before committing

This requires an AI API key to be set. See [AI Integration](./ai-integration.md).

## Push / Pull / Fetch

### Push

Click the **Push** button in the git toolbar, or use `Ctrl+Shift+P` → `Git: Push`.

**Common push errors and their messages:**

| Error | Varta Message | Fix |
|---|---|---|
| No upstream branch | "Branch has no upstream. Set upstream with: git push --set-upstream origin BRANCH" | Run the suggested command in terminal |
| Authentication failed | "Push failed: authentication required. Check your git credentials." | Set up SSH keys or credential manager |
| Remote rejected | "Push rejected: remote contains work you don't have locally. Pull first." | Pull, resolve conflicts, then push |
| Network error | "Push failed: could not connect to remote. Check your network." | Check internet connection |

### Pull

Click the **Pull** button, or `Ctrl+Shift+P` → `Git: Pull`.

If there are local uncommitted changes that conflict with the pull, Varta shows an error and suggests stashing first.

### Fetch

Click the **Fetch** button to fetch from all remotes without merging. The branch picker updates to show remote branches after a fetch.

**Auto-fetch:** When `git.autofetch` is enabled (default: true), Varta fetches every `git.autofetchInterval` seconds (default: 180). The fetch happens silently in the background.

## Branch Management

### Branch Picker

Click the branch name in the status bar or the git panel toolbar to open the branch picker.

The branch picker shows:
- Current branch (highlighted)
- Local branches
- Remote branches (after fetch)
- Option to create a new branch

### Checkout a Branch

Click any branch in the picker to check it out. If you have uncommitted changes, Varta warns you before switching.

### Create a Branch

1. Open the branch picker
2. Type a new branch name in the search field
3. Click **Create branch: [name]**

The new branch is created from the current HEAD and checked out immediately.

### Delete a Branch

Right-click a branch in the picker → Delete Branch. You cannot delete the currently checked-out branch.

## Diff Viewer

Click any modified file in the git panel to open the diff viewer. Varta uses Monaco's built-in `DiffEditor` component:

- **Left side:** Original (HEAD or index)
- **Right side:** Current working tree (or staged version)
- Inline diff highlighting
- Navigate between changes with `F7` / `Shift+F7`

The diff viewer is read-only — edit the file in the main editor, not the diff view.

## Auto-Refresh

Git status is automatically refreshed:

| Trigger | Action |
|---|---|
| File save | Refresh status for the saved file |
| Git operation (stage, commit, etc.) | Full status refresh |
| File watch event in `.git/` | Full status refresh |
| Every 30 seconds | Full status refresh |
| Branch checkout | Full status refresh + branch update |

## Non-Git Folder Handling

When you open a folder that is not a git repository:

- The git panel shows "Not a git repository"
- An **Initialize Repository** button is shown
- Clicking it runs `git init` in the project root
- The panel refreshes and shows the initial untracked files

Git status badges do not appear in the file tree for non-git folders.

## Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `Ctrl+Shift+G` | Focus git panel |
| `Ctrl+Enter` | Commit (when commit message field is focused) |
| `Ctrl+Shift+P` → `Git: Push` | Push |
| `Ctrl+Shift+P` → `Git: Pull` | Pull |
| `Ctrl+Shift+P` → `Git: Fetch` | Fetch |
| `Ctrl+Shift+P` → `Git: Stage All` | Stage all changes |
| `Ctrl+Shift+P` → `Git: Discard All` | Discard all changes |

## Related

- [File Tree](./file-tree.md) — Git status badges in the tree
- [AI Integration](./ai-integration.md) — AI commit message generation
- [IPC Contract](../architecture/ipc-contract.md) — GitChannel (21 channels)
- [Main Process](../architecture/main-process.md) — GitService implementation

## Git Log

The git panel shows a compact commit history at the bottom:

- Commit hash (short, 7 characters)
- Commit message (first line)
- Author name
- Relative time (e.g., "2 hours ago")

Click any commit to see its full diff in the diff viewer.

## Stash Support

Stash operations are available via the Command Palette:

| Command | Description |
|---|---|
| `Git: Stash Changes` | Stash all working tree changes |
| `Git: Stash Pop` | Apply and remove the latest stash |
| `Git: Stash List` | Show all stashes |

## Related

- [File Tree](./file-tree.md) — Git status badges in the tree
- [AI Integration](./ai-integration.md) — AI commit message generation
- [IPC Contract](../architecture/ipc-contract.md) — GitChannel (21 channels)
- [Main Process](../architecture/main-process.md) — GitService implementation
