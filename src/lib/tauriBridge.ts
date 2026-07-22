import type { ActiveWindow } from './types';

/**
 * Detects whether we are running inside a Tauri v2 native shell.
 * In the browser/dev preview this returns false and the app falls back to
 * the simulation controller. When compiled to a Windows .exe via Tauri v2,
 * `window.__TAURI_INTERNALS__` is present and all `invoke()` calls resolve
 * against real native commands defined in src-tauri/src/main.rs.
 */
export function isTauri(): boolean {
  return (
    typeof window !== 'undefined' &&
    // Tauri v2 exposes __TAURI_INTERNALS__ on the window object at runtime
    ((window as unknown as Record<string, unknown>).__TAURI_INTERNALS__ !== undefined ||
      (window as unknown as Record<string, unknown>).__TAURI__ !== undefined)
  );
}

/**
 * Safely invoke a Tauri v2 command. Returns null when not in Tauri so the
 * caller can fall back to simulated behavior without throwing.
 *
 * Native command contract (implemented in src-tauri/src/main.rs):
 *   #[tauri::command]
 *   fn get_active_window(app: State<AppHandle>) -> Option<ActiveWindowPayload>
 *     -> returns { title, category, appColor, iconKey } derived from the
 *        currently focused Win32 window (GetForegroundWindow + GetWindowText).
 *
 *   #[tauri::command]
 *   fn minimize_to_tray(app: AppHandle, window: Window)
 *     -> hides the window and shows a system tray icon.
 */
export async function invoke<T = unknown>(cmd: string, args?: Record<string, unknown>): Promise<T | null> {
  if (!isTauri()) return null;
  try {
    const internals = (window as unknown as {
      __TAURI_INTERNALS__?: { invoke: (c: string, a?: Record<string, unknown>) => Promise<T> };
      __TAURI__?: { core?: { invoke: (c: string, a?: Record<string, unknown>) => Promise<T> } };
    });
    const invokeFn =
      internals.__TAURI_INTERNALS__?.invoke ?? internals.__TAURI__?.core?.invoke;
    if (!invokeFn) return null;
    return await invokeFn(cmd, args);
  } catch {
    return null;
  }
}

export async function getActiveWindowNative(): Promise<ActiveWindow | null> {
  return invoke<ActiveWindow>('get_active_window');
}

export async function minimizeToTrayNative(): Promise<void> {
  await invoke('minimize_to_tray');
}
