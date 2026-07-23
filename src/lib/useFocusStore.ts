import type { AttentionAnalysis } from '@/lib/ai/attentionPredictor';

// 1. Inside FocusStore interface:
export interface FocusStore {
  // ... existing fields
  attentionAnalysis: AttentionAnalysis | null;
  setAttentionAnalysis: (analysis: AttentionAnalysis | null) => void;
}

// 2. Inside create():
attentionAnalysis: null,
  setAttentionAnalysis: (analysis) => set({ attentionAnalysis: analysis }),

// 1. Add to your store interface/type definition
export interface FocusStore {
  // ... existing store fields
  aiEvaluation: {
    similarity: number;
    classification: 'PRODUCTIVE' | 'NEUTRAL' | 'DISTRACTING';
    confidence: number;
  } | null;
  setAiEvaluation: (evalData: FocusStore['aiEvaluation']) => void;
}

// 2. Add inside create() initial state:
aiEvaluation: null,
  setAiEvaluation: (evalData) => set({ aiEvaluation: evalData }),

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type {
  AppCategory,
  DailyGoal,
  DaySummary,
  FocusSession,
  InterventionEvent,
  InterventionTier,
  PersistedState,
  RecoveryEvent,
  Settings,
  TimelineEntry,
  TrackedApp,
  WindowSession,
} from './types';
import { loadState, saveState, exportData } from './storage';
import { defaultState } from './defaultApps';
import { desktopController, type ActiveWindowState } from './desktopController';
import {
  computeFocusScore,
  evaluateIntervention,
  todayKey,
} from './focusEngine';
import { SwitchRateLimiter, deriveFocusStatus, type FocusStatus } from './contextEngine';
import { getToneMessages, type InterventionMessages } from './toneEngine';

export interface ActiveIntervention {
  tier: InterventionTier;
  windowTitle: string;
  distractionDwellMs: number;
  focusScore: number;
}

export interface ToastData {
  id: string;
  title: string;
  message: string;
  variant: 'info' | 'success' | 'warning';
  duration?: number;
}

export interface FocusStore {
  apps: TrackedApp[];
  sessions: WindowSession[];
  summaries: DaySummary[];
  focusSessions: FocusSession[];
  interventions: InterventionEvent[];
  recoveries: RecoveryEvent[];
  timeline: TimelineEntry[];
  settings: Settings;
  streak: number;
  totalFocusMs: number;
  dailyGoal: DailyGoal | null;
  activeWindow: ActiveWindowState | null;
  isNative: boolean;
  liveFocusScore: number;
  distractionDwellMs: number;
  switchCount: number;
  spmCount: number;
  focusStatus: FocusStatus;
  activeIntervention: ActiveIntervention | null;
  toast: ToastData | null;
  messages: InterventionMessages;
  dismissIntervention: (reason?: string) => void;
  dismissToast: () => void;
  setAppCategory: (appId: string, category: AppCategory) => void;
  addApp: (app: Omit<TrackedApp, 'id'>) => void;
  removeApp: (appId: string) => void;
  updateSettings: (patch: Partial<Settings>) => void;
  setDailyGoal: (name: string, targetMinutes: number) => void;
  clearDailyGoal: () => void;
  startFocusSession: (label: string, durationMin: number) => void;
  endActiveSession: () => void;
  activeFocusSession: FocusSession | null;
  startBreak: (minutes: number) => void;
  resetData: () => void;
  setSimulatedWindow: (title: string, category: AppCategory, color: string, icon: string) => void;
  isSimulated: boolean;
  importState: (state: PersistedState) => void;
  exportState: () => void;
}

export function useFocusStore(): FocusStore {
  const [state, setState] = useState<PersistedState>(() => defaultState());

  // Hydrate from IndexedDB/localStorage on mount (async)
  useEffect(() => {
    let cancelled = false;
    loadState().then((loaded) => {
      if (loaded && !cancelled) setState(loaded);
    });
    return () => { cancelled = true; };
  }, []);
  const [activeWindow, setActiveWindow] = useState<ActiveWindowState | null>(null);
  const [isNative, setIsNative] = useState(false);
  const [liveFocusScore, setLiveFocusScore] = useState(100);
  const [distractionDwellMs, setDistractionDwellMs] = useState(0);
  const [switchCount, setSwitchCount] = useState(0);
  const [spmCount, setSpmCount] = useState(0);
  const [activeIntervention, setActiveIntervention] = useState<ActiveIntervention | null>(null);
  const [toast, setToast] = useState<ToastData | null>(null);
  const [activeFocusSession, setActiveFocusSession] = useState<FocusSession | null>(null);
  const [breakTimer, setBreakTimer] = useState<{ until: number; minutes: number } | null>(null);

  const sessionRef = useRef<WindowSession | null>(null);
  const firedTiersRef = useRef<Set<InterventionTier>>(new Set());
  const stateRef = useRef(state);
  stateRef.current = state;
  const spmRef = useRef(new SwitchRateLimiter());
  const distractionStartRef = useRef<number | null>(null);
  const wasOffTaskRef = useRef(false);
  const toastShownRef = useRef(false);

  // Persist on every state change
  useEffect(() => {
    saveState(state);
  }, [state]);

  // Sync desktop controller config with app list + whitelist
  useEffect(() => {
    desktopController.updateConfig({
      appTitles: state.apps.map((a) => ({ title: a.title, color: a.color, icon: a.icon ?? 'globe', category: a.category })),
      whitelist: state.settings.whitelistKeywords,
    });
  }, [state.apps, state.settings.whitelistKeywords]);

  // Start desktop controller
  useEffect(() => {
    desktopController.start();
    setIsNative(desktopController.isNativeMode);
    const unsub = desktopController.onActiveWindowChange((win) => {
      setActiveWindow(win);
    });
    return () => {
      unsub();
      desktopController.stop();
    };
  }, []);

  // Track session + switches + timeline + recovery
  useEffect(() => {
    if (!activeWindow) return;

    const now = Date.now();

    // Close previous session + add timeline entry
    if (sessionRef.current && sessionRef.current.title !== activeWindow.title) {
      const ended = now;
      const completed: WindowSession = {
        ...sessionRef.current,
        endedAt: ended,
        durationMs: ended - sessionRef.current.startedAt,
      };
      const app = stateRef.current.apps.find((a) => a.title === completed.title);
      const timelineEntry: TimelineEntry = {
        title: completed.title,
        category: completed.category,
        startedAt: completed.startedAt,
        endedAt: completed.endedAt,
        color: app?.color ?? '#768390',
      };
      setState((s) => ({
        ...s,
        sessions: [...s.sessions.slice(-500), completed],
        timeline: [...s.timeline.slice(-1000), timelineEntry],
      }));
      sessionRef.current = null;

      // SPM tracking
      const count = spmRef.current.recordSwitch(now);
      setSpmCount(count);
      setSwitchCount(count);

      // Rapid switch warning
      if (count > stateRef.current.settings.spmThreshold && !toastShownRef.current) {
        toastShownRef.current = true;
        const msg = getToneMessages(stateRef.current.settings.tone);
        setToast({
          id: `spm-${now}`,
          title: 'Brain Fatigue',
          message: msg.rapidSwitchToast,
          variant: 'warning',
          duration: 8000,
        });
        setTimeout(() => {
          setToast(null);
          toastShownRef.current = false;
        }, 8000);
      }
    }

    // Open new session
    if (!sessionRef.current) {
      sessionRef.current = {
        title: activeWindow.title,
        category: activeWindow.category,
        startedAt: now,
        endedAt: 0,
        durationMs: 0,
      };
    }

    // Recovery detection: switched to productive after being off-task
    if (activeWindow.category === 'productive' && wasOffTaskRef.current && distractionStartRef.current) {
      const offTaskDuration = now - distractionStartRef.current;
      const recoverySpeed = now - distractionStartRef.current;
      const recovery: RecoveryEvent = {
        id: `rec-${now}`,
        at: now,
        offTaskDurationMs: offTaskDuration,
        recoverySpeedMs: recoverySpeed,
        streakPreserved: true,
      };
      setState((s) => ({ ...s, recoveries: [...s.recoveries.slice(-200), recovery] }));

      const msg = getToneMessages(stateRef.current.settings.tone);
      const seconds = Math.round(recoverySpeed / 1000);
      setToast({
        id: `recovery-${now}`,
        title: msg.recoveryTitle,
        message: msg.recoveryToast(seconds),
        variant: 'success',
        duration: 6000,
      });
      setTimeout(() => setToast(null), 6000);

      wasOffTaskRef.current = false;
      distractionStartRef.current = null;
    }

    // Reset fired tiers when returning to productive
    if (activeWindow.category === 'productive') {
      firedTiersRef.current.clear();
      wasOffTaskRef.current = false;
      distractionStartRef.current = null;
    }

    // Track distraction start
    if (activeWindow.category === 'distracting') {
      if (!wasOffTaskRef.current) {
        wasOffTaskRef.current = true;
        distractionStartRef.current = now;
      }
      setDistractionDwellMs(activeWindow.dwellMs);
    } else {
      setDistractionDwellMs(0);
    }
  }, [activeWindow]);

  // Recompute live focus score + evaluate interventions every 2s
  useEffect(() => {
    const tick = () => {
      const now = Date.now();
      const allSessions = sessionRef.current
        ? [
          ...stateRef.current.sessions,
          {
            title: sessionRef.current.title,
            category: sessionRef.current.category,
            startedAt: sessionRef.current.startedAt,
            endedAt: now,
            durationMs: now - sessionRef.current.startedAt,
          },
        ]
        : stateRef.current.sessions;
      const score = computeFocusScore(allSessions, now);
      setLiveFocusScore(score);

      // Intervention evaluation (off-task = distracting OR neutral past grace)
      const isOffTask = activeWindow?.category === 'distracting';
      if (activeWindow && isOffTask) {
        const tier = evaluateIntervention(
          'distracting',
          activeWindow.dwellMs,
          stateRef.current.settings,
          firedTiersRef.current,
        );
        if (tier && !activeIntervention) {
          firedTiersRef.current.add(tier);
          const msg = getToneMessages(stateRef.current.settings.tone);

          if (tier === 1) {
            // Tier 1 = toast, not a blocking overlay
            setToast({
              id: `toast-${now}`,
              title: 'Gentle Nudge',
              message: msg.tier1Toast,
              variant: 'info',
              duration: 6000,
            });
            setState((s) => ({
              ...s,
              interventions: [
                ...s.interventions.slice(-200),
                { id: `iv-${now}`, tier, at: now, windowTitle: activeWindow.title, dismissed: true },
              ],
            }));
            setTimeout(() => setToast(null), 6000);
          } else {
            setActiveIntervention({
              tier,
              windowTitle: activeWindow.title,
              distractionDwellMs: activeWindow.dwellMs,
              focusScore: score,
            });
          }
        }
      }
    };
    const id = setInterval(tick, 2000);
    return () => clearInterval(id);
  }, [activeWindow, activeIntervention]);

  // Roll up today's summary periodically
  useEffect(() => {
    const id = setInterval(() => {
      setState((s) => {
        const today = todayKey();
        const todays = s.sessions.filter((sess) => todayKey(new Date(sess.startedAt)) === today);
        const productiveMs = todays.filter((x) => x.category === 'productive').reduce((a, b) => a + b.durationMs, 0);
        const neutralMs = todays.filter((x) => x.category === 'neutral').reduce((a, b) => a + b.durationMs, 0);
        const distractingMs = todays.filter((x) => x.category === 'distracting').reduce((a, b) => a + b.durationMs, 0);
        const switches = Math.max(0, todays.length - 1);
        const score = computeFocusScore(todays, Date.now());
        const goalReached = productiveMs >= s.settings.dailyFocusGoalMinutes * 60 * 1000;

        const others = s.summaries.filter((x) => x.date !== today);
        const todaySummary: DaySummary = {
          date: today,
          productiveMs,
          neutralMs,
          distractingMs,
          focusScore: score,
          switches,
          sessions: todays.length,
          streakContribution: goalReached,
        };
        const summaries = [...others, todaySummary];

        // Streak logic
        let streak = s.streak;
        let lastActiveDate = s.lastActiveDate;
        let focusStreakStart = s.focusStreakStart;
        if (goalReached && lastActiveDate !== today) {
          const y = new Date();
          y.setDate(y.getDate() - 1);
          const ykey = y.toISOString().slice(0, 10);
          if (lastActiveDate === ykey) {
            streak += 1;
          } else {
            streak = 1;
            focusStreakStart = today;
          }
          lastActiveDate = today;
        }
        const totalFocusMs = s.totalFocusMs + productiveMs - (s.summaries.find((x) => x.date === today)?.productiveMs ?? 0);
        return { ...s, summaries, streak, lastActiveDate, focusStreakStart, totalFocusMs };
      });
    }, 8000);
    return () => clearInterval(id);
  }, []);

  // Break timer countdown
  useEffect(() => {
    if (!breakTimer) return;
    const id = setInterval(() => {
      if (Date.now() >= breakTimer.until) {
        setBreakTimer(null);
        setToast({
          id: `break-end-${Date.now()}`,
          title: 'Break complete',
          message: 'Welcome back! Ready to dive back into deep work?',
          variant: 'success',
          duration: 8000,
        });
        setTimeout(() => setToast(null), 8000);
      }
    }, 1000);
    return () => clearInterval(id);
  }, [breakTimer]);

  const messages = useMemo(() => getToneMessages(state.settings.tone), [state.settings.tone]);

  const focusStatus = useMemo<FocusStatus>(
    () => deriveFocusStatus(activeWindow?.category ?? 'neutral', distractionDwellMs),
    [activeWindow, distractionDwellMs],
  );

  const dismissIntervention = useCallback((reason?: string) => {
    if (activeIntervention) {
      setState((s) => ({
        ...s,
        interventions: [
          ...s.interventions.slice(-200),
          {
            id: `iv-${Date.now()}`,
            tier: activeIntervention.tier,
            at: Date.now(),
            windowTitle: activeIntervention.windowTitle,
            reason,
            dismissed: true,
          },
        ],
      }));
    }
    setActiveIntervention(null);
    if (reason) setToast(null);
  }, [activeIntervention]);

  const dismissToast = useCallback(() => setToast(null), []);

  const setAppCategory = useCallback((appId: string, category: AppCategory) => {
    setState((s) => ({
      ...s,
      apps: s.apps.map((a) => (a.id === appId ? { ...a, category } : a)),
    }));
  }, []);

  const addApp = useCallback((app: Omit<TrackedApp, 'id'>) => {
    setState((s) => ({ ...s, apps: [...s.apps, { ...app, id: `app-${Date.now()}` }] }));
  }, []);

  const removeApp = useCallback((appId: string) => {
    setState((s) => ({ ...s, apps: s.apps.filter((a) => a.id !== appId) }));
  }, []);

  const updateSettings = useCallback((patch: Partial<Settings>) => {
    setState((s) => ({ ...s, settings: { ...s.settings, ...patch } }));
  }, []);

  const setDailyGoal = useCallback((name: string, targetMinutes: number) => {
    setState((s) => ({ ...s, dailyGoal: { name, targetMinutes, setAt: Date.now() } }));
  }, []);

  const clearDailyGoal = useCallback(() => {
    setState((s) => ({ ...s, dailyGoal: null }));
  }, []);

  const startFocusSession = useCallback((label: string, durationMin: number) => {
    setActiveFocusSession({
      id: `fs-${Date.now()}`,
      startedAt: Date.now(),
      endedAt: 0,
      durationMs: durationMin * 60 * 1000,
      focusScore: 100,
      label,
    });
  }, []);

  const endActiveSession = useCallback(() => {
    if (!activeFocusSession) return;
    const ended = Date.now();
    const completed: FocusSession = {
      ...activeFocusSession,
      endedAt: ended,
      durationMs: ended - activeFocusSession.startedAt,
      focusScore: liveFocusScore,
    };
    setState((s) => ({ ...s, focusSessions: [...s.focusSessions.slice(-200), completed] }));
    setActiveFocusSession(null);
  }, [activeFocusSession, liveFocusScore]);

  const startBreak = useCallback((minutes: number) => {
    setBreakTimer({ until: Date.now() + minutes * 60 * 1000, minutes });
    setActiveIntervention(null);
  }, []);

  const resetData = useCallback(() => {
    setState(defaultState());
    firedTiersRef.current.clear();
    spmRef.current.reset();
  }, []);

  const setSimulatedWindow = useCallback(
    (title: string, category: AppCategory, color: string, icon: string) => {
      desktopController.setSimulatedWindow(title, category, color, icon);
    },
    [],
  );

  const importState = useCallback((imported: PersistedState) => {
    setState(imported);
  }, []);

  const exportState = useCallback(() => {
    exportData(stateRef.current);
  }, []);

  return useMemo<FocusStore>(
    () => ({
      apps: state.apps,
      sessions: state.sessions,
      summaries: state.summaries,
      focusSessions: state.focusSessions,
      interventions: state.interventions,
      recoveries: state.recoveries,
      timeline: state.timeline,
      settings: state.settings,
      streak: state.streak,
      totalFocusMs: state.totalFocusMs,
      dailyGoal: state.dailyGoal,
      activeWindow,
      isNative,
      liveFocusScore,
      distractionDwellMs,
      switchCount,
      spmCount,
      focusStatus,
      activeIntervention,
      toast,
      messages,
      dismissIntervention,
      dismissToast,
      setAppCategory,
      addApp,
      removeApp,
      updateSettings,
      setDailyGoal,
      clearDailyGoal,
      startFocusSession,
      endActiveSession,
      activeFocusSession,
      startBreak,
      resetData,
      setSimulatedWindow,
      isSimulated: !isNative,
      exportState,
      importState,
    }),
    [
      state,
      activeWindow,
      isNative,
      liveFocusScore,
      distractionDwellMs,
      switchCount,
      spmCount,
      focusStatus,
      activeIntervention,
      toast,
      messages,
      dismissIntervention,
      dismissToast,
      setAppCategory,
      addApp,
      removeApp,
      updateSettings,
      setDailyGoal,
      clearDailyGoal,
      startFocusSession,
      endActiveSession,
      activeFocusSession,
      startBreak,
      resetData,
      setSimulatedWindow,
      exportState,
      importState,
    ],
  );
}
