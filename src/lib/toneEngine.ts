import type { InterventionTone, InterventionTier } from './types';

/**
 * Tone-aware intervention message engine.
 *
 * Three personalities:
 * - encouraging: supportive, goal-focused, positive framing
 * - direct: factual time-wasted feedback, no fluff
 * - minimal: just the numbers, no text advice
 */

export interface InterventionMessages {
  tier1Toast: string;
  tier2Title: string;
  tier2Body: (goalName: string, offTaskMs: number) => string;
  tier2Button: (goalName: string) => string;
  tier3Title: string;
  tier3Body: (offTaskMs: number) => string;
  tier3Placeholder: string;
  tier4Title: string;
  tier4Body: (offTaskMs: number, score: number) => string;
  recoveryToast: (seconds: number) => string;
  recoveryTitle: string;
  rapidSwitchToast: string;
}

export function getToneMessages(tone: InterventionTone): InterventionMessages {
  switch (tone) {
    case 'direct':
      return {
        tier1Toast: 'Switched away from your goal. Switch back to stop the timer.',
        tier2Title: 'You are off-task',
        tier2Body: (_g, ms) => `You've been off-task for ${formatMin(ms)}. Your daily streak is at risk.`,
        tier2Button: (g) => `Return to ${g}`,
        tier3Title: 'Log your intention',
        tier3Body: (ms) => `${formatMin(ms)} off-task. State your reason or return immediately.`,
        tier3Placeholder: 'Type your reason (required to dismiss)…',
        tier4Title: 'Extended distraction',
        tier4Body: (ms, score) => `${formatMin(ms)} off-task. Focus score: ${score}. Choose an action.`,
        recoveryToast: (s) => `Back on task after ${s}s. Time logged.`,
        recoveryTitle: 'Resumed',
        rapidSwitchToast: 'Rapid window switching detected. Take a short break to reset focus.',
      };
    case 'minimal':
      return {
        tier1Toast: 'Off-task. 1 min elapsed.',
        tier2Title: 'Off-task',
        tier2Body: (_g, ms) => `${formatMin(ms)} elapsed. Streak at risk.`,
        tier2Button: () => 'Return',
        tier3Title: 'Intention required',
        tier3Body: (ms) => `${formatMin(ms)} off-task.`,
        tier3Placeholder: 'Reason…',
        tier4Title: `${formatMin(15 * 60 * 1000)} distraction`,
        tier4Body: (ms, score) => `${formatMin(ms)}. Score ${score}.`,
        recoveryToast: (s) => `Resumed in ${s}s.`,
        recoveryTitle: 'Resumed',
        rapidSwitchToast: 'High switch rate. Break recommended.',
      };
    case 'encouraging':
    default:
      return {
        tier1Toast: 'Hey, you switched away from your goal! Switch back to keep your momentum going.',
        tier2Title: 'Your goal needs you',
        tier2Body: (goalName, ms) =>
          `You planned to finish "${goalName}" today. You've been off-task for ${formatMin(ms)}. Returning now saves your streak!`,
        tier2Button: (goalName) => `Return to ${goalName}`,
        tier3Title: 'Quick check-in',
        tier3Body: (ms) =>
          `You've been away for ${formatMin(ms)}. Tell us why — we'll log it and help you get back on track.`,
        tier3Placeholder: 'Why do you need to access this right now?…',
        tier4Title: 'Time for a mindful break',
        tier4Body: (ms, score) =>
          `You've been distracted for ${formatMin(ms)} and your focus score dropped to ${score}. Let's reset — take a 5-minute break or return to your session.`,
        recoveryToast: (seconds) =>
          `Great recovery! You returned to work in ${seconds} seconds. Streak preserved!`,
        recoveryTitle: 'Nice comeback!',
        rapidSwitchToast:
          'Lots of window switching detected — your brain may be fatigued. Consider a quick 2-minute break.',
      };
  }
}

function formatMin(ms: number): string {
  const m = Math.floor(ms / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

export function tierColor(tier: InterventionTier): string {
  switch (tier) {
    case 1:
      return 'var(--accent)';
    case 2:
      return 'var(--focus-warn)';
    case 3:
      return 'var(--focus-warn)';
    case 4:
      return 'var(--focus-bad)';
  }
}

export function tierLabel(tier: InterventionTier): string {
  switch (tier) {
    case 1:
      return 'Gentle Nudge';
    case 2:
      return 'Goal Impact';
    case 3:
      return 'Intention Check';
    case 4:
      return 'Break Time';
  }
}
