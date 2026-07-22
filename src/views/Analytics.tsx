import { useMemo } from 'react';
import { BarChart3, Clock, Layers, Zap, History } from 'lucide-react';
import type { FocusStore } from '@/lib/useFocusStore';
import type { DaySummary } from '@/lib/types';
import { Card, SectionTitle } from '@/components/ui/Card';
import { TrendChart } from '@/components/ui/TrendChart';
import { Badge } from '@/components/ui/Badge';
import { formatDuration, todayKey, dateKey } from '@/lib/focusEngine';

interface AnalyticsProps {
  store: FocusStore;
}

export function Analytics({ store }: AnalyticsProps) {
  const last14 = useMemo(() => {
    const arr: (DaySummary | null)[] = [];
    for (let i = 13; i >= 0; i--) {
      const key = dateKey(-i);
      arr.push(store.summaries.find((s) => s.date === key) ?? null);
    }
    return arr;
  }, [store.summaries]);

  const totals = useMemo(() => {
    const productive = store.summaries.reduce((a, b) => a + b.productiveMs, 0);
    const neutral = store.summaries.reduce((a, b) => a + b.neutralMs, 0);
    const distracting = store.summaries.reduce((a, b) => a + b.distractingMs, 0);
    const total = productive + neutral + distracting;
    const avgScore = store.summaries.length
      ? Math.round(store.summaries.reduce((a, b) => a + b.focusScore, 0) / store.summaries.length)
      : 0;
    return { productive, neutral, distracting, total, avgScore };
  }, [store.summaries]);

  const todayKeyStr = todayKey();
  const today = store.summaries.find((s) => s.date === todayKeyStr);

  // Category distribution bar
  const prodPct = totals.total ? (totals.productive / totals.total) * 100 : 0;
  const neutralPct = totals.total ? (totals.neutral / totals.total) * 100 : 0;
  const distractPct = totals.total ? (totals.distracting / totals.total) * 100 : 0;

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full">
      {/* Overview stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={<Clock size={18} />} label="Productive time" value={formatDuration(totals.productive)} color="var(--focus-good)" />
        <StatCard icon={<Zap size={18} />} label="Distracting time" value={formatDuration(totals.distracting)} color="var(--focus-bad)" />
        <StatCard icon={<BarChart3 size={18} />} label="Avg focus score" value={`${totals.avgScore}`} color="var(--accent)" />
        <StatCard icon={<Layers size={18} />} label="Total sessions" value={`${store.focusSessions.length + (today?.sessions ?? 0)}`} color="var(--focus-warn)" />
      </div>

      {/* 14-day trend */}
      <Card>
        <SectionTitle title="14-Day Focus Trend" subtitle="Daily focus score over the past two weeks" icon={<BarChart3 size={16} />} />
        <TrendChart summaries={store.summaries} days={14} height={200} />
      </Card>

      {/* Time distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <SectionTitle title="Time Distribution" subtitle="All-time category breakdown" icon={<Layers size={16} />} />
          <div className="space-y-4">
            <div className="flex h-8 rounded-lg overflow-hidden border border-[var(--border-subtle)]">
              <div style={{ width: `${prodPct}%`, background: 'var(--focus-good)' }} className="transition-all duration-700" />
              <div style={{ width: `${neutralPct}%`, background: 'var(--focus-warn)' }} className="transition-all duration-700" />
              <div style={{ width: `${distractPct}%`, background: 'var(--focus-bad)' }} className="transition-all duration-700" />
            </div>
            <div className="space-y-2">
              <DistRow label="Productive" pct={prodPct} ms={totals.productive} color="var(--focus-good)" />
              <DistRow label="Neutral" pct={neutralPct} ms={totals.neutral} color="var(--focus-warn)" />
              <DistRow label="Distracting" pct={distractPct} ms={totals.distracting} color="var(--focus-bad)" />
            </div>
          </div>
        </Card>

        {/* Daily breakdown */}
        <Card>
          <SectionTitle title="Daily Breakdown" subtitle="Last 14 days" icon={<History size={16} />} />
          <div className="space-y-1.5 max-h-72 overflow-y-auto">
            {last14
              .slice()
              .reverse()
              .map((d, i) => {
                if (!d) return null;
                const date = new Date(d.date);
                return (
                  <div key={i} className="flex items-center gap-3 py-2 px-2 rounded-lg hover:bg-[var(--bg-hover)]">
                    <span className="text-xs text-[var(--text-muted)] w-20">{date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                    <div className="flex-1 flex h-2.5 rounded-full overflow-hidden bg-[var(--bg-surface)]">
                      <div style={{ width: `${(d.productiveMs / (d.productiveMs + d.neutralMs + d.distractingMs || 1)) * 100}%`, background: 'var(--focus-good)' }} />
                      <div style={{ width: `${(d.neutralMs / (d.productiveMs + d.neutralMs + d.distractingMs || 1)) * 100}%`, background: 'var(--focus-warn)' }} />
                      <div style={{ width: `${(d.distractingMs / (d.productiveMs + d.neutralMs + d.distractingMs || 1)) * 100}%`, background: 'var(--focus-bad)' }} />
                    </div>
                    <Badge variant={d.focusScore >= 70 ? 'productive' : d.focusScore >= 45 ? 'neutral' : 'distracting'} className="w-9 justify-center">
                      {d.focusScore}
                    </Badge>
                  </div>
                );
              })}
          </div>
        </Card>
      </div>

      {/* Focus sessions log */}
      <Card>
        <SectionTitle title="Focus Sessions" subtitle="Completed deep-work blocks" icon={<Clock size={16} />} />
        {store.focusSessions.length === 0 ? (
          <p className="text-sm text-[var(--text-muted)] py-4 text-center">No completed sessions yet.</p>
        ) : (
          <div className="space-y-1.5 max-h-64 overflow-y-auto">
            {store.focusSessions.slice().reverse().slice(0, 20).map((s) => (
              <div key={s.id} className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-[var(--bg-hover)]">
                <div className="w-2 h-2 rounded-full" style={{ background: s.focusScore >= 70 ? 'var(--focus-good)' : 'var(--focus-warn)' }} />
                <span className="text-sm text-[var(--text-primary)] flex-1 truncate">{s.label}</span>
                <span className="text-xs text-[var(--text-muted)]">{new Date(s.startedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                <Badge variant="accent">{formatDuration(s.durationMs)}</Badge>
                <span className="text-xs tabular-nums w-8 text-right" style={{ color: s.focusScore >= 70 ? 'var(--focus-good)' : 'var(--focus-warn)' }}>
                  {s.focusScore}
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  return (
    <Card className="!p-4">
      <div className="flex items-center gap-2 mb-2" style={{ color }}>
        {icon}
        <span className="text-xs text-[var(--text-muted)] font-medium">{label}</span>
      </div>
      <p className="text-2xl font-bold tabular-nums text-[var(--text-primary)]">{value}</p>
    </Card>
  );
}

function DistRow({ label, pct, ms, color }: { label: string; pct: number; ms: number; color: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-3 h-3 rounded-full" style={{ background: color }} />
      <span className="text-sm text-[var(--text-secondary)] flex-1">{label}</span>
      <span className="text-xs text-[var(--text-muted)] tabular-nums">{formatDuration(ms)}</span>
      <span className="text-xs font-medium tabular-nums w-12 text-right" style={{ color }}>{Math.round(pct)}%</span>
    </div>
  );
}
