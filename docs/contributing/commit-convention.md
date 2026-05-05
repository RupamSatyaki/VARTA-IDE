# Commit Convention

Varta uses [Conventional Commits](https://www.conventionalcommits.org/) for all commit messages. This enables automatic changelog generation and makes the git history easy to navigate.

## Format

```
<type>(<scope>): <subject>

[optional body]

[optional footer(s)]
```

The subject line must be 72 characters or fewer. Use the imperative mood: "add feature" not "added feature" or "adds feature".

## Types

| Type | When to Use |
|---|---|
| `feat` | A new feature visible to users |
| `fix` | A bug fix |
| `docs` | Documentation changes only |
| `style` | Code style changes (formatting, whitespace) — no logic change |
| `refactor` | Code restructuring — no feature change, no bug fix |
| `test` | Adding or updating tests |
| `chore` | Build process, dependency updates, tooling |
| `perf` | Performance improvements |
| `ci` | CI/CD configuration changes |
| `revert` | Reverting a previous commit |

## Scopes

Scopes identify which part of the codebase was changed:

| Scope | Area |
|---|---|
| `editor` | Monaco editor, tabs, models |
| `terminal` | Terminal, PTY, xterm.js |
| `git` | Git panel, GitService |
| `search` | Search panel, SearchService |
| `ai` | AI chat, inline hints, AIService |
| `settings` | Settings UI, SettingsService |
| `ipc` | IPC channels, handlers, preload |
| `ui` | General UI components, layout |
| `filetree` | File tree component |
| `themes` | Theme system |
| `keybindings` | Keyboard shortcuts |
| `docs` | Documentation |
| `build` | Build configuration, electron-builder |
| `deps` | Dependency updates |
| `security` | Security-related changes |

Scope is optional but strongly recommended. Omit it only for changes that span multiple areas.

## Examples

### Feature additions

```
feat(ai): add inline ghost text suggestions

Implement AI-powered inline completions using claude-haiku-3-5.
Suggestions trigger after 600ms of idle time and are accepted with Tab.

Closes #142
```

```
feat(git): add AI commit message generation

Add "Generate" button to commit message field that calls AIService
to generate a conventional commit message from the staged diff.
```

```
feat(terminal): support multiple terminal tabs

Allow opening multiple PTY sessions simultaneously. Each session
has a unique ID and is managed by TerminalService.
```

### Bug fixes

```
fix(editor): restore cursor position on tab switch

View state was not being saved before switching tabs, causing
the cursor to jump to line 1 on every tab switch.

Fixes #89
```

```
fix(search): prevent hang on projects with symlinks

SearchService was following symlinks into infinite loops.
Added followSymlinks: false to the chokidar glob options.

Fixes #201
```

```
fix(terminal): handle PTY exit on Windows correctly

node-pty on Windows emits 'exit' with undefined exit code.
Added null check before logging the exit code.
```

### Documentation

```
docs(api): add window.varta API reference

Document all 78 functions across 10 namespaces with signatures,
return types, and usage examples.
```

```
docs: add FAQ for common installation issues

Cover node-pty compile failures, Monaco blank screen,
and Electron version mismatch errors.
```

### Refactoring

```
refactor(ipc): extract handler registration into separate files

Split the monolithic ipc/index.ts into per-domain handler files
(fileHandlers.ts, gitHandlers.ts, etc.) for better organization.
```

### Chores

```
chore(deps): update electron to 32.0.0

Also updates electron-builder and electron-vite to compatible versions.
```

```
chore(build): add GitHub Actions workflow for releases

Builds Windows, macOS, and Linux packages on tag push and
uploads artifacts to GitHub Releases.
```

### Performance

```
perf(filetree): use virtual list for large directories

Replace flat rendering with react-window VirtualList.
Reduces DOM nodes from O(n) to O(viewport) for large projects.
```

## Breaking Changes

Breaking changes must be indicated in the footer with `BREAKING CHANGE:`:

```
feat(ipc): rename FileChannel enum values to use kebab-case

BREAKING CHANGE: All FileChannel enum values have been renamed.
FileChannel.READ_FILE is now 'file:read-file' (was 'file/readFile').
Update any code that references channel string values directly.
```

Or with a `!` after the type/scope:

```
feat(settings)!: change settings file format to JSON5

BREAKING CHANGE: Settings file is now JSON5 format.
Existing varta-settings.json files must be migrated.
```

## PR Title Format

Pull request titles follow the same format as commit messages. The PR title becomes the squash commit message when merged:

```
feat(ai): add streaming response support
fix(terminal): handle resize on Windows
docs: add architecture overview
chore(deps): update to Electron 32
```

Keep PR titles under 72 characters.

## Multi-line Commit Bodies

Use the body to explain **why** a change was made, not what (the diff shows what):

```
fix(search): debounce file watch events during search

Previously, a git checkout during an active search would flood the
renderer with hundreds of WATCH_EVENT messages, causing the search
results to flicker and the UI to freeze.

Added a 100ms debounce to WatcherService.emit() to batch rapid
file system events into a single update.

Fixes #178
```

## Commit Footers

| Footer | Usage |
|---|---|
| `Fixes #N` | Closes a GitHub issue when merged |
| `Closes #N` | Same as Fixes |
| `Refs #N` | References an issue without closing it |
| `Co-authored-by: Name <email>` | Credit a co-author |
| `BREAKING CHANGE: description` | Document a breaking change |

## Related

- [Pull Request Guide](./pull-request-guide.md) — PR process and checklist
- [Code Style](./code-style.md) — Code formatting rules
- [Setup](./setup.md) — Development environment
