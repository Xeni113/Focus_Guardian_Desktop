import type { Settings, TrackedApp } from './types';

export const DEFAULT_APPS: TrackedApp[] = [
  { id: 'vscode', title: 'VS Code - main.rs', category: 'productive', icon: 'code', color: '#3fb950' },
  { id: 'pdf', title: 'PDF Reader - Class 11', category: 'productive', icon: 'book', color: '#2dd4bf' },
  { id: 'youtube', title: 'YouTube - Shorts', category: 'distracting', icon: 'play', color: '#f85149' },
  { id: 'discord', title: 'Discord - Chat', category: 'neutral', icon: 'message', color: '#d29922' },
  { id: 'reddit', title: 'Reddit - Memes', category: 'distracting', icon: 'hash', color: '#f85149' },
];

export const DEFAULT_WHITELIST_KEYWORDS = [
  'PW',
  'Physics',
  'Chemistry',
  'Maths',
  'Class 11',
  'Lecture',
  'Documentation',
  'VS Code',
  'PDF Reader',
];

export const DEFAULT_SETTINGS: Settings = {
  dailyFocusGoalMinutes: 240,
  distractionTier1Ms: 60 * 1000,
  distractionTier2Ms: 5 * 60 * 1000,
  distractionTier3Ms: 10 * 60 * 1000,
  distractionTier4Ms: 15 * 60 * 1000,
  switchFrequencyThreshold: 8,
  spmWindowMs: 2 * 60 * 1000,
  spmThreshold: 5,
  minimizeToTray: true,
  startOnBoot: false,
  notificationsEnabled: true,
  accentColor: '#2dd4bf',
  tone: 'encouraging',
  strictMode: false,
  whitelistKeywords: DEFAULT_WHITELIST_KEYWORDS,
};

export const ACCENT_PRESETS = [
  { label: 'Teal', value: '#2dd4bf' },
  { label: 'Ocean Blue', value: '#38bdf8' },
  { label: 'Forest', value: '#3fb950' },
  { label: 'Amber', value: '#d29922' },
  { label: 'Rose', value: '#fb7185' },
];

export function defaultState() {
  return {
    apps: DEFAULT_APPS,
    sessions: [],
    summaries: [],
    focusSessions: [],
    interventions: [],
    recoveries: [],
    timeline: [],
    settings: DEFAULT_SETTINGS,
    streak: 0,
    lastActiveDate: '',
    focusStreakStart: '',
    dailyGoal: null,
    totalFocusMs: 0,
  };
}
