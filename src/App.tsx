import { useEffect, useState } from 'react';
import {
  LayoutDashboard,
  BarChart3,
  Tags,
  Settings as SettingsIcon,
  Shield,
  Minimize2,
  X,
  Radio,
} from 'lucide-react';
import type { ViewKey } from '@/lib/types';
import { useFocusStore } from '@/lib/useFocusStore';
import { SimulationBar } from '@/components/SimulationBar';
import { InterventionOverlay, AppToast } from '@/components/InterventionOverlay';
import { Dashboard } from '@/views/Dashboard';
import { Analytics } from '@/views/Analytics';
import { AppManagement } from '@/views/AppManagement';
import { SettingsView } from '@/views/Settings';
import { Landing } from '@/views/Landing';
import { cn } from '@/lib/utils';
import { evaluateActivity, initSemanticEngine } from '@/lib/ai/semanticClassifier';
import { inferAttentionState } from '@/lib/ai/attentionPredictor';

const NAV: { key: ViewKey; label: string; icon: typeof LayoutDashboard }[] = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { key: 'analytics', label: 'Analytics', icon: BarChart3 },
  { key: 'apps', label: 'Apps', icon: Tags },
  { key: 'settings', label: 'Settings', icon: SettingsIcon },
];

export default function App() {
  const store = useFocusStore();
  const [view, setView] = useState<ViewKey>('dashboard');
  const [route, setRoute] = useState<'app' | 'landing'>('app');

  // Initialize local AI pipeline on boot
  useEffect(() => {
    initSemanticEngine().catch((err) =>
      console.error('[FocusGuardian AI] Failed to initialize classifier:', err)
    );
  }, []);

  // Background Semantic & Attention Evaluation Loop
  useEffect(() => {
    const windowTitle = store.activeWindow?.title;
    const currentGoal = store.currentGoal || 'Productive Work & Study';

    if (!windowTitle) return;

    const timer = setTimeout(async () => {
      try {
        // 1. Compute local semantic embedding match
        const result = await evaluateActivity(currentGoal, windowTitle);

        store.setAiEvaluation({
          similarity: result.similarity,
          classification: result.classification,
          confidence: result.confidence,
        });

        // 2. Infer attention state & drift risk using real-time telemetry
        const switches2Min = store.recentSwitchesCount || 0;
        const dwellSeconds = store.activeWindowDwellTime || 0;
        const sessionMins = store.sessionDurationMinutes || 0;

        const attentionResult = inferAttentionState(
          result.similarity,
          switches2Min,
          dwellSeconds,
          sessionMins
        );

        store.setAttentionAnalysis(attentionResult);

        console.log('[FocusGuardian AI Analysis]', {
          windowTitle,
          currentGoal,
          similarity: result.similarity,
          classification: result.classification,
          attentionState: attentionResult.state,
          driftRisk: `${Math.round(attentionResult.driftRisk * 100)}%`,
          reason: attentionResult.reason,
        });
      } catch (err) {
        console.error('[FocusGuardian AI Evaluation Error]', err);
      }
    }, 1200); // 1.2s debounce to save CPU cycles on rapid title switches

    return () => clearTimeout(timer);
  }, [store.activeWindow?.title, store.currentGoal]);

  useEffect(() => {
    const sync = () => setRoute(window.location.hash === '#/landing' ? 'landing' : 'app');
    sync();
    window.addEventListener('hashchange', sync);
    return () => window.removeEventListener('hashchange', sync);
  }, []);

  const goLanding = () => (window.location.hash = '#/landing');
  const goApp = () => (window.location.hash = '');

  if (route === 'landing') {
    return <Landing onBack={goApp} />;
  }

  return (
    <div className="flex h-screen flex-col bg-[var(--bg-base)]">
      {/* Title bar */}
      <div className="flex items-center justify-between h-10 px-4 glass border-b border-[var(--border-subtle)] flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-[var(--accent-soft)] border border-[rgba(45,212,191,0.3)] flex items-center justify-center">
            <Shield size={16} className="text-[var(--accent)]" />
          </div>
          <span className="text-sm font-semibold text-[var(--text-primary)]">FocusGuardian</span>
          {store.isSimulated && (
            <span className="flex items-center gap-1 text-xs text-[var(--accent)] px-2 py-0.5 rounded-full accent-chip">
              <Radio size={11} className="animate-pulse-soft" /> Sim
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => store.settings.minimizeToTray && store.isNative}
            className="w-8 h-7 rounded-md hover:bg-[var(--bg-hover)] flex items-center justify-center text-[var(--text-muted)] transition-colors"
            title="Minimize to tray"
          >
            <Minimize2 size={14} />
          </button>
          <button
            className="w-8 h-7 rounded-md hover:bg-[rgba(248,81,73,0.2)] hover:text-[var(--error)] flex items-center justify-center text-[var(--text-muted)] transition-colors"
            title="Close"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Simulation bar */}
      <SimulationBar
        apps={store.apps}
        activeTitle={store.activeWindow?.title ?? null}
        isNative={store.isNative}
        onSelect={(title, category, color, icon) => store.setSimulatedWindow(title, category, color, icon)}
      />

      {/* Body: sidebar + content */}
      <div className="flex flex-1 min-h-0">
        <aside className="w-16 md:w-56 border-r border-[var(--border-subtle)] bg-[var(--bg-elevated)] flex flex-col flex-shrink-0">
          <nav className="flex-1 p-2 md:p-3 space-y-1">
            {NAV.map((item) => {
              const Icon = item.icon;
              const active = view === item.key;
              return (
                <button
                  key={item.key}
                  onClick={() => setView(item.key)}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 h-10 rounded-lg text-sm font-medium transition-all',
                    active
                      ? 'bg-[var(--accent-soft)] text-[var(--accent)] border border-[rgba(45,212,191,0.2)]'
                      : 'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] border border-transparent'
                  )}
                  title={item.label}
                >
                  <Icon size={18} className="flex-shrink-0" />
                  <span className="hidden md:inline">{item.label}</span>
                </button>
              );
            })}
          </nav>
          <div className="p-3 border-t border-[var(--border-subtle)]">
            <div className="fluent-surface p-3 text-center">
              <p className="text-2xl font-bold text-[var(--focus-warn)] tabular-nums">{store.streak}</p>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">day streak</p>
            </div>
          </div>
        </aside>

        <main className="flex-1 min-w-0 overflow-hidden">
          {view === 'dashboard' && <Dashboard store={store} />}
          {view === 'analytics' && <Analytics store={store} />}
          {view === 'apps' && <AppManagement store={store} />}
          {view === 'settings' && <SettingsView store={store} onGoLanding={goLanding} />}
        </main>
      </div>

      {/* Intervention overlays */}
      {store.activeIntervention && <InterventionOverlay intervention={store.activeIntervention} store={store} />}
      <AppToast store={store} />
    </div>
  );
}