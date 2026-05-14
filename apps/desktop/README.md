# @pet-genius/desktop

Tauri 2 wrapper that ships the floating pet as a real desktop app on Windows / macOS / Linux. Transparent always-on-top window — the pet hovers over whatever's behind it on the OS desktop.

## Stack

- **Tauri 2** for the native shell (Rust + WebKit/WebView2)
- **@pet-genius/widget** for the actual pet (mounted into a transparent host that fills the window)
- The same `apps/demo/server.ts` for the LLM backend (run it locally on `:3000`, or point `apiBase` at a remote server)

## Run from source

System deps:
- Node 20+, pnpm, Rust 1.77+
- Linux: `libgtk-3-dev libwebkit2gtk-4.1-dev libayatana-appindicator3-dev librsvg2-dev`
- macOS: Xcode command-line tools (`xcode-select --install`)
- Windows: Microsoft C++ Build Tools + WebView2

Then:

```sh
# Terminal 1 — the LLM proxy (uses .env.local from repo root)
pnpm --filter @pet-genius/demo start

# Terminal 2 — the desktop app in dev mode (Vite + Tauri)
pnpm --filter @pet-genius/desktop tauri:dev
```

## Build installers

```sh
pnpm --filter @pet-genius/desktop tauri:build
```

Outputs land under `apps/desktop/src-tauri/target/release/bundle/`:

| Platform | Artifact                                                   |
| -------- | ---------------------------------------------------------- |
| Windows  | `nsis/pet-genius_<version>_x64-setup.exe`                  |
| macOS    | `dmg/pet-genius_<version>_aarch64.dmg` and `.app`          |
| Linux    | `deb/pet-genius_<version>_amd64.deb`, `appimage/*.AppImage` |

## Window config

In `src-tauri/tauri.conf.json`:

- `transparent: true` + `macOSPrivateApi: true` (with the `macos-private-api` Cargo feature on the `tauri` crate) gives real macOS transparency.
- `decorations: false` removes the title bar.
- `alwaysOnTop: true` keeps the pet over other windows.
- `shadow: false` so the otherwise empty surrounding canvas doesn't cast a window-rect shadow.

## Caveats

- The desktop frontend assumes the LLM proxy is reachable at `http://localhost:3000`. Edit `src/main.tsx` to point at a remote server if you'd rather not run the proxy locally.
- The icon at `src-tauri/icons/icon.png` is a placeholder. Replace with real artwork before shipping.
- The pet currently fills the entire transparent window; click-through (so non-pet pixels pass clicks to the OS) is not enabled by default — wire `set_ignore_cursor_events` from a tray menu if you want that mode.
