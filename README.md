# PixelNest 🐾

PixelNest is a tiny pixel-art desktop pet — a draggable black cat that blinks, wags its tail, and meows when you click it. The current version focuses on getting the front-end core working and wrapping it in a transparent, always-on-top Tauri window.

> **Supported platforms:** macOS and Windows (Linux should work in theory but is not fully tested).

---

## Features

- A pixel black cat, rendered from a 64×64 base and scaled up
- Idle animations: breathing, blinking, tail swaying
- Click feedback: a little hop and a "Meow" speech bubble
- Drag-to-move: grab the cat and drop it anywhere on screen
- Tauri shell: transparent, frameless, always-on-top floating window

---

## Installation

### 1. Prerequisites

You'll need three things on any platform: **Node.js**, **Rust**, and the **platform's native build tools**. Pick the section for your OS below — every command can be copy-pasted as is.

#### 🍎 macOS

```bash
# 1. Homebrew (skip if you already have it)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# 2. Node.js (LTS)
brew install node

# 3. Rust (via rustup)
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# 4. Xcode Command Line Tools (Tauri needs them to compile)
xcode-select --install
```

After installation, restart your terminal so the new `cargo` and `node` commands are on your `PATH`. Verify with `node -v` and `cargo -V`.

#### 🪟 Windows

Run these in **PowerShell** (you don't need admin for most of them):

```powershell
# 1. Node.js (LTS)
winget install OpenJS.NodeJS.LTS

# 2. Rust: download and run rustup-init.exe from https://rustup.rs
#    Choose option 1 (default installation) when prompted.

# 3. Microsoft Visual C++ Build Tools
#    Download from: https://visualstudio.microsoft.com/visual-cpp-build-tools/
#    In the installer, check "Desktop development with C++".

# 4. WebView2 Runtime
#    Windows 11 already has it. On Windows 10, grab the Evergreen installer from:
#    https://developer.microsoft.com/microsoft-edge/webview2/
```

Close and reopen PowerShell after installing Rust and Node, then verify with `node -v` and `cargo -V`.

#### 🐧 Linux (Ubuntu / Debian)

```bash
# 1. Node.js (LTS, via NodeSource — apt's default is usually too old)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# 2. Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# 3. Tauri system dependencies
sudo apt install -y libwebkit2gtk-4.1-dev build-essential curl wget file \
    libxdo-dev libssl-dev libayatana-appindicator3-dev librsvg2-dev
```

> For the full list of platform requirements, see the [Tauri prerequisites docs](https://v2.tauri.app/start/prerequisites/).

### 2. Clone and install

```bash
git clone https://github.com/zhongyiwu/PixelNest.git
cd PixelNest
npm install
```

### 3. Run

#### Option A — Desktop pet window (recommended)

```bash
npm run tauri dev
```

Spawns a transparent, always-on-top window with the cat living on your desktop. The first run compiles Rust dependencies and can take a few minutes — be patient.

#### Option B — Browser preview (fast iteration on the front-end)

```bash
npm run dev
```

Then open [http://127.0.0.1:1420](http://127.0.0.1:1420).

#### Option C — Plain static preview (no build tools)

```bash
node server.js
```

Or just open `index.html` directly in a browser.

### 4. Build a release

```bash
npm run tauri build
```

Output lands in `src-tauri/target/release/bundle/`:

- macOS: `.app` and/or `.dmg`
- Windows: `.msi` / `.exe` installer

---

## Project structure

```
PixelNest/
├── index.html          # Front-end entry point
├── app.js              # Pet interaction logic
├── styles.css          # Styles and animations
├── assets/             # Pixel-art assets
├── scripts/            # Utility scripts (e.g. spritesheet generation)
├── server.js           # Minimal static server
├── vite.config.js      # Vite config
└── src-tauri/          # Tauri desktop shell (Rust)
    ├── src/            # Rust entry
    ├── tauri.conf.json # Window & bundling config
    └── Cargo.toml
```

---

## FAQ

**Q: `npm run tauri dev` complains it can't find `cargo`.**
A: Rust is missing from your PATH. Install rustup, then restart your terminal.

**Q: On Windows the window is black or not transparent.**
A: Make sure the WebView2 Runtime is installed and your GPU drivers are up to date.

**Q: How do I change the window size or always-on-top behavior?**
A: Edit `app.windows` in `src-tauri/tauri.conf.json`.

---

## Roadmap

1. Right-click menu: quit, settings, switch actions
2. More states: walking, sleeping, being picked up, being petted
3. Settings panel: scale, always-on-top toggle, launch-on-startup
4. Replace the placeholder SVG cat with a proper pixel spritesheet

---

## License

Released under the [MIT License](./LICENSE).
