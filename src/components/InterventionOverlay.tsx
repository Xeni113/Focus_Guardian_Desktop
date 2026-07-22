import { useState } from 'react';
import { Bell, Brain, Coffee, ArrowRight, X, Target, AlertTriangle } from 'lucide-react';
import type { ActiveIntervention, FocusStore } from '@/lib/useFocusStore';
import { Button } from './ui/Button';
import { formatDuration } from '@/lib/focusEngine';
import { tierColor, tierLabel } from '@/lib/toneEngine';

interface InterventionOverlayProps {
  intervention: ActiveIntervention;
  store: FocusStore;
}

export function InterventionOverlay({ intervention, store }: InterventionOverlayProps) {
  const [reason, setReason] = useState('');
  const color = tierColor(intervention.tier);
  const msg = store.messages;
  const goalName = store.dailyGoal?.name ?? 'your goal';

  // Tier 2 — Goal Impact Modal
  if (intervention.tier === 2) {
    return (
      <div
        className="fixed inset-0 z-[70] flex items-center justify-center p-4 animate-fade-in"
        style={{ background: 'rgba(13,17,23,0.7)', backdropFilter: 'blur(8px)' }}
      >
        <div className="fluent-card max-w-md w-full p-6 animate-scale-in shadow-2xl border-l-4" style={{ borderLeftColor: color }}>
          <div className="flex items-start gap-4 mb-5">
            <div className="p-3 rounded-xl" style={{ background: `${color}1a` }}>
              <Target size={24} style={{ color }} />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold uppercase tracking-wider" style={{ color }}>
                  {tierLabel(2)}
                </span>
              </div>
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">{msg.tier2Title}</h2>
              <p className="text-sm text-[var(--text-secondary)] mt-2">
                {msg.tier2Body(goalName, intervention.distractionDwellMs)}
              </p>
            </div>
          </div>

          {/* Impact stats */}
          <div className="grid grid-cols-2 gap-3 mb-5">
            <div className="fluent-surface p-3 text-center">
              <p className="text-xs text-[var(--text-muted)]">Off-task time</p>
              <p className="text-lg font-bold tabular-nums" style={{ color }}>
                {formatDuration(intervention.distractionDwellMs)}
              </p>
            </div>
            <div className="fluent-surface p-3 text-center">
              <p className="text-xs text-[var(--text-muted)]">Focus score</p>
              <p className="text-lg font-bold tabular-nums text-[var(--focus-warn)]">{intervention.focusScore}</p>
            </div>
          </div>

          <Button
            variant="primary"
            size="md"
            className="w-full"
            onClick={() => store.dismissIntervention('Returned to goal')}
          >
            <ArrowRight size={16} /> {msg.tier2Button(goalName)}
          </Button>
          <button
            className="w-full text-center text-xs text-[var(--text-muted)] hover:text-[var(--text-secondary)] mt-3 transition-colors"
            onClick={() => store.dismissIntervention('Dismissed')}
          >
            Not now
          </button>
        </div>
      </div>
    );
  }

  // Tier 3 — Backdrop blur + Intention Input
  if (intervention.tier === 3) {
    return (
      <div
        className="fixed inset-0 z-[70] flex items-center justify-center p-4 animate-blur-in"
        style={{ background: 'rgba(13,17,23,0.55)', backdropFilter: 'blur(16px)' }}
      >
        <div className="fluent-card max-w-md w-full p-6 animate-scale-in shadow-2xl border-l-4" style={{ borderLeftColor: color }}>
          <div className="flex items-start gap-4 mb-5">
            <div className="p-3 rounded-xl" style={{ background: `${color}1a` }}>
              <Brain size={24} style={{ color }} />
            </div>
            <div className="flex-1">
              <span className="text-xs font-bold uppercase tracking-wider" style={{ color }}>
                {tierLabel(3)}
              </span>
              <h2 className="text-lg font-semibold text-[var(--text-primary)] mt-1">{msg.tier3Title}</h2>
              <p className="text-sm text-[var(--text-secondary)] mt-2">{msg.tier3Body(intervention.distractionDwellMs)}</p>
            </div>
          </div>

          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={msg.tier3Placeholder}
            rows={3}
            className="w-full bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-lg px-3 py-2.5 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] resize-none mb-4"
          />

          <div className="flex gap-2 justify-end">
            <Button variant="primary" size="sm" onClick={() => store.dismissIntervention('Back to study')}>
              <ArrowRight size={16} /> Back to Study
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={!reason.trim()}
              onClick={() => store.dismissIntervention(reason.trim())}
            >
              Log reason & dismiss
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Tier 4 — Full intervention screen
  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center p-4 animate-blur-in"
      style={{ background: 'rgba(13,17,23,0.65)', backdropFilter: 'blur(20px)' }}
    >
      <div className="max-w-lg w-full text-center animate-scale-in">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-6 animate-pulse-soft" style={{ background: `${color}1a` }}>
          <Coffee size={40} style={{ color }} />
        </div>
        <div className="fluent-card p-6 border-l-4" style={{ borderLeftColor: color }}>
          <span className="text-xs font-bold uppercase tracking-wider" style={{ color }}>
            {tierLabel(4)}
          </span>
          <h2 className="text-2xl font-bold text-[var(--text-primary)] mt-2 mb-3 text-balance">
            {msg.tier4Title}
          </h2>
          <p className="text-[var(--text-secondary)] mb-6">{msg.tier4Body(intervention.distractionDwellMs, intervention.focusScore)}</p>

          {store.settings.strictMode ? (
            <div className="space-y-3">
              <div className="fluent-surface p-3 flex items-center gap-2 text-sm text-[var(--focus-bad)]">
                <AlertTriangle size={16} />
                <span>Strict Mode is ON — distracting apps are locked for 5 minutes.</span>
              </div>
              <Button variant="primary" size="md" className="w-full" onClick={() => store.dismissIntervention('Return to study')}>
                <ArrowRight size={16} /> Return to Study Session
              </Button>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button variant="outline" size="md" onClick={() => store.dismissIntervention('Return to study')}>
                <ArrowRight size={16} /> Return to Study Session
              </Button>
              <Button variant="primary" size="md" onClick={() => store.startBreak(5)}>
                <Coffee size={16} /> Take a 5-Minute Break
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/** Tier 1 toast — rendered from the store's `toast` field for tier-1 nudges + rapid switch + recovery. */
export function AppToast({ store }: { store: FocusStore }) {
  if (!store.toast) return null;
  const borderColor =
    store.toast.variant === 'success'
      ? 'var(--focus-good)'
      : store.toast.variant === 'warning'
        ? 'var(--focus-warn)'
        : 'var(--accent)';
  const Icon =
    store.toast.variant === 'success' ? <ArrowRight size={20} className="text-[var(--focus-good)] flex-shrink-0 mt-0.5" /> :
    store.toast.variant === 'warning' ? <AlertTriangle size={20} className="text-[var(--focus-warn)] flex-shrink-0 mt-0.5" /> :
    <Bell size={20} className="text-[var(--accent)] flex-shrink-0 mt-0.5" />;

  return (
    <div className="fixed top-20 right-6 z-[60] w-96 animate-toast-in">
      <div className="fluent-card p-4 shadow-2xl border-l-4" style={{ borderLeftColor: borderColor }}>
        <div className="flex items-start gap-3">
          {Icon}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-[var(--text-primary)]">{store.toast.title}</p>
            <p className="text-xs text-[var(--text-secondary)] mt-1">{store.toast.message}</p>
            {store.toast.variant === 'info' && (
              <div className="flex gap-2 mt-3">
                <Button variant="ghost" size="sm" onClick={() => store.dismissToast()}>Dismiss</Button>
                <Button variant="primary" size="sm" onClick={() => { store.dismissToast(); }}>Got it</Button>
              </div>
            )}
          </div>
          <button onClick={() => store.dismissToast()} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
