export type AppCategory = 'productive' | 'neutral' | 'distracting';

export type InterventionTier = 1 | 2 | 3 | 4;

export type InterventionTone = 'encouraging' | 'direct' | 'minimal';

export type FocusStatus = 'deep' | 'grace' | 'off-task';

export interface TrackedApp {
  id: string;
  title: string;
  category: AppCategory;
  icon?: string;
  color: string;
}

export interface ActiveWindow {
  title: string;
  category: AppCategory;
  appColor: string;
  iconKey: string;
}

export interface WindowSession {
  title: string;
  category: AppCategory;
  startedAt: number;
  endedAt: number;
  durationMs: number;
}

export interface TimelineEntry {
  title: string;
  category: AppCategory;
  startedAt: number;
  endedAt: number;
  color: string;
}

export interface DaySummary {
  date: string;
  productiveMs: number;
  neutralMs: number;
  distractingMs: number;
  focusScore: number;
  switches: number;
  sessions: number;
  streakContribution: boolean;
}

export interface FocusSession {
  id: string;
  startedAt: number;
  endedAt: number;
  durationMs: number;
  focusScore: number;
  label: string;
}

export interface InterventionEvent {
  id: string;
  tier: InterventionTier;
  at: number;
  windowTitle: string;
  reason?: string;
  dismissed: boolean;
}

export interface RecoveryEvent {
  id: string;
  at: number;
  offTaskDurationMs: number;
  recoverySpeedMs: number;
  streakPreserved: boolean;
}

export interface DailyGoal {
  name: string;
  targetMinutes: number;
  setAt: number;
}

export interface Settings {
  dailyFocusGoalMinutes: number;
  distractionTier1Ms: number;
  distractionTier2Ms: number;
  distractionTier3Ms: number;
  distractionTier4Ms: number;
  switchFrequencyThreshold: number;
  spmWindowMs: number;
  spmThreshold: number;
  minimizeToTray: boolean;
  startOnBoot: boolean;
  notificationsEnabled: boolean;
  accentColor: string;
  tone: InterventionTone;
  strictMode: boolean;
  whitelistKeywords: string[];
}

export type ViewKey = 'dashboard' | 'analytics' | 'apps' | 'settings';

export interface PersistedState {
  apps: TrackedApp[];
  sessions: WindowSession[];
  summaries: DaySummary[];
  focusSessions: FocusSession[];
  interventions: InterventionEvent[];
  recoveries: RecoveryEvent[];
  timeline: TimelineEntry[];
  settings: Settings;
  streak: number;
  lastActiveDate: string;
  focusStreakStart: string;
  dailyGoal: DailyGoal | null;
  totalFocusMs: number;
}
