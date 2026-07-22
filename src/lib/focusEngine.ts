import type { InterventionTier, WindowSession, Settings } from './types';

/**
 * Focus score calculation.
 *
 * Productive time adds to the score, neutral is neutral, distracting subtracts.
 * The score is a rolling blend of the last 10 minutes of activity weighted by
 * recency, clamped to 0..100.
 */
export function computeFocusScore(
  sessions: WindowSession[],
  now: number,
  windowMs = 10 * 60 * 1000,
): number {
  const cutoff = now - windowMs;
  const recent = sessions.filter((s) => s.endedAt >= cutoff || s.startedAt >= cutoff);
  if (recent.length === 0) return 100;

  let prodMs = 0;
  let neutralMs = 0;
  let distractMs = 0;

  for (const s of recent) {
    const start = Math.max(s.startedAt, cutoff);
    const end = Math.min(s.endedAt || now, now);
    const dur = Math.max(0, end - start);
    if (s.category === 'productive') prodMs += dur;
    else if (s.category === 'neutral') neutralMs += dur;
    else distractMs += dur;
  }

  const total = prodMs + neutralMs + distractMs;
  if (total === 0) return 100;

  const prodRatio = prodMs / total;
  const distractRatio = distractMs / total;
  const raw = prodRatio * 100 + (neutralMs / total) * 40 - distractRatio * 120;
  return Math.round(Math.max(0, Math.min(100, 50 + raw / 2)));
}

export function scoreColor(score: number): string {
  if (score >= 75) return 'var(--focus-good)';
  if (score >= 45) return 'var(--focus-warn)';
  return 'var(--focus-bad)';
}

export function scoreLabel(score: number): string {
  if (score >= 85) return 'Deep Focus';
  if (score >= 70) return 'Focused';
  if (score >= 50) return 'Wandering';
  if (score >= 30) return 'Distracted';
  return 'Seriously Distracted';
}

/**
 * 4-tier progressive escalation evaluation.
 *
 * Tier 1 (1 min):  Gentle toast nudge.
 * Tier 2 (5 min):  Goal-impact modal with "Return to [goal]" button.
 * Tier 3 (10 min): Backdrop blur + intention input box.
 * Tier 4 (15 min): Full intervention screen — return or take a 5-min break.
 *
 * Returns the highest unfired tier that the dwell time qualifies for, or null.
 */
export function evaluateIntervention(
  currentCategory: 'productive' | 'neutral' | 'distracting',
  distractionDwellMs: number,
  settings: Settings,
  alreadyFired: Set<InterventionTier>,
): InterventionTier | null {
  if (currentCategory !== 'distracting') return null;

  if (distractionDwellMs >= settings.distractionTier4Ms && !alreadyFired.has(4)) {
    return 4;
  }
  if (distractionDwellMs >= settings.distractionTier3Ms && !alreadyFired.has(3)) {
    return 3;
  }
  if (distractionDwellMs >= settings.distractionTier2Ms && !alreadyFired.has(2)) {
    return 2;
  }
  if (distractionDwellMs >= settings.distractionTier1Ms && !alreadyFired.has(1)) {
    return 1;
  }
  return null;
}

export function formatDuration(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

export function formatClock(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function todayKey(d = new Date()): string {
  return d.toISOString().slice(0, 10);
}

export function dateKey(offsetDays: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}
