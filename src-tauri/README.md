# FocusGuardian — Native Windows Backend (Tauri v2)

This directory contains the Rust + Tauri v2 shell that wraps the React frontend
and produces a Windows `.exe` installer.

## Building the Windows installer

> Requires Rust 1.70+ and the Tauri v2 CLI.

```bash
npm install -g @tauri-apps/cli
npm run build              # build the React frontend into ../dist
tauri build                # compile Rust + bundle a Windows .exe (NSIS installer)
```

Output: `src-tauri/target/release/bundle/nsis/FocusGuardian_1.0.0_x64-setup.exe`

## How native window tracking works

`src/lib/tauriBridge.ts` detects Tauri at runtime via `window.__TAURI_INTERNALS__`.
When present, `DesktopStateController` polls `invoke('get_active_window')` every
second. The Rust command (`src/lib/lib.rs`) calls the Win32 API:

1. `GetForegroundWindow()` — the HWND of the focused window.
2. `GetWindowTextW()` — its title.
3. `GetWindowThreadProcessId()` + `CreateToolhelp32Snapshot` — the owning
   process name.
4. A process-name → category map classifies the window as productive / neutral
   / distracting. Browser windows are refined by scanning the title for
   distracting keywords (YouTube, Reddit, Shorts, etc.).

The returned JSON shape (`{ title, category, appColor, iconKey }`) is identical
to what the simulation bar emits, so the React layer never branches on
"simulated vs native."

## System tray

`tauri.conf.json` declares a `trayIcon`. The Rust `setup` hook builds the tray
icon. The `minimize_to_tray` command hides the window; the tray icon restores
it on click. Toggle "Minimize to system tray" in Settings to enable.
