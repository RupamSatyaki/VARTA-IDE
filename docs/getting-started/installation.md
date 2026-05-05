# Installation

Varta IDE is an Electron + React + TypeScript desktop code editor. This guide walks you through getting Varta running on your machine from source.

## System Requirements

Before cloning the repository, make sure your system meets these requirements.

| Requirement | Minimum Version | Notes |
|---|---|---|
| Node.js | 20.x LTS | Use nvm or fnm to manage versions |
| npm | 10.x | Comes with Node 20 |
| Git | 2.x | Required for git integration features |
| OS | Windows 10+, macOS 12+, Ubuntu 20.04+ | 64-bit only |

### Windows Additional Requirements

Varta uses `node-pty` for the integrated terminal, which requires native compilation on Windows.

1. Install **Visual Studio Build Tools 2022** (not the full VS IDE):
   - Download from [visualstudio.microsoft.com/downloads](https://visualstudio.microsoft.com/downloads/) → Tools for Visual Studio → Build Tools
   - During install, select **Desktop development with C++**
   - Required components: MSVC v143, Windows 10/11 SDK, CMake tools

2. Alternatively, install via npm (runs as Administrator):
   ```powershell
   npm install --global windows-build-tools
   ```

3. **Windows SDK** must be installed. It is included in the Build Tools workload above.

### macOS Additional Requirements

Install Xcode Command Line Tools:

```bash
xcode-select --install
```

Verify the installation:

```bash
xcode-select -p
# Should output: /Library/Developer/CommandLineTools
```

If you plan to build a distributable `.dmg`, you also need a full Xcode installation from the App Store.

### Linux Additional Requirements

Install the required build dependencies:

```bash
# Ubuntu / Debian
sudo apt-get update
sudo apt-get install -y build-essential libx11-dev libxkbfile-dev libsecret-1-dev

# Fedora / RHEL
sudo dnf install -y make gcc gcc-c++ libX11-devel libxkbfile-devel libsecret-devel

# Arch Linux
sudo pacman -S base-devel libx11 libxkbfile libsecret
```

## Cloning and Installing

```bash
# Clone the repository
git clone https://github.com/your-org/varta.git
cd varta

# Install all dependencies (this compiles node-pty natively)
npm install
```

The `npm install` step will automatically run `electron-rebuild` to compile native modules (`node-pty`) against the correct Electron headers. This may take 1–3 minutes on first run.

## Running in Development Mode

```bash
npm run dev
```

This starts:
- The **Vite** dev server for the renderer process (hot module replacement enabled)
- The **Electron** main process with file watching via `electron-vite`

The app window opens automatically. Changes to renderer code hot-reload instantly. Changes to main process code restart Electron.

## Verifying the Installation

Once the app opens, verify these features work:

1. **File tree** — Click "Open Folder" and select any directory
2. **Editor** — Open a file; Monaco editor should render with syntax highlighting
3. **Terminal** — Press `` Ctrl+` `` to open the integrated terminal
4. **Git panel** — Open a git repository; the source control panel should show status

## Common Errors and Fixes

### node-pty EBUSY on Windows

**Symptom:** `npm install` fails with `EBUSY: resource busy or locked` or `gyp ERR! build error`

**Causes and fixes:**

1. **Antivirus interference** — Windows Defender or third-party AV often locks `.node` files during compilation. Temporarily disable real-time protection during `npm install`, or add the project folder to the exclusion list.

2. **Insufficient permissions** — Run your terminal as Administrator:
   ```powershell
   # Right-click PowerShell → "Run as administrator"
   cd C:\path\to\varta
   npm install
   ```

3. **Another process holds the file** — Close all other terminals, VS Code instances, or Node processes that might be using the old `.node` binary:
   ```powershell
   # Kill all node processes
   taskkill /F /IM node.exe
   npm install
   ```

4. **Stale build artifacts** — Clean and reinstall:
   ```powershell
   Remove-Item -Recurse -Force node_modules
   npm install
   ```

### Monaco Worker Not Loading

**Symptom:** Editor opens but shows a blank white area, or the browser console shows `Failed to construct 'Worker'` errors.

**Cause:** The Vite config must set Monaco workers to use the `classic` format, not `module`.

Check `electron.vite.config.ts`:

```typescript
// electron.vite.config.ts
import { defineConfig } from 'electron-vite'
import monacoEditorPlugin from 'vite-plugin-monaco-editor'

export default defineConfig({
  renderer: {
    plugins: [
      monacoEditorPlugin({
        languageWorkers: ['editorWorkerService', 'typescript', 'json', 'css', 'html'],
      }),
    ],
    worker: {
      format: 'classic', // ← must be 'classic', not 'module'
    },
  },
})
```

### Electron Version Mismatch

**Symptom:** App crashes on startup with `The module was compiled against a different Node.js version` or `NODE_MODULE_VERSION mismatch`.

**Cause:** Native modules (like `node-pty`) were compiled against a different Electron version than what is currently installed.

**Fix:** Delete `node_modules` and reinstall from scratch:

```bash
rm -rf node_modules
npm install
```

On Windows:
```powershell
Remove-Item -Recurse -Force node_modules
npm install
```

### App Crashes Immediately on Startup

**Symptom:** Electron window flashes and closes, or never opens.

**Fix:** Delete the user data directory to clear corrupted settings:

- **Windows:** `%APPDATA%\varta`
- **macOS:** `~/Library/Application Support/varta`
- **Linux:** `~/.config/varta`

Then restart with `npm run dev`.

### npm install Hangs on electron Postinstall

**Symptom:** `npm install` stalls at `> electron@xx.x.x postinstall`.

**Cause:** Electron's binary download is slow or blocked by a firewall.

**Fix:** Set a mirror:
```bash
# China mirror
ELECTRON_MIRROR=https://npmmirror.com/mirrors/electron/ npm install

# Or use the official CDN explicitly
ELECTRON_MIRROR=https://github.com/electron/electron/releases/download/ npm install
```

## Next Steps

- [First Steps](./first-steps.md) — Open a folder and start editing
- [Configuration](./configuration.md) — Customize Varta to your workflow
- [Architecture Overview](../architecture/overview.md) — Understand how Varta is built
