# Pull Request Guide

This guide covers the PR process for contributing to Varta — from opening a PR to getting it merged.

## Before Opening a PR

Run through this checklist before pushing your branch:

### Required Checks

- [ ] `npm run typecheck` passes with zero errors
- [ ] `npm run lint` passes with zero errors
- [ ] `npm run dev` starts the app without errors
- [ ] The feature/fix works as expected (manual testing)
- [ ] No `console.log` statements in production code (use `logger`)
- [ ] No `any` types introduced
- [ ] All new async functions have `try/catch`
- [ ] Commit messages follow [Conventional Commits](./commit-convention.md)

### Platform Testing

If your change touches platform-specific code (terminal, file paths, native dialogs, packaging), test on the affected platforms:

- [ ] Tested on Windows (if applicable)
- [ ] Tested on macOS (if applicable)
- [ ] Tested on Linux (if applicable)

For most UI and logic changes, testing on your development platform is sufficient.

### IPC Changes

If you added or modified IPC channels:

- [ ] Channel added to `src/shared/ipc.ts` enum
- [ ] Handler added in `src/main/ipc/`
- [ ] Wrapper added in `src/preload/api/`
- [ ] Type added to `src/preload/varta.d.ts`
- [ ] Documented in [IPC Channels](../api/ipc-channels.md)

### New Settings

If you added a new setting:

- [ ] Added to `VartaSettings` type in `src/shared/types.ts`
- [ ] Added default value in `SettingsService`
- [ ] Added to Settings UI
- [ ] Documented in [Settings](../features/settings.md)

## PR Description Template

Use this template when opening a PR:

```markdown
## What Changed

Brief description of what this PR does.

## Why

Explain the motivation. Link to the issue if applicable.

Fixes #123

## How to Test

Step-by-step instructions for reviewers to verify the change:

1. Open a folder with TypeScript files
2. Press Ctrl+Shift+A to open AI chat
3. Type "explain this file" and press Enter
4. Verify that the response streams in correctly

## Screenshots

(Include before/after screenshots for UI changes)

## Notes

Any additional context, trade-offs, or follow-up work.
```

## PR Size Guidelines

Keep PRs focused and reviewable:

| PR Size | Lines Changed | Review Time |
|---|---|---|
| Small | < 100 lines | < 30 minutes |
| Medium | 100–400 lines | 1–2 hours |
| Large | 400–1000 lines | Half day |
| Extra Large | > 1000 lines | Needs splitting |

If your PR is over 1000 lines, consider splitting it into smaller, independently mergeable PRs. A common pattern:

1. PR 1: Add the IPC channel and service method (no UI)
2. PR 2: Add the UI component that uses the new channel
3. PR 3: Add tests and documentation

## Branch Naming

Use descriptive branch names following this pattern:

```
<type>/<short-description>

feat/ai-inline-hints
fix/terminal-resize-windows
docs/architecture-overview
refactor/ipc-handler-split
chore/update-electron-32
```

## Review Process

1. **Open the PR** — Fill out the description template, add relevant labels
2. **CI checks run** — TypeScript, ESLint, and build checks must pass
3. **Reviewer assigned** — A maintainer reviews within 2 business days
4. **Address feedback** — Push additional commits to the same branch
5. **Approval** — One maintainer approval required for merge
6. **Squash and merge** — PRs are squash-merged; the PR title becomes the commit message

## Responding to Review Comments

- Address every comment, even if just to say "acknowledged" or "won't fix because..."
- Push fixes as new commits (don't amend during review — it makes re-review harder)
- Resolve conversations after addressing them
- Request re-review after pushing significant changes

## Common Review Feedback

These are the most common issues caught in review. Check for them before opening your PR:

**"Use VartaError instead of raw Error"**
```typescript
// Before
throw new Error('File not found')

// After
throw new VartaError('FILE_NOT_FOUND', `File not found: ${path}`)
```

**"Store should not call IPC"**
```typescript
// Before — IPC in store action
const store = create((set) => ({
  load: async () => {
    const result = await window.varta.fs.readFile(path)  // wrong
    set({ content: result.data })
  }
}))

// After — IPC in hook, store holds state
```

**"Component is too large"**
If a component exceeds 200 lines, split it. See [Code Style](./code-style.md#components-must-be-under-200-lines).

**"Missing try/catch"**
Every async function needs error handling. See [Code Style](./code-style.md#every-async-function-must-have-trycatch).

**"No inline styles"**
Use Tailwind classes. See [Code Style](./code-style.md#tailwind-only--no-inline-styles).

## Draft PRs

Open a draft PR early if you want feedback on the approach before the implementation is complete. Mark it as "Ready for Review" when it's done.

Draft PRs are useful for:
- Large features where you want architecture feedback early
- Changes that depend on another in-progress PR
- Work in progress that you want to share for discussion

## Hotfix Process

For critical bugs that need to go out quickly:

1. Branch from `main`: `git checkout -b fix/critical-bug-description`
2. Make the minimal fix
3. Open a PR with `[HOTFIX]` in the title
4. Request expedited review in the PR description
5. After merge, tag a patch release: `npm version patch && git push --tags`

## Related

- [Setup](./setup.md) — Development environment
- [Code Style](./code-style.md) — Coding standards
- [Commit Convention](./commit-convention.md) — Commit message format

## Keeping Your Branch Up to Date

Rebase your branch on `main` before opening a PR and before merging:

```bash
git fetch upstream
git rebase upstream/main
```

Resolve any conflicts, then force-push your branch:

```bash
git push --force-with-lease origin feat/my-feature
```

Use `--force-with-lease` instead of `--force` — it fails if someone else pushed to your branch, preventing accidental overwrites.

## After Your PR Is Merged

```bash
# Switch back to main
git checkout main

# Pull the latest (includes your squashed commit)
git pull upstream main

# Delete your feature branch
git branch -d feat/my-feature
git push origin --delete feat/my-feature
```
