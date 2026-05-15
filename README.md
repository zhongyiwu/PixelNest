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

Whether you are on macOS or Windows, install these first:

| Tool | Version | Notes |
| --- | --- | --- |
| **Node.js** | ≥ 18 LTS | For the front-end and build scripts. [nvm](https://github.com/nvm-sh/nvm) / [nvm-windows](https://github.com/coreybutler/nvm-windows) recommended. |
| **Rust** | Latest stable | Required by the Tauri shell. Install via [rustup](https://rustup.rs/). |
| **Platform native deps** | See below | macOS and Windows each need a few system-level pieces. |

#### macOS

```bash
xcode-select --install
```

That installs the Xcode Command Line Tools, which Tauri uses to compile.

#### Windows

1. Install **Microsoft Visual Studio C++ Build Tools** (check "Desktop development with C++").
2. Install the **WebView2 Runtime** (bundled with Windows 11; Windows 10 users can grab it from [Microsoft](https://developer.microsoft.com/microsoft-edge/webview2/)).

> For the full list of platform requirements, see the [Tauri prerequisites docs](https://v2.tauri.app/start/prerequisites/).

### 2. Clone and install

```bash
git clone https://github.com/<your-name>/PixelNest.git
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
