import { invoke, isTauri } from './tauriBridge';
import type { AppCategory } from './types';
import { classifyWindowTitle } from './contextEngine';

/**
 * Architecture note for FocusGuardian:
 *
 * 1. SIMULATION MODE (browser/dev preview): A user picks a simulated window
 *    from the top simulation bar (or types a custom title). The controller
 *    emits that window as active and accumulates dwell time on it.
 *
 * 2. NATIVE MODE (Tauri v2 .exe on Windows): When isTauri() is true, the
 *    controller polls `invoke('get_active_window')` every second. The Rust
 *    command returns the foreground window title + process name; this
 *    controller then runs the context engine to classify it using the user's
 *    app list and whitelist keywords.
 *
 * The React layer never branches on "simulated vs native" — it subscribes to
 * the same `onActiveWindowChange` callback in both modes.
 */

export interface ActiveWindowState {
  title: string;
  category: AppCategory;
  appColor: string;
  iconKey: string;
  dwellMs: number;
  isNative: boolean;
  matchedKeyword?: string;
  isWhitelistOverride: boolean;
}

type Listener = (state: ActiveWindowState) => void;

const POLL_INTERVAL = 1000;

export interface ControllerConfig {
  appTitles: { title: string; color: string; icon: string; category: AppCategory }[];
  whitelist: string[];
}

export class DesktopStateController {
  private listeners = new Set<Listener>();
  private current: ActiveWindowState | null = null;
  private pollTimer: ReturnType<typeof setInterval> | null = null;
  private dwellTimer: ReturnType<typeof setInterval> | null = null;
  private lastChangeAt = 0;
  private isNative = false;
  private config: ControllerConfig = { appTitles: [], whitelist: [] };

  start() {
    this.isNative = isTauri();
    this.lastChangeAt = Date.now();

    if (this.isNative) {
      this.startNativePolling();
    }
    this.dwellTimer = setInterval(() => {
      if (this.current) {
        const delta = Date.now() - this.lastChangeAt;
        this.current = { ...this.current, dwellMs: delta };
        this.emit();
      }
    }, 1000);
  }

  stop() {
    if (this.pollTimer) clearInterval(this.pollTimer);
    if (this.dwellTimer) clearInterval(this.dwellTimer);
    this.pollTimer = null;
    this.dwellTimer = null;
  }

  updateConfig(config: ControllerConfig) {
    this.config = config;
  }

  /** Simulation mode only — called by the SimulationBar UI. */
  setSimulatedWindow(title: string, category: AppCategory, appColor: string, iconKey: string) {
    if (this.isNative) return;
    const result = classifyWindowTitle(title, [], this.config.whitelist);
    const finalCategory = result.isWhitelistOverride ? result.category : category;
    const color = result.isWhitelistOverride ? '#3fb950' : appColor;
    this.current = {
      title,
      category: finalCategory,
      appColor: color,
      iconKey,
      dwellMs: 0,
      isNative: false,
      matchedKeyword: result.matchedKeyword,
      isWhitelistOverride: result.isWhitelistOverride,
    };
    this.lastChangeAt = Date.now();
    this.emit();
  }

  onActiveWindowChange(cb: Listener): () => void {
    this.listeners.add(cb);
    if (this.current) cb(this.current);
    return () => this.listeners.delete(cb);
  }

  getActive(): ActiveWindowState | null {
    return this.current;
  }

  get isNativeMode() {
    return this.isNative;
  }

  private emit() {
    if (!this.current) return;
    this.listeners.forEach((l) => l(this.current!));
  }

  private startNativePolling() {
    this.pollTimer = setInterval(async () => {
      const win = await invoke<{
        title: string;
        category: AppCategory;
        appColor: string;
        iconKey: string;
      }>('get_active_window');
      if (!win) return;

      // Re-classify using context engine on the native title
      const result = classifyWindowTitle(win.title, [], this.config.whitelist);
      const category = result.isWhitelistOverride ? result.category : win.category;
      const color = result.isWhitelistOverride ? '#3fb950' : win.appColor;

      if (!this.current || this.current.title !== win.title) {
        this.lastChangeAt = Date.now();
        this.current = {
          title: win.title,
          category,
          appColor: color,
          iconKey: win.iconKey,
          dwellMs: 0,
          isNative: true,
          matchedKeyword: result.matchedKeyword,
          isWhitelistOverride: result.isWhitelistOverride,
        };
      }
      this.emit();
    }, POLL_INTERVAL);
  }
}

export const desktopController = new DesktopStateController();
