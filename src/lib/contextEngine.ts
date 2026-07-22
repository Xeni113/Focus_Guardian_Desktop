import type { AppCategory, TrackedApp, Settings, FocusStatus } from './types';

export type { FocusStatus };

/**
 * Context-Aware Classification Engine
 *
 * Given a window title, the user's app list, and whitelist keywords, determine
 * the category. For browsers/social-media apps, the title is scanned for
 * whitelist keywords (e.g. "Physics", "PW", "Lecture") — if found, the window
 * is classified as productive even though the host app is normally distracting.
 */

const BROWSER_PATTERNS = [
  /youtube/i,
  /reddit/i,
  /tiktok/i,
  /instagram/i,
  /twitter|x\.com/i,
  /facebook/i,
  /chrome/i,
  /edge/i,
  /firefox/i,
  /browser/i,
];

const SOCIAL_DISTRACTING = [
  /youtube/i,
  /reddit/i,
  /tiktok/i,
  /instagram/i,
  /twitter|x\.com/i,
  /facebook/i,
];

export interface ClassifyResult {
  category: AppCategory;
  matchedKeyword?: string;
  isWhitelistOverride: boolean;
}

export function classifyWindowTitle(
  title: string,
  apps: TrackedApp[],
  whitelist: string[],
): ClassifyResult {
  const lower = title.toLowerCase();

  // 1. Exact app match — user has explicitly classified this app
  const exact = apps.find((a) => a.title.toLowerCase() === lower);
  if (exact) {
    return { category: exact.category, isWhitelistOverride: false };
  }

  // 2. Partial app match — title contains a known app name
  const partial = apps.find(
    (a) => lower.includes(a.title.toLowerCase()) || a.title.toLowerCase().includes(lower),
  );
  if (partial) {
    return { category: partial.category, isWhitelistOverride: false };
  }

  // 3. Whitelist keyword scan — any keyword in the title makes it productive
  for (const kw of whitelist) {
    if (lower.includes(kw.toLowerCase())) {
      return { category: 'productive', matchedKeyword: kw, isWhitelistOverride: true };
    }
  }

  // 4. Browser / social-media heuristic: if the title looks like a distracting
  //    site AND no whitelist keyword was found, classify as distracting.
  const isDistractingSite = SOCIAL_DISTRACTING.some((p) => p.test(title));
  if (isDistractingSite) {
    return { category: 'distracting', isWhitelistOverride: false };
  }

  // 5. Browser but not explicitly distracting — neutral
  const isBrowser = BROWSER_PATTERNS.some((p) => p.test(title));
  if (isBrowser) {
    return { category: 'neutral', isWhitelistOverride: false };
  }

  // 6. Default — neutral for unknown apps
  return { category: 'neutral', isWhitelistOverride: false };
}

/**
 * Determine the live focus status from category and distraction dwell time.
 * - productive → deep (green)
 * - neutral under 60s → grace (amber)
 * - neutral over 60s → off-task (red)
 * - distracting → off-task (red)
 */
export function deriveFocusStatus(
  category: AppCategory,
  distractionDwellMs: number,
  gracePeriodMs = 60 * 1000,
): FocusStatus {
  if (category === 'productive') return 'deep';
  if (category === 'distracting') return 'off-task';
  // neutral
  if (distractionDwellMs > gracePeriodMs) return 'off-task';
  return 'grace';
}

export function statusColor(status: FocusStatus): string {
  switch (status) {
    case 'deep':
      return 'var(--focus-good)';
    case 'grace':
      return 'var(--focus-warn)';
    case 'off-task':
      return 'var(--focus-bad)';
  }
}

export function statusLabel(status: FocusStatus): string {
  switch (status) {
    case 'deep':
      return 'Deep Focus';
    case 'grace':
      return 'Grace Period';
    case 'off-task':
      return 'Off-Task';
  }
}

/**
 * SPM (Switches Per Minute) rate limiter.
 * Tracks window-switch timestamps in a rolling window and returns the count
 * within the window. If count exceeds the threshold, a brain-fatigue warning
 * should fire.
 */
export class SwitchRateLimiter {
  private timestamps: number[] = [];
  private windowMs: number;

  constructor(windowMs = 2 * 60 * 1000) {
    this.windowMs = windowMs;
  }

  recordSwitch(at: number): number {
    this.timestamps.push(at);
    this.prune(at);
    return this.timestamps.length;
  }

  getCount(at: number): number {
    this.prune(at);
    return this.timestamps.length;
  }

  isOverThreshold(at: number, threshold: number): boolean {
    return this.getCount(at) > threshold;
  }

  reset(): void {
    this.timestamps = [];
  }

  private prune(at: number): void {
    const cutoff = at - this.windowMs;
    this.timestamps = this.timestamps.filter((t) => t >= cutoff);
  }
}

export function isRapidSwitchWarning(settings: Settings, spmCount: number): boolean {
  return spmCount > settings.spmThreshold;
}
