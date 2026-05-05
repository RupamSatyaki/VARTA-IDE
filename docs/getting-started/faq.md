# FAQ

Answers to the most common questions and problems encountered when installing, running, and using Varta IDE.

## Installation

### node-pty fails to compile on Windows

**Q: `npm install` fails with `gyp ERR! build error` or `EBUSY: resource busy or locked` on Windows.**

A: This is the most common Windows setup issue. Work through these steps in order:

1. **Install Visual Studio Build Tools** — node-pty requires the MSVC compiler. Download [VS Build Tools 2022](https://visualstudio.microsoft.com/downloads/) and select the "Desktop development with C++" workload.

2. **Run as Administrator** — Right-click your terminal and choose "Run as administrator", then retry `npm install`.

3. **Disable antivirus real-time protection** — Windows Defender and third-party AV frequently lock `.node` files during compilation. Add the project folder to your AV exclusion list, or temporarily disable real-time protection.

4. **Kill competing Node processes** — Run `taskkill /F /IM node.exe` in an admin terminal, then retry.

5. **Clean install** — Delete `node_modules` and `package-lock.json`, then run `npm install` again.

See [Installation](./installation.md#node-pty-ebusy-on-windows) for the full troubleshooting guide.

---

### Monaco editor shows a blank white screen

**Q: The editor area is blank or white after opening a file. The console shows Worker errors.**

A: The Vite worker format must be set to `classic`. Check `electron.vite.config.ts`:

```typescript
renderer: {
  worker: {
    format: 'classic', // must NOT be 'module'
  },
}
```

If the config is correct, try clearing Vite's cache:

```bash
rm -rf node_modules/.vite
npm run dev
```

---

### App crashes immediately on startup

**Q: The Electron window opens briefly and then closes, or never opens at all.**

A: The most common cause is a corrupted settings file or user data directory. Delete it:

- **Windows:** `%APPDATA%\varta`
- **macOS:** `~/Library/Application Support/varta`
- **Linux:** `~/.config/varta`

Then run `npm run dev` again. Varta will recreate the directory with defaults.

If the crash persists, run with verbose logging:

```bash
ELECTRON_ENABLE_LOGGING=1 npm run dev
```

Check the terminal output for the specific error.

---

### Electron version mismatch error

**Q: App crashes with "The module was compiled against a different Node.js version" or "NODE_MODULE_VERSION mismatch".**

A: Native modules (node-pty) were compiled for a different Electron version. Fix:

```bash
rm -rf node_modules
npm install
```

On Windows: `Remove-Item -Recurse -Force node_modules` then `npm install`.

---

## Editor

### AI inline hints are not appearing

**Q: I set my API key but no ghost text suggestions appear while I type.**

A: Check these in order:

1. **API key is set** — Open Settings (`Ctrl+,`) → AI section. The key field should show a masked value, not be empty.
2. **Inline hints are enabled** — Settings → AI → "Enable inline hints" must be checked.
3. **Wait for the delay** — Hints trigger after 600ms of idle time. Stop typing and wait.
4. **File must be open** — Hints only appear in the active editor, not in the terminal or panels.
5. **Check the network** — Open DevTools (`Ctrl+Shift+I`) → Network tab. Look for failed requests to `api.anthropic.com`.
6. **API key validity** — Test your key with a curl command:
   ```bash
   curl https://api.anthropic.com/v1/messages \
     -H "x-api-key: YOUR_KEY" \
     -H "anthropic-version: 2023-06-01" \
     -H "content-type: application/json" \
     -d '{"model":"claude-haiku-3-5","max_tokens":10,"messages":[{"role":"user","content":"hi"}]}'
   ```

---

### Terminal shows no output / appears frozen

**Q: I open the terminal and type commands but nothing happens. The cursor blinks but there's no response.**

A: This is usually a node-pty or shell detection issue.

1. **Check the shell path** — Open Settings → Terminal → Shell. If it's set to a path that doesn't exist, clear it to let Varta auto-detect.
2. **Restart the terminal** — Click the trash icon in the terminal toolbar to kill the current session, then click **+** to open a new one.
3. **Check node-pty** — Open DevTools (`Ctrl+Shift+I`) → Console. Look for errors mentioning `node-pty` or `pty.node`.
4. **Windows: use PowerShell** — If using cmd.exe, try switching to PowerShell in Settings → Terminal → Shell: `C:\Windows\System32\WindowsPowerShell\v1.0\powershell.exe`

---

### Terminal output is garbled / shows escape codes

**Q: The terminal shows raw ANSI escape sequences like `^[[32m` instead of colors.**

A: Your shell's `$TERM` variable may not be set correctly. Add this to your shell profile:

```bash
# ~/.bashrc or ~/.zshrc
export TERM=xterm-256color
```

---

## Git

### Git panel shows "Not a git repository"

**Q: I opened a folder but the Source Control panel says "Not a git repository".**

A: The opened folder must be the root of a git repository (contains a `.git` directory), or a subdirectory of one.

1. **Initialize a repo** — Open the terminal and run `git init` in your project folder.
2. **Check the folder** — Make sure you opened the correct folder. The file tree title shows the current root.
3. **Nested repos** — If your folder contains a git repo in a subdirectory, open that subdirectory directly.

---

### Push fails with "no upstream branch"

**Q: Clicking Push shows an error about no upstream branch.**

A: Your local branch has no remote tracking branch. Run in the terminal:

```bash
git push --set-upstream origin YOUR_BRANCH_NAME
```

Or use the branch picker in the Git panel to set the upstream.

---

## Search

### Search hangs or is very slow on large projects

**Q: Find in Files (`Ctrl+Shift+F`) takes a very long time or freezes on large projects.**

A: Varta's search excludes common large directories by default (`node_modules`, `dist`, `.git`, etc.), but your project may have other large generated directories.

Add them to the exclude list in Settings → Search → Exclude:

```json
{
  "search.exclude": [
    "node_modules", ".git", "dist", "build", "out",
    ".next", "coverage", "__pycache__",
    "vendor",        // PHP/Go vendor directories
    ".gradle",       // Java/Kotlin build cache
    "target",        // Rust/Java build output
    "*.min.js"       // Minified files
  ]
}
```

Also check `search.maxResults` — lowering it from 1000 to 200 speeds up display significantly.

---

## Performance

### Varta is slow to open large files

**Q: Opening files over 1MB causes the editor to lag or freeze.**

A: Monaco editor handles large files well, but very large files (5MB+) can be slow. Consider:

1. **Disable minimap** — Settings → `editor.minimap: false`
2. **Disable bracket pair colorization** — Settings → `editor.bracketPairColorization: false`
3. **Disable word wrap** — Settings → `editor.wordWrap: "off"`

For log files and other non-code large files, consider opening them in a dedicated log viewer.

---

### High memory usage

**Q: Varta is using 500MB+ of RAM.**

A: Electron apps use more memory than native apps. Typical usage:

- Idle with no files open: ~150MB
- With 10 files open: ~250MB
- With terminal + git panel active: ~350MB

If usage exceeds 600MB, check:
1. How many files are open (each Monaco model holds the file in memory)
2. Whether the terminal has a very large scrollback buffer (reduce `terminal.scrollback`)
3. Whether search results are accumulating (close the search panel)

---

## Updates

### How do I update Varta?

**Q: How do I get the latest version?**

A: Pull the latest changes and reinstall:

```bash
git pull origin main
npm install
npm run dev
```

If native modules changed (check the changelog), do a clean install:

```bash
git pull origin main
rm -rf node_modules
npm install
npm run dev
```

---

## Related

- [Installation](./installation.md) — Full setup guide with all prerequisites
- [First Steps](./first-steps.md) — Getting started with the editor
- [Configuration](./configuration.md) — All settings reference
- [Architecture Overview](../architecture/overview.md) — How Varta works internally
