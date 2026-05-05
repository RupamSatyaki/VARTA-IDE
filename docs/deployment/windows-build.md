# Windows Build

This guide covers building and packaging Varta for Windows, including native module compilation, NSIS installer generation, and optional code signing.

## Prerequisites

### Visual Studio Build Tools

`node-pty` requires the MSVC compiler to build its native `.node` binary.

1. Download [Visual Studio Build Tools 2022](https://visualstudio.microsoft.com/downloads/) → Tools for Visual Studio → Build Tools
2. Run the installer and select **Desktop development with C++**
3. Ensure these components are checked:
   - MSVC v143 - VS 2022 C++ x64/x86 build tools
   - Windows 10/11 SDK (latest version)
   - CMake tools for Visual Studio

Verify the installation:

```powershell
# Should print the MSVC compiler version
cl.exe
```

### Windows SDK

The Windows SDK is included in the Build Tools workload above. If you need to install it separately:

```powershell
winget install Microsoft.WindowsSDK.10.0.22621
```

### Node.js and npm

Install Node.js 20 LTS from [nodejs.org](https://nodejs.org) or via winget:

```powershell
winget install OpenJS.NodeJS.LTS
```

## Building

### Development Build

```powershell
npm install
npm run dev
```

### Production Package

```powershell
npm run package:win
```

This runs:
1. `npm run build` — Vite builds the renderer and main process
2. `electron-builder --win` — Packages into NSIS installer

Output: `dist/Varta-Setup-{version}-x64.exe` and `dist/Varta-Setup-{version}-arm64.exe`

## NSIS Installer

The Windows installer is built with NSIS (Nullsoft Scriptable Install System). The installer:

- Supports per-user and per-machine installation
- Creates a Start Menu shortcut
- Creates a Desktop shortcut (optional, user choice)
- Adds Varta to the Windows "Add/Remove Programs" list
- Supports silent installation: `Varta-Setup-1.0.0-x64.exe /S`
- Supports custom install directory: `Varta-Setup-1.0.0-x64.exe /D=C:\MyApps\Varta`

### NSIS Configuration

```yaml
# electron-builder.yml
nsis:
  oneClick: false                        # Show installer UI
  allowToChangeInstallationDirectory: true
  createDesktopShortcut: true
  createStartMenuShortcut: true
  shortcutName: Varta
  installerIcon: build/icon.ico
  uninstallerIcon: build/icon.ico
  installerHeaderIcon: build/icon.ico
  deleteAppDataOnUninstall: false        # Keep user settings on uninstall
```

## Code Signing (Optional)

Code signing prevents Windows SmartScreen warnings ("Windows protected your PC"). It requires a code signing certificate from a trusted Certificate Authority.

### Obtaining a Certificate

Options:
- **DigiCert** — Most widely trusted, ~$500/year
- **Sectigo** — More affordable, ~$200/year
- **Self-signed** — Free, but triggers SmartScreen on other machines

### Signing with signtool.exe

```powershell
# Sign the installer after building
signtool.exe sign `
  /f "path\to\certificate.pfx" `
  /p "certificate-password" `
  /t "http://timestamp.digicert.com" `
  /fd sha256 `
  "dist\Varta-Setup-1.0.0-x64.exe"

# Verify the signature
signtool.exe verify /pa "dist\Varta-Setup-1.0.0-x64.exe"
```

### Signing via electron-builder

Configure signing in `electron-builder.yml`:

```yaml
win:
  certificateFile: path/to/certificate.pfx
  certificatePassword: ${env.CERTIFICATE_PASSWORD}
  signingHashAlgorithms: [sha256]
  timeStampServer: http://timestamp.digicert.com
```

Or use environment variables for CI:

```yaml
win:
  certificateSubjectName: "Your Company Name"
```

With `CSC_LINK` (base64-encoded .pfx) and `CSC_KEY_PASSWORD` environment variables set.

## Common Windows Build Issues

### node-pty Compilation Fails

**Symptom:** `gyp ERR! build error` during `npm install`

**Fix:**
1. Run PowerShell as Administrator
2. Ensure VS Build Tools are installed with C++ workload
3. Delete `node_modules` and reinstall:
   ```powershell
   Remove-Item -Recurse -Force node_modules
   npm install
   ```

### EBUSY: Resource Busy or Locked

**Symptom:** `EBUSY: resource busy or locked, rename '...\node-pty.node'`

**Fix:**
1. Close all other Node.js processes: `taskkill /F /IM node.exe`
2. Close any other Varta instances
3. Temporarily disable Windows Defender real-time protection
4. Retry `npm install`

### Antivirus Interference

Windows Defender and third-party AV frequently flag Electron apps during build. Add the project directory and `dist/` to your AV exclusion list:

```powershell
# Add exclusion in Windows Defender
Add-MpPreference -ExclusionPath "C:\path\to\varta"
Add-MpPreference -ExclusionPath "C:\path\to\varta\dist"
```

### Missing Windows SDK

**Symptom:** `error MSB8036: The Windows SDK version X was not found`

**Fix:** Install the Windows SDK version matching your Build Tools:

```powershell
winget install Microsoft.WindowsSDK.10.0.22621
```

Or reinstall VS Build Tools and ensure the SDK component is checked.

### Installer Blocked by SmartScreen

**Symptom:** Windows shows "Windows protected your PC" when running the installer.

**Cause:** The installer is not code-signed, or signed with an untrusted certificate.

**Fix for development:** Click "More info" → "Run anyway"

**Fix for distribution:** Sign with a trusted certificate (see [Code Signing](#code-signing-optional)).

## Testing the Installer

After building, test the installer on a clean Windows machine or VM:

1. Run `Varta-Setup-{version}-x64.exe`
2. Verify the installer UI appears correctly
3. Complete the installation
4. Launch Varta from the Start Menu shortcut
5. Verify the app opens and all features work
6. Test the uninstaller via Add/Remove Programs

## Related

- [Packaging](./packaging.md) — electron-builder configuration
- [macOS Build](./macos-build.md) — macOS DMG and notarization
- [Linux Build](./linux-build.md) — Linux AppImage
- [Installation](../getting-started/installation.md) — node-pty build requirements
