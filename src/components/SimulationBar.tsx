import { useState } from 'react';
import { Monitor, Cpu, Radio, Terminal } from 'lucide-react';
import type { TrackedApp, AppCategory } from '@/lib/types';
import { AppIcon } from './AppIcon';
import { cn } from '@/lib/utils';

interface SimulationBarProps {
  apps: TrackedApp[];
  activeTitle: string | null;
  isNative: boolean;
  onSelect: (title: string, category: AppCategory, color: string, icon: string) => void;
}

export function SimulationBar({ apps, activeTitle, isNative, onSelect }: SimulationBarProps) {
  const [customTitle, setCustomTitle] = useState('');

  const submitCustom = () => {
    if (!customTitle.trim()) return;
    // Custom titles default to neutral; the context engine will override to
    // productive if a whitelist keyword is found.
    onSelect(customTitle.trim(), 'neutral', '#d29922', 'globe');
    setCustomTitle('');
  };

  return (
    <div className="flex items-center gap-2 px-4 h-12 border-b border-[var(--border-subtle)] bg-[var(--bg-elevated)] overflow-x-auto">
      <div className="flex items-center gap-2 flex-shrink-0 pr-3 border-r border-[var(--border-subtle)]">
        {isNative ? (
          <>
            <Cpu size={16} className="text-[var(--focus-good)]" />
            <span className="text-xs font-medium text-[var(--focus-good)]">Native Monitoring</span>
          </>
        ) : (
          <>
            <Radio size={16} className="text-[var(--accent)] animate-pulse-soft" />
            <span className="text-xs font-medium text-[var(--accent)]">Simulation</span>
          </>
        )}
      </div>

      {isNative ? (
        <div className="flex items-center gap-2 text-xs text-[var(--text-muted)] px-2">
          <Monitor size={14} />
          <span>Tracking live foreground window via Tauri v2…</span>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-[var(--text-muted)] flex-shrink-0">Active window:</span>
            {apps.map((app) => {
              const active = activeTitle === app.title;
              return (
                <button
                  key={app.id}
                  onClick={() => onSelect(app.title, app.category, app.color, app.icon ?? 'globe')}
                  className={cn(
                    'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 flex-shrink-0',
                    active
                      ? 'bg-[var(--accent-soft)] text-[var(--accent)] border border-[rgba(45,212,191,0.3)]'
                      : 'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] border border-transparent',
                  )}
                >
                  <AppIcon iconKey={app.icon ?? 'globe'} size={14} color={active ? app.color : undefined} />
                  <span className="whitespace-nowrap">{app.title}</span>
                </button>
              );
            })}
          </div>

          {/* Custom title input */}
          <div className="flex items-center gap-1.5 flex-shrink-0 ml-2 pl-3 border-l border-[var(--border-subtle)]">
            <Terminal size={14} className="text-[var(--text-muted)]" />
            <input
              value={customTitle}
              onChange={(e) => setCustomTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && submitCustom()}
              placeholder="Simulate Window Title…"
              className="w-56 h-8 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-lg px-2.5 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] placeholder:text-[var(--text-muted)]"
            />
            <button
              onClick={submitCustom}
              disabled={!customTitle.trim()}
              className="h-8 px-2.5 rounded-lg text-xs font-medium bg-[var(--accent-soft)] text-[var(--accent)] border border-[rgba(45,212,191,0.2)] hover:brightness-110 disabled:opacity-40 disabled:pointer-events-none transition-all"
            >
              Test
            </button>
          </div>
        </>
      )}
    </div>
  );
}
