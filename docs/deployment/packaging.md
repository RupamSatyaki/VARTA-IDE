# Packaging

Varta uses [electron-builder](https://www.electron.build/) to package the app into distributable installers for Windows, macOS, and Linux.

## Quick Start

Build for the current platform:

```bash
npm run build
```

Build for all platforms (requires macOS for cross-compilation):

```bash
npm run build:all
```

## Build Scripts

| Script | Description |
|---|---|
| `npm run build` | Build for current OS |
| `npm run build:all` | Build for Windows, macOS, and Linux |
| `npm run package:win` | Windows NSIS installer only |
| `npm run package:mac` | macOS DMG only |
| `npm run package:linux` | Linux AppImage only |

## electron-builder.yml Configuration

```yaml
# electron-builder.yml
appId: com.varta.ide
productName: Varta
copyright: Copyright © 2024 Varta Contributors

# Files to include in the app bundle
files:
  - out/**/*
  - node_modules/**/*
  - package.json

# Unpack node-pty from asar (native module must be on disk)
asarUnpack:
  - node_modules/node-pty/**/*

# Output directory
directories:
  output: dist
  buildResources: build

# Windows configuration
win:
  target:
    - target: nsis
      arch: [x64, arm64]
  icon: build/icon.ico
  artifactName: Varta-Setup-${version}-${arch}.exe

nsis:
  oneClick: false
  allowToChangeInstallationDirectory: true
  createDesktopShortcut: true
  createStartMenuShortcut: true
  shortcutName: Varta

# macOS configuration
mac:
  target:
    - target: dmg
      arch: [x64, arm64, universal]
  icon: build/icon.icns
  category: public.app-category.developer-tools
  artifactName: Varta-${version}-${arch}.dmg
  hardenedRuntime: true
  gatekeeperAssess: false
  entitlements: build/entitlements.mac.plist
  entitlementsInherit: build/entitlements.mac.plist

dmg:
  contents:
    - x: 130
      y: 220
    - x: 410
      y: 220
      type: link
      path: /Applications

# Linux configuration
linux:
  target:
    - target: AppImage
      arch: [x64, arm64]
    - target: deb
      arch: [x64]
    - target: rpm
      arch: [x64]
  icon: build/icons/
  category: Development
  artifactName: Varta-${version}-${arch}.AppImage
  maintainer: Varta Contributors
  description: A modern desktop code editor
```

### Key Configuration Explained

**`asarUnpack: node_modules/node-pty/**/*`**

`node-pty` is a native Node.js module (`.node` binary). Native modules cannot be loaded from inside an `.asar` archive — they must be on the real filesystem. `asarUnpack` extracts them to `app.asar.unpacked/` alongside the archive.

**`hardenedRuntime: true` (macOS)**

Required for macOS notarization. Enables the hardened runtime security model.

**`entitlements` (macOS)**

The entitlements file grants specific capabilities to the hardened runtime:

```xml
<!-- build/entitlements.mac.plist -->
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>com.apple.security.cs.allow-jit</key>
  <true/>
  <key>com.apple.security.cs.allow-unsigned-executable-memory</key>
  <true/>
  <key>com.apple.security.cs.disable-library-validation</key>
  <true/>
</dict>
</plist>
```

## Output Files

After a successful build, output files are in the `dist/` directory:

| Platform | File | Description |
|---|---|---|
| Windows x64 | `Varta-Setup-1.0.0-x64.exe` | NSIS installer |
| Windows arm64 | `Varta-Setup-1.0.0-arm64.exe` | NSIS installer |
| macOS x64 | `Varta-1.0.0-x64.dmg` | Intel DMG |
| macOS arm64 | `Varta-1.0.0-arm64.dmg` | Apple Silicon DMG |
| macOS universal | `Varta-1.0.0-universal.dmg` | Universal binary DMG |
| Linux x64 | `Varta-1.0.0-x64.AppImage` | AppImage |
| Linux x64 | `varta_1.0.0_amd64.deb` | Debian package |
| Linux x64 | `varta-1.0.0.x86_64.rpm` | RPM package |

## Version Bumping

Use npm's version command to bump the version in `package.json` and create a git tag:

```bash
# Patch release (1.0.0 → 1.0.1) — bug fixes
npm version patch

# Minor release (1.0.0 → 1.1.0) — new features, backward compatible
npm version minor

# Major release (1.0.0 → 2.0.0) — breaking changes
npm version major
```

This automatically:
1. Updates `version` in `package.json`
2. Creates a commit: `chore(release): 1.0.1`
3. Creates a git tag: `v1.0.1`

Push the commit and tag:

```bash
git push origin main
git push origin --tags
```

## GitHub Releases

After pushing a tag, the GitHub Actions release workflow:

1. Builds packages for all platforms
2. Creates a GitHub Release with the tag
3. Uploads all installer files as release assets
4. Generates a changelog from conventional commits since the last tag

The release workflow is defined in `.github/workflows/release.yml`.

### Manual Upload

To upload release assets manually:

```bash
# Install GitHub CLI
gh release create v1.0.1 \
  dist/Varta-Setup-1.0.1-x64.exe \
  dist/Varta-1.0.1-universal.dmg \
  dist/Varta-1.0.1-x64.AppImage \
  --title "Varta 1.0.1" \
  --notes "Bug fixes and performance improvements"
```

## Auto-Update

Varta uses `electron-updater` for automatic updates. When a new GitHub Release is published:

1. The running app checks for updates on startup and every 4 hours
2. If an update is available, `AppChannel.UPDATE_AVAILABLE` is pushed to the renderer
3. A notification appears with a "Restart to Update" button
4. The update downloads in the background
5. On restart, the new version is installed

For auto-update to work, releases must be published (not draft) on GitHub.

## Related

- [Windows Build](./windows-build.md) — Windows-specific build steps
- [macOS Build](./macos-build.md) — macOS signing and notarization
- [Linux Build](./linux-build.md) — Linux AppImage and package formats
