import { useEffect, useState } from 'react';
import { scoreColor, scoreLabel } from '@/lib/focusEngine';

interface FocusGaugeProps {
  score: number;
  size?: number;
  label?: boolean;
  animate?: boolean;
}

export function FocusGauge({ score, size = 180, label = true, animate = true }: FocusGaugeProps) {
  const [displayScore, setDisplayScore] = useState(0);
  const color = scoreColor(score);
  const stroke = 10;
  const radius = (size - stroke) / 2;
  const circ = 2 * Math.PI * radius;
  const offset = circ - (displayScore / 100) * circ;

  useEffect(() => {
    if (!animate) {
      setDisplayScore(score);
      return;
    }
    const start = displayScore;
    const diff = score - start;
    const duration = 800;
    const startTs = performance.now();
    let raf = 0;
    const step = (ts: number) => {
      const p = Math.min(1, (ts - startTs) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplayScore(Math.round(start + diff * eased));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [score, animate]);

  return (
    <div className="relative inline-flex flex-col items-center" style={{ width: size, height: label ? size + 28 : size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--border-subtle)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          className="animate-gauge-fill"
          style={{ filter: `drop-shadow(0 0 6px ${color})` }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-bold tabular-nums" style={{ color }}>
          {displayScore}
        </span>
        <span className="text-xs text-[var(--text-muted)] mt-1">Focus Score</span>
      </div>
      {label && (
        <span className="mt-1 text-sm font-medium" style={{ color }}>
          {scoreLabel(score)}
        </span>
      )}
    </div>
  );
}
