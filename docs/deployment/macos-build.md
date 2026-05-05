# macOS Build

This guide covers building and packaging Varta for macOS, including DMG creation, code signing, notarization, and universal binary support.

## Prerequisites

### Xcode Command Line Tools

Required for native module compilation:

```bash
xcode-select --install
```

Verify:

```bash
xcode-select -p
# /Library/Developer/CommandLineTools
```

### Full Xcode (for Distribution)

For code signing and notarization, you need the full Xcode from the App Store, plus an Apple Developer account ($99/year).

```bash
# Verify Xcode is installed
xcodebuild -version
# Xcode 15.x
```

### Apple Developer Account

Required for:
- Code signing (prevents Gatekeeper warnings)
- Notarization (required for macOS 10.15+)

Enroll at [developer.apple.com](https://developer.apple.com/programs/).

## Building

### Development Build

```bash
npm install
npm run dev
```

### Production Package

```bash
npm run package:mac
```

This builds:
- `dist/Varta-{version}-x64.dmg` — Intel Mac
- `dist/Varta-{version}-arm64.dmg` — Apple Silicon
- `dist/Varta-{version}-universal.dmg` — Universal binary (both architectures)

## Universal Binary

The universal binary contains both x64 (Intel) and arm64 (Apple Silicon) code in a single app bundle. Users on either architecture get native performance.

```yaml
# electron-builder.yml
mac:
  target:
    - target: dmg
      arch: [x64, arm64, universal]
```

Building the universal binary requires running on macOS (cross-compilation from Windows/Linux is not supported for macOS targets).

## Code Signing

### Setting Up Certificates

1. In Xcode → Settings → Accounts → Add your Apple ID
2. Click "Manage Certificates" → "+" → "Developer ID Application"
3. The certificate is installed in your Keychain

Or create via command line:

```bash
# List available signing identities
security find-identity -v -p codesigning
# "Developer ID Application: Your Name (TEAM_ID)"
```

### Signing Configuration

```yaml
# electron-builder.yml
mac:
  identity: "Developer ID Application: Your Name (XXXXXXXXXX)"
  hardenedRuntime: true
  gatekeeperAssess: false
  entitlements: build/entitlements.mac.plist
  entitlementsInherit: build/entitlements.mac.plist
```

### Entitlements

The entitlements file grants capabilities to the hardened runtime:

```xml
<!-- build/entitlements.mac.plist -->
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <!-- Required for Electron's JIT compilation -->
  <key>com.apple.security.cs.allow-jit</key>
  <true/>
  <!-- Required for some Electron internals -->
  <key>com.apple.security.cs.allow-unsigned-executable-memory</key>
  <true/>
  <!-- Required for node-pty native module -->
  <key>com.apple.security.cs.disable-library-validation</key>
  <true/>
</dict>
</plist>
```

### Manual Signing

```bash
# Sign the app bundle
codesign --deep --force --verify --verbose \
  --sign "Developer ID Application: Your Name (TEAM_ID)" \
  --options runtime \
  --entitlements build/entitlements.mac.plist \
  dist/mac/Varta.app

# Verify the signature
codesign --verify --verbose dist/mac/Varta.app
spctl --assess --verbose dist/mac/Varta.app
```

## Notarization

Notarization is required for macOS 10.15+ (Catalina and later). Without it, Gatekeeper blocks the app with "cannot be opened because the developer cannot be verified."

### Using xcrun notarytool (Recommended)

```bash
# Submit for notarization
xcrun notarytool submit dist/Varta-1.0.0-universal.dmg \
  --apple-id "your@email.com" \
  --password "app-specific-password" \
  --team-id "XXXXXXXXXX" \
  --wait

# Staple the notarization ticket to the DMG
xcrun stapler staple dist/Varta-1.0.0-universal.dmg
```

### App-Specific Password

Generate an app-specific password at [appleid.apple.com](https://appleid.apple.com) → Security → App-Specific Passwords.

### Notarization via electron-builder

Configure in `electron-builder.yml`:

```yaml
afterSign: scripts/notarize.js
```

```javascript
// scripts/notarize.js
const { notarize } = require('@electron/notarize')

module.exports = async function notarizing(context) {
  const { electronPlatformName, appOutDir } = context
  if (electronPlatformName !== 'darwin') return

  const appName = context.packager.appInfo.productFilename

  return await notarize({
    tool: 'notarytool',
    appPath: `${appOutDir}/${appName}.app`,
    appleId: process.env.APPLE_ID,
    appleIdPassword: process.env.APPLE_APP_SPECIFIC_PASSWORD,
    teamId: process.env.APPLE_TEAM_ID,
  })
}
```

Set environment variables in CI:

```bash
export APPLE_ID="your@email.com"
export APPLE_APP_SPECIFIC_PASSWORD="xxxx-xxxx-xxxx-xxxx"
export APPLE_TEAM_ID="XXXXXXXXXX"
```

## DMG Configuration

```yaml
# electron-builder.yml
dmg:
  background: build/dmg-background.png  # 540x380 PNG
  icon: build/icon.icns
  iconSize: 80
  contents:
    - x: 130
      y: 220
    - x: 410
      y: 220
      type: link
      path: /Applications
  window:
    width: 540
    height: 380
```

## Common macOS Build Issues

### Gatekeeper Blocks the App

**Symptom:** "Varta cannot be opened because the developer cannot be verified"

**For development/testing:** Right-click the app → Open → Open (bypasses Gatekeeper once)

Or via terminal:
```bash
xattr -d com.apple.quarantine /Applications/Varta.app
```

**For distribution:** Sign and notarize the app (see above).

### Quarantine Attribute

Downloaded files get a quarantine attribute that triggers Gatekeeper. After notarization and stapling, the quarantine check passes. If users download via a non-standard method, they may need to remove the attribute:

```bash
xattr -d com.apple.quarantine ~/Downloads/Varta-1.0.0-universal.dmg
```

### node-pty Fails on Apple Silicon

**Symptom:** App crashes on M1/M2 Mac with "wrong architecture" error.

**Fix:** Ensure you're building the arm64 or universal target, not just x64:

```bash
npm run package:mac
# Builds x64, arm64, and universal
```

If developing on Apple Silicon, `npm install` compiles node-pty for arm64 automatically.

### Notarization Fails

**Symptom:** `xcrun notarytool` returns an error or the app is rejected.

Common causes:
1. **Missing entitlements** — Ensure `entitlements.mac.plist` is correct
2. **Hardened runtime not enabled** — Set `hardenedRuntime: true`
3. **Unsigned frameworks** — Use `--deep` flag with codesign
4. **Invalid certificate** — Ensure "Developer ID Application" cert (not "Apple Development")

Check the notarization log:
```bash
xcrun notarytool log SUBMISSION_ID \
  --apple-id "your@email.com" \
  --password "app-specific-password" \
  --team-id "XXXXXXXXXX"
```

## Testing the DMG

1. Mount the DMG: double-click `Varta-{version}-universal.dmg`
2. Drag Varta to Applications
3. Launch from Applications
4. Verify Gatekeeper allows it (no warning dialog)
5. Test all features
6. Unmount the DMG

## Related

- [Packaging](./packaging.md) — electron-builder configuration
- [Windows Build](./windows-build.md) — Windows NSIS installer
- [Linux Build](./linux-build.md) — Linux AppImage
