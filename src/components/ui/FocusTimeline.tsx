import { useMemo } from 'react';
import type { TimelineEntry } from '@/lib/types';
import { todayKey } from '@/lib/focusEngine';
import { formatDuration } from '@/lib/focusEngine';

interface FocusTimelineProps {
  timeline: TimelineEntry[];
}

/**
 * Horizontal color-coded daily activity bar.
 * Renders time blocks for the current day, colored by category.
 */
export function FocusTimeline({ timeline }: FocusTimelineProps) {
  const todayEntries = useMemo(() => {
    const key = todayKey();
    return timeline.filter((e) => todayKey(new Date(e.startedAt)) === key);
  }, [timeline]);

  const dayStart = useMemo(() => {
    if (todayEntries.length === 0) return 0;
    return new Date(todayEntries[0].startedAt).setHours(0, 0, 0, 0);
  }, [todayEntries]);

  if (todayEntries.length === 0) {
    return (
      <p className="text-sm text-[var(--text-muted)] py-4 text-center">
        No timeline activity yet. {window.location.hash === '' && 'Pick a simulated window above to start tracking.'}
      </p>
    );
  }

  const dayEnd = dayStart + 24 * 60 * 60 * 1000;
  const daySpan = dayEnd - dayStart;

  const blocks = todayEntries.map((e, i) => {
    const leftPct = ((e.startedAt - dayStart) / daySpan) * 100;
    const widthPct = Math.max(0.3, ((e.endedAt - e.startedAt) / daySpan) * 100);
    return { ...e, leftPct, widthPct, key: i };
  });

  // Compute category totals for the legend
  const totals = todayEntries.reduce(
    (acc, e) => {
      const dur = e.endedAt - e.startedAt;
      acc[e.category] += dur;
      return acc;
    },
    { productive: 0, neutral: 0, distracting: 0 },
  );

  return (
    <div>
      {/* Timeline bar */}
      <div className="relative h-12 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] overflow-hidden mb-3">
        {/* Hour gridlines */}
        {[6, 12, 18].map((h) => (
          <div
            key={h}
            className="absolute top-0 bottom-0 border-l border-[var(--border-subtle)] opacity-50"
            style={{ left: `${(h / 24) * 100}%` }}
          >
            <span className="absolute top-0.5 left-1 text-[9px] text-[var(--text-muted)]">{h}:00</span>
          </div>
        ))}
        {blocks.map((b) => (
          <div
            key={b.key}
            className="absolute top-1 bottom-1 rounded-sm transition-all duration-300 hover:brightness-125 group"
            style={{
              left: `${b.leftPct}%`,
              width: `${b.widthPct}%`,
              background: b.color,
              opacity: 0.85,
            }}
            title={`${b.title} — ${formatDuration(b.endedAt - b.startedAt)}`}
          >
            <div className="absolute -top-8 left-0 hidden group-hover:block z-10 whitespace-nowrap text-[10px] bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded px-2 py-1 text-[var(--text-primary)]">
              {b.title} · {formatDuration(b.endedAt - b.startedAt)}
            </div>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs">
        <LegendItem color="var(--focus-good)" label="Productive" ms={totals.productive} />
        <LegendItem color="var(--focus-warn)" label="Neutral" ms={totals.neutral} />
        <LegendItem color="var(--focus-bad)" label="Distracting" ms={totals.distracting} />
      </div>
    </div>
  );
}

function LegendItem({ color, label, ms }: { color: string; label: string; ms: number }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="w-2.5 h-2.5 rounded-sm" style={{ background: color }} />
      <span className="text-[var(--text-secondary)]">{label}</span>
      <span className="text-[var(--text-muted)] tabular-nums">{formatDuration(ms)}</span>
    </div>
  );
}
