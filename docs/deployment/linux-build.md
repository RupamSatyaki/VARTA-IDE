# Linux Build

This guide covers building and packaging Varta for Linux, including AppImage, .deb, and .rpm formats.

## Prerequisites

Install the required build dependencies:

```bash
# Ubuntu / Debian
sudo apt-get update
sudo apt-get install -y \
  build-essential \
  libx11-dev \
  libxkbfile-dev \
  libsecret-1-dev \
  libnss3 \
  libatk1.0-0 \
  libatk-bridge2.0-0 \
  libgtk-3-0 \
  libgbm1

# Fedora / RHEL / CentOS
sudo dnf install -y \
  make gcc gcc-c++ \
  libX11-devel \
  libxkbfile-devel \
  libsecret-devel \
  nss \
  atk \
  gtk3 \
  mesa-libgbm

# Arch Linux
sudo pacman -S \
  base-devel \
  libx11 \
  libxkbfile \
  libsecret \
  nss \
  atk \
  gtk3 \
  mesa
```

### Why These Dependencies?

| Package | Required By |
|---|---|
| `build-essential` / `gcc` | Compiling node-pty native module |
| `libx11-dev` | Electron X11 display |
| `libxkbfile-dev` | Keyboard input handling |
| `libsecret-1-dev` | `electron-store` keychain integration |
| `libnss3` | Electron's network security |
| `libgtk-3-0` | Electron's GTK UI layer |
| `libgbm1` | GPU buffer management |

## Building

### Development Build

```bash
npm install
npm run dev
```

### Production Package

```bash
npm run package:linux
```

This builds:
- `dist/Varta-{version}-x64.AppImage` — AppImage (recommended)
- `dist/varta_{version}_amd64.deb` — Debian/Ubuntu package
- `dist/varta-{version}.x86_64.rpm` — Fedora/RHEL package

## AppImage

AppImage is the recommended distribution format for Linux. It:
- Runs on any Linux distribution (no installation required)
- Bundles all dependencies
- Is a single executable file
- Supports desktop integration via `appimaged`

### Running an AppImage

```bash
# Make executable
chmod +x Varta-1.0.0-x64.AppImage

# Run
./Varta-1.0.0-x64.AppImage
```

### AppImage Desktop Integration

To integrate with the system launcher:

```bash
# Install appimaged for automatic integration
wget https://github.com/probonopd/go-appimage/releases/download/continuous/appimaged-*.AppImage
chmod +x appimaged-*.AppImage
./appimaged-*.AppImage

# Or manually create a .desktop file
cat > ~/.local/share/applications/varta.desktop << EOF
[Desktop Entry]
Name=Varta
Exec=/path/to/Varta-1.0.0-x64.AppImage
Icon=/path/to/varta-icon.png
Type=Application
Categories=Development;TextEditor;
EOF
```

## .deb Package

The `.deb` package installs Varta system-wide on Debian/Ubuntu systems:

```bash
# Install
sudo dpkg -i varta_1.0.0_amd64.deb

# Fix missing dependencies if any
sudo apt-get install -f

# Uninstall
sudo dpkg -r varta
```

The `.deb` package:
- Installs to `/opt/Varta/`
- Creates a `.desktop` file in `/usr/share/applications/`
- Adds a `varta` command to `/usr/bin/`

### .deb Configuration

```yaml
# electron-builder.yml
deb:
  depends:
    - libnotify4
    - libxtst6
    - libnss3
    - libsecret-1-0
  afterInstall: build/linux/after-install.sh
  afterRemove: build/linux/after-remove.sh
```

## .rpm Package

The `.rpm` package installs on Fedora/RHEL/CentOS:

```bash
# Install
sudo rpm -i varta-1.0.0.x86_64.rpm

# Or with dnf
sudo dnf install varta-1.0.0.x86_64.rpm

# Uninstall
sudo rpm -e varta
```

## Desktop Entry File

The `.desktop` file registers Varta with the system application launcher:

```ini
[Desktop Entry]
Name=Varta
GenericName=Code Editor
Comment=A modern desktop code editor
Exec=/opt/Varta/varta %F
Icon=varta
Type=Application
StartupNotify=true
Categories=Development;TextEditor;IDE;
MimeType=text/plain;inode/directory;
Keywords=code;editor;ide;typescript;javascript;
```

The `%F` argument allows opening files by passing them as arguments: `varta /path/to/file.ts`.

## Common Linux Issues

### Missing libsecret

**Symptom:** App crashes on startup with `Error: Cannot find module 'keytar'` or `libsecret-1.so.0: cannot open shared object file`

**Fix:**

```bash
# Ubuntu/Debian
sudo apt-get install libsecret-1-0

# Fedora
sudo dnf install libsecret

# Arch
sudo pacman -S libsecret
```

### Wayland vs X11

Varta runs on both Wayland and X11. By default, Electron uses X11 via XWayland on Wayland compositors.

To run natively on Wayland:

```bash
# Enable Wayland support
ELECTRON_OZONE_PLATFORM_HINT=wayland ./Varta-1.0.0-x64.AppImage
```

Or set it permanently in the `.desktop` file:

```ini
Exec=env ELECTRON_OZONE_PLATFORM_HINT=wayland /opt/Varta/varta %F
```

**Known Wayland issues:**
- Custom title bar may not render correctly on some compositors
- Screen sharing/capture features may not work
- Some keyboard shortcuts may conflict with compositor shortcuts

### AppImage Permissions

**Symptom:** `Permission denied` when running the AppImage.

**Fix:**

```bash
chmod +x Varta-1.0.0-x64.AppImage
```

### AppImage FUSE Error

**Symptom:** `fuse: failed to exec fusermount3: No such file or directory`

**Fix:** Install FUSE:

```bash
# Ubuntu/Debian
sudo apt-get install fuse libfuse2

# Fedora
sudo dnf install fuse fuse-libs

# Arch
sudo pacman -S fuse2
```

Or run the AppImage without FUSE (extracts to a temp directory):

```bash
./Varta-1.0.0-x64.AppImage --appimage-extract-and-run
```

### Sandbox Issues

**Symptom:** App fails to start with `SUID sandbox helper binary was found, but is not configured correctly`

**Fix:** Add the `--no-sandbox` flag (reduces security, use only if necessary):

```bash
./Varta-1.0.0-x64.AppImage --no-sandbox
```

Or set the kernel parameter:

```bash
sudo sysctl -w kernel.unprivileged_userns_clone=1
```

### node-pty Fails to Load

**Symptom:** Terminal panel shows an error, or the app crashes when opening a terminal.

**Fix:** Ensure build dependencies are installed and reinstall:

```bash
sudo apt-get install build-essential libx11-dev libxkbfile-dev
rm -rf node_modules
npm install
```

## ARM64 Support

Varta supports Linux ARM64 (e.g., Raspberry Pi 4, AWS Graviton):

```bash
npm run package:linux
# Builds both x64 and arm64 AppImages
```

The ARM64 AppImage is named `Varta-{version}-arm64.AppImage`.

## Related

- [Packaging](./packaging.md) — electron-builder configuration
- [Windows Build](./windows-build.md) — Windows NSIS installer
- [macOS Build](./macos-build.md) — macOS DMG and notarization
- [Installation](../getting-started/installation.md) — Linux build dependencies
