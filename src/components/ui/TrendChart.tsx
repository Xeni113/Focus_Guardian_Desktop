import { useMemo } from 'react';
import type { DaySummary } from '@/lib/types';
import { dateKey } from '@/lib/focusEngine';

interface TrendChartProps {
  summaries: DaySummary[];
  days?: number;
  height?: number;
}

/**
 * SVG-based focus score trend over the last N days. No external chart lib.
 */
export function TrendChart({ summaries, days = 7, height = 160 }: TrendChartProps) {
  const data = useMemo(() => {
    const arr: { date: string; score: number; label: string }[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const key = dateKey(-i);
      const found = summaries.find((s) => s.date === key);
      const d = new Date(key);
      arr.push({
        date: key,
        score: found?.focusScore ?? 0,
        label: d.toLocaleDateString('en-US', { weekday: 'short' }),
      });
    }
    return arr;
  }, [summaries, days]);

  const width = 100; // viewBox width units — scales responsively
  const padding = 6;
  const chartW = width - padding * 2;
  const chartH = height - padding * 2 - 20;
  const stepX = chartW / Math.max(1, data.length - 1);

  const points = data.map((d, i) => ({
    x: padding + i * stepX,
    y: padding + chartH - (d.score / 100) * chartH,
    ...d,
  }));

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaD = `${pathD} L ${points[points.length - 1]?.x ?? padding} ${padding + chartH} L ${padding} ${padding + chartH} Z`;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ height }} preserveAspectRatio="none">
      <defs>
        <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.35" />
          <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[25, 50, 75].map((g) => (
        <line
          key={g}
          x1={padding}
          x2={width - padding}
          y1={padding + chartH - (g / 100) * chartH}
          y2={padding + chartH - (g / 100) * chartH}
          stroke="var(--border-subtle)"
          strokeWidth="0.3"
          strokeDasharray="1 1"
        />
      ))}
      {points.length > 1 && <path d={areaD} fill="url(#trendGrad)" />}
      {points.length > 1 && (
        <path d={pathD} fill="none" stroke="var(--accent)" strokeWidth="1.2" strokeLinejoin="round" strokeLinecap="round" />
      )}
      {points.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r="1.4" fill="var(--accent)" />
          <text x={p.x} y={height - 4} textAnchor="middle" fontSize="3.5" fill="var(--text-muted)">
            {p.label}
          </text>
        </g>
      ))}
    </svg>
  );
}
