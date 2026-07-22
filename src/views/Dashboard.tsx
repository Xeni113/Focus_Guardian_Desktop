import { Flame, Target, Timer, TrendingUp, Play, Square, Clock, Pencil, X, Check } from 'lucide-react';
import type { FocusStore } from '@/lib/useFocusStore';
import { Card, SectionTitle } from '@/components/ui/Card';
import { FocusGauge } from '@/components/ui/FocusGauge';
import { TrendChart } from '@/components/ui/TrendChart';
import { FocusTimeline } from '@/components/ui/FocusTimeline';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { AppIcon } from '@/components/AppIcon';
import { formatDuration, formatClock, todayKey } from '@/lib/focusEngine';
import { statusColor, statusLabel } from '@/lib/contextEngine';
import { useEffect, useMemo, useState } from 'react';

interface DashboardProps {
  store: FocusStore;
}

export function Dashboard({ store }: DashboardProps) {
  const [sessionLabel, setSessionLabel] = useState('Deep Work');
  const [sessionMin, setSessionMin] = useState(25);
  const [goalName, setGoalName] = useState('');
  const [goalMin, setGoalMin] = useState(120);
  const [editingGoal, setEditingGoal] = useState(false);

  const today = useMemo(() => {
    const key = todayKey();
    return store.summaries.find((s) => s.date === key);
  }, [store.summaries]);

  const productiveMs = today?.productiveMs ?? 0;

  const activeSessionElapsed = store.activeFocusSession
    ? Date.now() - store.activeFocusSession.startedAt
    : 0;
  const [, force] = useState(0);
  useEffect(() => {
    const id = setInterval(() => force((x) => x + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const status = store.focusStatus;
  const sColor = statusColor(status);
  const sLabel = statusLabel(status);

  const categoryBadge = store.activeWindow
    ? store.activeWindow.category === 'productive'
      ? 'productive'
      : store.activeWindow.category === 'distracting'
        ? 'distracting'
        : 'neutral'
    : 'default';

  const handleSetGoal = () => {
    if (goalName.trim()) {
      store.setDailyGoal(goalName.trim(), goalMin);
      setEditingGoal(false);
      setGoalName('');
    }
  };

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full">
      {/* HERO: Current Focus Status */}
      <Card className="relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-30 pointer-events-none transition-opacity duration-700"
          style={{ background: `radial-gradient(ellipse 60% 100% at 50% 0%, ${sColor}, transparent 70%)` }}
        />
        <div className="relative grid grid-cols-1 lg:grid-cols-[200px_1fr_auto] gap-6 items-center">
          {/* Gauge */}
          <div className="flex flex-col items-center">
            <FocusGauge score={store.liveFocusScore} size={180} />
          </div>

          {/* Status info */}
          <div className="space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="relative flex items-center justify-center w-3 h-3">
                <span className="absolute inset-0 rounded-full animate-ping opacity-75" style={{ background: sColor }} />
                <span className="relative w-2.5 h-2.5 rounded-full" style={{ background: sColor }} />
              </div>
              <span className="text-sm font-semibold uppercase tracking-wider" style={{ color: sColor }}>
                {sLabel}
              </span>
              {store.activeWindow?.isWhitelistOverride && (
                <Badge variant="accent">Whitelist: {store.activeWindow.matchedKeyword}</Badge>
              )}
            </div>

            {store.activeWindow ? (
              <div className="flex items-center gap-4">
                <div
                  className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: `${store.activeWindow.appColor}22`, border: `1px solid ${store.activeWindow.appColor}44` }}
                >
                  <AppIcon iconKey={store.activeWindow.iconKey} size={26} color={store.activeWindow.appColor} />
                </div>
                <div className="min-w-0">
                  <p className="text-xl font-bold text-[var(--text-primary)] truncate">{store.activeWindow.title}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <Badge variant={categoryBadge}>{store.activeWindow.category}</Badge>
                    <span className="text-xs text-[var(--text-muted)]">
                      dwell: {formatDuration(store.activeWindow.dwellMs)}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-[var(--text-muted)]">No active window detected.</p>
            )}

            {/* Goal context */}
            {store.dailyGoal && (
              <div className="fluent-surface p-3 flex items-center gap-3">
                <Target size={18} className="text-[var(--accent)] flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-[var(--text-muted)]">Today's Goal</p>
                  <p className="text-sm font-medium text-[var(--text-primary)] truncate">{store.dailyGoal.name}</p>
                </div>
                <span className="text-xs text-[var(--text-muted)] tabular-nums">
                  {formatDuration(productiveMs)} / {store.dailyGoal.targetMinutes}m
                </span>
              </div>
            )}

            {/* Session timer + daily productive counter */}
            <div className="flex items-center gap-4">
              {store.activeFocusSession && (
                <div className="flex items-center gap-2">
                  <Timer size={16} className="text-[var(--accent)]" />
                  <span className="text-2xl font-bold tabular-nums text-[var(--accent)]">
                    {formatClock(activeSessionElapsed)}
                  </span>
                  <span className="text-xs text-[var(--text-muted)]">{store.activeFocusSession.label}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-sm">
                <Clock size={16} className="text-[var(--text-muted)]" />
                <span className="text-[var(--text-secondary)]">
                  Today: <span className="font-semibold text-[var(--text-primary)] tabular-nums">{formatDuration(productiveMs)}</span> productive
                </span>
              </div>
            </div>
          </div>

          {/* Streak + switch info */}
          <div className="flex flex-col gap-3 lg:w-40">
            <div className="fluent-surface p-3 text-center">
              <div className="flex items-center justify-center gap-2 text-[var(--focus-warn)]">
                <Flame size={18} />
                <span className="text-2xl font-bold tabular-nums">{store.streak}</span>
              </div>
              <p className="text-xs text-[var(--text-muted)] mt-1">day streak</p>
            </div>
            <div className="fluent-surface p-3 text-center">
              <p className="text-2xl font-bold tabular-nums text-[var(--accent)]">{store.spmCount}</p>
              <p className="text-xs text-[var(--text-muted)] mt-1">switches / 2 min</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Goal + Timeline row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Goal card */}
        <Card>
          <SectionTitle
            title="Today's Target Goal"
            subtitle="Set a specific study/work goal"
            icon={<Target size={16} />}
            action={
              store.dailyGoal && !editingGoal ? (
                <button
                  onClick={() => { setEditingGoal(true); setGoalName(store.dailyGoal!.name); setGoalMin(store.dailyGoal!.targetMinutes); }}
                  className="text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors"
                >
                  <Pencil size={14} />
                </button>
              ) : undefined
            }
          />
          {store.dailyGoal && !editingGoal ? (
            <div className="space-y-3">
              <div>
                <p className="text-lg font-semibold text-[var(--text-primary)]">{store.dailyGoal.name}</p>
                <p className="text-xs text-[var(--text-muted)] mt-1">
                  Target: {store.dailyGoal.targetMinutes} min · Set {new Date(store.dailyGoal.setAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              <div className="h-2.5 rounded-full bg-[var(--bg-surface)] overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${Math.min(100, (productiveMs / (store.dailyGoal.targetMinutes * 60 * 1000)) * 100)}%`,
                    background: 'var(--accent)',
                  }}
                />
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-[var(--text-secondary)]">{formatDuration(productiveMs)}</span>
                <span className="text-[var(--text-muted)]">{store.dailyGoal.targetMinutes}m target</span>
              </div>
              <Button variant="ghost" size="sm" className="w-full" onClick={() => store.clearDailyGoal()}>
                <X size={14} /> Clear goal
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <input
                value={goalName}
                onChange={(e) => setGoalName(e.target.value)}
                placeholder="e.g. Finish Quadratic Equations"
                className="w-full bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-lg px-3 h-10 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
              />
              <div className="flex gap-2">
                {[60, 120, 180, 240].map((m) => (
                  <button
                    key={m}
                    onClick={() => setGoalMin(m)}
                    className={`flex-1 h-9 rounded-lg text-xs font-medium transition-all ${
                      goalMin === m
                        ? 'bg-[var(--accent-soft)] text-[var(--accent)] border border-[var(--accent)]'
                        : 'bg-[var(--bg-surface)] text-[var(--text-secondary)] border border-[var(--border-subtle)]'
                    }`}
                  >
                    {m}m
                  </button>
                ))}
              </div>
              <Button variant="primary" size="md" className="w-full" disabled={!goalName.trim()} onClick={handleSetGoal}>
                <Check size={16} /> Set Goal
              </Button>
              {editingGoal && (
                <Button variant="ghost" size="sm" className="w-full" onClick={() => setEditingGoal(false)}>
                  Cancel
                </Button>
              )}
            </div>
          )}
        </Card>

        {/* Focus Timeline */}
        <Card className="lg:col-span-2">
          <SectionTitle title="Focus Timeline" subtitle="Today's activity blocks" icon={<Clock size={16} />} />
          <FocusTimeline timeline={store.timeline} />
        </Card>
      </div>

      {/* Trend + Focus session control */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <SectionTitle title="Focus Trend" subtitle="Last 7 days" icon={<TrendingUp size={16} />} />
          <TrendChart summaries={store.summaries} days={7} height={180} />
        </Card>

        <Card>
          <SectionTitle title="Focus Session" subtitle="Start a timed deep-work block" icon={<Play size={16} />} />
          {store.activeFocusSession ? (
            <div className="space-y-4">
              <div className="text-center">
                <p className="text-3xl font-bold tabular-nums text-[var(--accent)]">
                  {formatClock(activeSessionElapsed)}
                </p>
                <p className="text-xs text-[var(--text-muted)] mt-1">{store.activeFocusSession.label}</p>
              </div>
              <Button variant="danger" size="md" className="w-full" onClick={store.endActiveSession}>
                <Square size={16} /> End Session
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <input
                value={sessionLabel}
                onChange={(e) => setSessionLabel(e.target.value)}
                className="w-full bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-lg px-3 h-10 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
                placeholder="Session label"
              />
              <div className="flex gap-2">
                {[15, 25, 50].map((m) => (
                  <button
                    key={m}
                    onClick={() => setSessionMin(m)}
                    className={`flex-1 h-9 rounded-lg text-xs font-medium transition-all ${
                      sessionMin === m
                        ? 'bg-[var(--accent-soft)] text-[var(--accent)] border border-[var(--accent)]'
                        : 'bg-[var(--bg-surface)] text-[var(--text-secondary)] border border-[var(--border-subtle)]'
                    }`}
                  >
                    {m}m
                  </button>
                ))}
              </div>
              <Button variant="primary" size="md" className="w-full" onClick={() => store.startFocusSession(sessionLabel, sessionMin)}>
                <Play size={16} /> Start {sessionMin}-min session
              </Button>
            </div>
          )}
        </Card>
      </div>

      {/* Recent activity */}
      <Card>
        <SectionTitle title="Recent Activity" subtitle="Latest window switches" icon={<Clock size={16} />} />
        {store.sessions.length === 0 ? (
          <p className="text-sm text-[var(--text-muted)] py-4 text-center">
            No activity yet. {store.isSimulated && 'Pick a simulated window above or type a custom title to begin tracking.'}
          </p>
        ) : (
          <div className="space-y-1.5 max-h-64 overflow-y-auto">
            {store.sessions.slice(-12).reverse().map((s, i) => {
              const app = store.apps.find((a) => a.title === s.title);
              return (
                <div key={i} className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-[var(--bg-hover)] transition-colors">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: `${(app?.color ?? '#768390')}22` }}
                  >
                    <AppIcon iconKey={app?.icon ?? 'globe'} size={16} color={app?.color} />
                  </div>
                  <span className="text-sm text-[var(--text-primary)] flex-1 truncate">{s.title}</span>
                  <Badge variant={s.category}>{s.category}</Badge>
                  <span className="text-xs text-[var(--text-muted)] tabular-nums w-16 text-right">
                    {formatDuration(s.durationMs)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
