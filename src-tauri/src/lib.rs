// FocusGuardian — native Tauri v2 backend
//
// Implements Win32 active-window tracking for the React frontend.
// The frontend can call `invoke("get_active_window")` to retrieve
// information about the currently focused Windows application.

#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use serde::Serialize;

#[derive(Serialize, Clone)]
pub struct ActiveWindowPayload {
    pub title: String,
    pub category: &'static str,
    pub app_color: &'static str,
    pub icon_key: &'static str,
}

#[cfg(windows)]
mod win {
    use std::ffi::OsString;
    use std::os::windows::ffi::OsStringExt;

    use windows::Win32::Foundation::HWND;

    use windows::Win32::System::Diagnostics::ToolHelp::{
        CreateToolhelp32Snapshot,
        Process32FirstW,
        Process32NextW,
        PROCESSENTRY32W,
        TH32CS_SNAPPROCESS,
    };

    use windows::Win32::UI::WindowsAndMessaging::{
        GetForegroundWindow,
        GetWindowTextW,
        GetWindowThreadProcessId,
    };

    use super::ActiveWindowPayload;

    /// Maps an executable/process name to FocusGuardian's initial category.
    ///
    /// The React frontend can later provide more sophisticated/custom
    /// classification. This is simply the native fallback classification.
    fn classify(process: &str) -> (&'static str, &'static str, &'static str) {
        let p = process.to_lowercase();

        if matches!(
            p.as_str(),
            "code.exe"
                | "devenv.exe"
                | "idea64.exe"
                | "notepad.exe"
                | "wonder.exe"
                | "obsidian.exe"
        ) {
            return ("productive", "#3fb950", "code");
        }

        if matches!(
            p.as_str(),
            "acrobat.exe"
                | "acroread.exe"
                | "sumatrapdf.exe"
                | "winword.exe"
                | "onenote.exe"
        ) {
            return ("productive", "#2dd4bf", "book");
        }

        if matches!(
            p.as_str(),
            "chrome.exe" | "msedge.exe" | "firefox.exe"
        ) {
            // Browsers start as neutral. Their window title is examined
            // later to determine whether the current website is distracting.
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

    /// Finds the executable name belonging to a Windows process ID.
    fn process_name_for_pid(pid: u32) -> Option<String> {
        unsafe {
            // Create a snapshot containing all currently running processes.
            let snapshot =
                CreateToolhelp32Snapshot(TH32CS_SNAPPROCESS, 0).ok()?;

            let mut entry = PROCESSENTRY32W {
                dwSize: std::mem::size_of::<PROCESSENTRY32W>() as u32,
                ..Default::default()
            };

            // Process32FirstW must be called before Process32NextW.
            if Process32FirstW(snapshot, &mut entry).is_err() {
                return None;
            }

            loop {
                if entry.th32ProcessID == pid {
                    // szExeFile is a fixed-size UTF-16 buffer and may contain
                    // trailing NUL characters. Find the real string length.
                    let len = entry
                        .szExeFile
                        .iter()
                        .position(|&c| c == 0)
                        .unwrap_or(entry.szExeFile.len());

                    let name = OsString::from_wide(&entry.szExeFile[..len])
                        .to_string_lossy()
                        .into_owned();

                    return Some(name);
                }

                // No more processes in the snapshot.
                if Process32NextW(snapshot, &mut entry).is_err() {
                    break;
                }
            }
        }

        None
    }

    /// Reads information about the currently focused Windows window.
    pub fn get_active_window() -> Option<ActiveWindowPayload> {
        unsafe {
            let hwnd: HWND = GetForegroundWindow();

            if hwnd.0.is_null() {
                return None;
            }

            // -------------------------------------------------------------
            // Get the window title
            // -------------------------------------------------------------

            let mut buf = [0u16; 512];

            let len = GetWindowTextW(hwnd, &mut buf);

            let title = if len > 0 {
                OsString::from_wide(&buf[..len as usize])
                    .to_string_lossy()
                    .into_owned()
            } else {
                "Unknown".to_string()
            };

            // -------------------------------------------------------------
            // Get the process ID that owns the window
            // -------------------------------------------------------------

            let mut pid: u32 = 0;

            GetWindowThreadProcessId(
                hwnd,
                Some(&mut pid as *mut u32),
            );

            let process = process_name_for_pid(pid)
                .unwrap_or_default();

            let (category, color, icon) =
                classify(&process);

            // -------------------------------------------------------------
            // Browser-specific title classification
            // -------------------------------------------------------------

            let title_lower = title.to_lowercase();

            let (final_category, final_color, final_icon) =
                if category == "neutral"
                    && matches!(
                        process.to_lowercase().as_str(),
                        "chrome.exe" | "msedge.exe" | "firefox.exe"
                    )
                {
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

/// Called from the JavaScript/TypeScript frontend using:
///
/// invoke("get_active_window")
#[tauri::command]
fn get_active_window() -> Option<ActiveWindowPayload> {
    win::get_active_window()
}

/// Hides the main FocusGuardian window.
///
/// The tray icon remains available so that the application continues
/// running in the background.
#[tauri::command]
fn minimize_to_tray(window: tauri::WebviewWindow) {
    let _ = window.hide();
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    use tauri::tray::TrayIconBuilder;

    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            // -------------------------------------------------------------
            // System tray
            // -------------------------------------------------------------

            let mut tray_builder =
                TrayIconBuilder::with_id("main")
                    .tooltip("FocusGuardian")
                    .show_menu_on_left_click(false);

            // Add the application's default icon if one is available.
            if let Some(icon) = app.default_window_icon() {
                tray_builder = tray_builder.icon(icon.clone());
            }

            let _tray = tray_builder.build(app)?;

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            get_active_window,
            minimize_to_tray
        ])
        .run(tauri::generate_context!())
        .expect("error while running FocusGuardian");
}