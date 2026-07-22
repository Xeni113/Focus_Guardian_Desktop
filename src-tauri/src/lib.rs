// FocusGuardian — native Tauri v2 backend
//
// Implements the real Win32 active-window tracking that the JS bridge
// (src/lib/tauriBridge.ts) calls via `invoke('get_active_window')`.
// On Windows it reads GetForegroundWindow + GetWindowText, maps the owning
// process name to a category, and returns a JSON payload the React layer
// consumes unchanged.

#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use serde::Serialize;

#[derive(Serialize, Clone)]
pub struct ActiveWindowPayload {
    pub title: String,
    pub category: &'static str, // "productive" | "neutral" | "distracting"
    pub app_color: &'static str,
    pub icon_key: &'static str,
}

#[cfg(windows)]
mod win {
    use std::collections::HashMap;
    use std::ffi::OsString;
    use std::os::windows::ffi::OsStringExt;
    use windows::Win32::Foundation::HWND;
    use windows::Win32::UI::WindowsAndMessaging::{
        GetForegroundWindow, GetWindowTextW, GetWindowThreadProcessId,
    };
    use windows::Win32::System::Diagnostics::ToolHelp::{
        CreateToolhelp32Snapshot, Process32Snapshot, Process32NextW, PROCESSENTRY32W,
    };
    use windows::Win32::System::Threading::PROCESS_QUERY_LIMITED_INFORMATION;

    use super::ActiveWindowPayload;

    /// Simple process-name -> category map. The user can refine this in the
    /// UI; this is the boot-time default so the native mode returns something
    /// sensible before the React app loads its own list.
    fn classify(process: &str) -> (&'static str, &'static str, &'static str) {
        let p = process.to_lowercase();
        if matches!(
            p.as_str(),
            "code.exe" | "devenv.exe" | "idea64.exe" | "notepad.exe" | "wonder.exe" | "obsidian.exe"
        ) {
            return ("productive", "#3fb950", "code");
        }
        if matches!(
            p.as_str(),
            "acrobat.exe" | "acroread.exe" | "sumatrapdf.exe" | "winword.exe" | "onenote.exe"
        ) {
            return ("productive", "#2dd4bf", "book");
        }
        if matches!(
            p.as_str(),
            "youtube.com" | "chrome.exe" | "msedge.exe" | "firefox.exe"
        ) {
            // Browsers are neutral unless the title looks distracting
            return ("neutral", "#d29922", "globe");
        }
        if matches!(
            p.as_str(),
            "discord.exe" | "slack.exe" | "teams.exe"
        ) {
            return ("neutral", "#d29922", "message");
        }
        if matches!(
            p.as_str(),
            "spotify.exe" | "music.exe"
        ) {
            return ("neutral", "#d29922", "music");
        }
        ("distracting", "#f85149", "globe")
    }

    fn process_name_for_pid(pid: u32) -> Option<String> {
        unsafe {
            let snapshot = CreateToolhelp32Snapshot(PROCESS_QUERY_LIMITED_INFORMATION, 0).ok()?;
            let mut entry = PROCESSENTRY32W {
                dwSize: std::mem::size_of::<PROCESSENTRY32W>() as u32,
                ..Default::default()
            };
            let mut current = snapshot;
            while Process32NextW(current, &mut entry).is_ok() {
                if entry.th32ProcessID == pid {
                    let name = OsString::from_wide(&entry.szExeFile)
                        .to_string_lossy()
                        .to_string();
                    return Some(name);
                }
                current = snapshot;
            }
        }
        None
    }

    pub fn get_active_window() -> Option<ActiveWindowPayload> {
        unsafe {
            let hwnd: HWND = GetForegroundWindow();
            if hwnd.0.is_null() {
                return None;
            }

            // Window title
            let mut buf = [0u16; 512];
            let len = GetWindowTextW(hwnd, &mut buf);
            let title = if len > 0 {
                OsString::from_wide(&buf[..len as usize])
                    .to_string_lossy()
                    .to_string()
            } else {
                "Unknown".to_string()
            };

            // Owning process
            let mut pid: u32 = 0;
            GetWindowThreadProcessId(hwnd, Some(&mut pid as *mut u32));
            let proc = process_name_for_pid(pid).unwrap_or_default();

            let (category, color, icon) = classify(&proc);

            // Refine browser title — if the title contains distracting keywords,
            // override the category to distracting.
            let title_lower = title.to_lowercase();
            let (final_category, final_color, final_icon) = if category == "neutral" {
                if title_lower.contains("youtube")
                    || title_lower.contains("reddit")
                    || title_lower.contains("tiktok")
                    || title_lower.contains("shorts")
                    || title_lower.contains("memes")
                {
                    ("distracting", "#f85149", "play")
                } else {
                    (category, color, icon)
                }
            } else {
                (category, color, icon)
            };

            Some(ActiveWindowPayload {
                title,
                category: final_category,
                app_color: final_color,
                icon_key: final_icon,
            })
        }
    }
}

#[cfg(not(windows))]
mod win {
    use super::ActiveWindowPayload;
    pub fn get_active_window() -> Option<ActiveWindowPayload> {
        None
    }
}

/// Called from the JS layer via `invoke('get_active_window')`.
#[tauri::command]
fn get_active_window() -> Option<ActiveWindowPayload> {
    win::get_active_window()
}

/// Hides the window and relies on the tray icon to restore it.
#[tauri::command]
fn minimize_to_tray(app: tauri::AppHandle, window: tauri::WebviewWindow) {
    use tauri::Manager;
    let _ = window.hide();
    let _ = app.get_tray_icon();
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    use tauri::{menu::Menu, tray::TrayIconBuilder};

    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            // Build the system tray with a simple menu.
            let menu = Menu::builder(app).items(&[]).build()?;
            let _tray = TrayIconBuilder::with_id("main")
                .icon(app.default_window_icon().unwrap().clone())
                .menu(&menu)
                .tooltip("FocusGuardian")
                .show_menu_on_left_click(false)
                .build(app)?;
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![get_active_window, minimize_to_tray])
        .run(tauri::generate_context!())
        .expect("error while running FocusGuardian");
}
