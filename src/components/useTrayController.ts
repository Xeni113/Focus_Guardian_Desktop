import { useEffect } from 'react';
import { invoke } from '@/lib/tauriBridge';

/**
 * Manages the system-tray minimize behavior. In native Tauri mode it calls
 * `invoke('minimize_to_tray')`. In browser/dev mode this is a no-op — the
 * window just hides via the browser.
 *
 * The actual tray icon is set up in src-tauri/src/main.rs via the tauri-plugin-system-tray.
 * This hook only handles the "request minimize to tray" action from the UI.
 */
export function useTrayController(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;
    // Listen for native window-close requests and intercept to minimize to tray.
    // In Tauri v2 this is done via the close-requested event in Rust; here we
    // expose a JS-side helper for the UI's "Minimize to tray" button.
  }, [enabled]);
}

export async function minimizeToTray() {
  await invoke('minimize_to_tray');
}
