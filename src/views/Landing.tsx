import {
  Shield,
  Brain,
  Gauge,
  BarChart3,
  Bell,
  Monitor,
  Download,
  ArrowRight,
  Check,
  Lock,
  Cpu,
  Sparkles,
  ArrowLeft,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface LandingProps {
  onBack: () => void;
}

export function Landing({ onBack }: LandingProps) {
  return (
    <div className="min-h-screen bg-[var(--bg-base)] text-[var(--text-primary)] overflow-y-auto">
      {/* Nav */}
      <nav className="sticky top-0 z-40 glass border-b border-[var(--border-subtle)]">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[var(--accent-soft)] border border-[rgba(45,212,191,0.3)] flex items-center justify-center">
              <Shield size={20} className="text-[var(--accent)]" />
            </div>
            <span className="text-lg font-semibold">FocusGuardian</span>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors flex items-center gap-1.5">
              <ArrowLeft size={16} /> Back to app
            </button>
            <Button variant="primary" size="sm">
              <Download size={16} /> Download
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-40"
          style={{
            background:
              'radial-gradient(ellipse 80% 50% at 50% -10%, var(--accent-glow), transparent 60%)',
          }}
        />
        <div className="relative max-w-6xl mx-auto px-6 pt-24 pb-20 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full accent-chip mb-6 animate-fade-in">
            <Sparkles size={14} />
            <span className="text-xs font-medium">100% Offline & Local — Zero cloud</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-balance mb-6 animate-slide-up">
            The Intelligent Desktop Assistant
            <br />
            <span className="text-[var(--accent)]">for Deep Work</span>
          </h1>
          <p className="text-lg text-[var(--text-secondary)] max-w-2xl mx-auto mb-10 text-balance animate-slide-up" style={{ animationDelay: '0.1s' }}>
            FocusGuardian quietly watches your active windows, calculates a live focus score, and
            intervenes with gentle, adaptive reminders — not annoying timers. Everything stays on your machine.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <Button variant="primary" size="lg" className="px-8">
              <Download size={20} /> Download for Windows (.exe)
            </Button>
            <Button variant="outline" size="lg" className="px-8">
              See how it works <ArrowRight size={18} />
            </Button>
          </div>
          <p className="text-xs text-[var(--text-muted)] mt-4">Free · No account required · 12 MB installer</p>
        </div>
      </section>

      {/* Privacy banner */}
      <section className="max-w-6xl mx-auto px-6 py-6">
        <div className="fluent-card p-6 flex flex-col md:flex-row items-center gap-4 border-l-4 border-l-[var(--focus-good)]">
          <div className="w-12 h-12 rounded-xl bg-[rgba(63,185,80,0.12)] flex items-center justify-center flex-shrink-0">
            <Lock size={24} className="text-[var(--focus-good)]" />
          </div>
          <div className="flex-1 text-center md:text-left">
            <h3 className="text-lg font-semibold">Your data never leaves your device</h3>
            <p className="text-sm text-[var(--text-secondary)] mt-1">
              No accounts, no servers, no telemetry. All tracking, analytics, and settings are stored
              locally in IndexedDB. Disconnect from the internet — FocusGuardian keeps working.
            </p>
          </div>
          <div className="flex gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-[var(--focus-good)]">0</p>
              <p className="text-xs text-[var(--text-muted)]">cloud calls</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-[var(--focus-good)]">100%</p>
              <p className="text-xs text-[var(--text-muted)]">offline</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-3">Built for sustained deep work</h2>
          <p className="text-[var(--text-secondary)]">Three layers of intelligent intervention that adapt to how you work.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <FeatureCard
            icon={<Monitor size={24} />}
            title="Active Window Tracking"
            description="Monitors your foreground desktop app in real time via native Win32 APIs. Classifies every app as productive, neutral, or distracting."
          />
          <FeatureCard
            icon={<Gauge size={24} />}
            title="Live Focus Score"
            description="A rolling 0–100 score blends productive time, distraction duration, and tab-switch frequency. See exactly when your attention drifts."
          />
          <FeatureCard
            icon={<Brain size={24} />}
            title="Adaptive Interventions"
            description="No fixed timers. Three escalating tiers — a subtle nudge, an intention check, and a gentle break prompt — fire only when you actually need them."
          />
          <FeatureCard
            icon={<BarChart3 size={24} />}
            title="Offline Analytics"
            description="Daily focus trends, streaks, session logs, and category breakdowns — all rendered from local data with zero network requests."
          />
          <FeatureCard
            icon={<Bell size={24} />}
            title="Customizable App Lists"
            description="Drag and drop apps between productive, neutral, and distracting. FocusGuardian learns your workflow and adapts its scoring."
          />
          <FeatureCard
            icon={<Cpu size={24} />}
            title="System Tray Integration"
            description="Minimizes to the Windows system tray. Runs silently in the background and pops in only when it matters. Optional start-on-boot."
          />
        </div>
      </section>

      {/* Intervention tiers showcase */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-3">Three tiers of gentle intervention</h2>
          <p className="text-[var(--text-secondary)]">Escalating only when you need it — never nagging.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <TierCard
            tier="Tier 1"
            icon={<Bell size={20} />}
            color="var(--accent)"
            title="Subtle Nudge"
            description="A quiet toast notification when distraction crosses 5 minutes. Acknowledge and refocus — one click."
          />
          <TierCard
            tier="Tier 2"
            icon={<Brain size={20} />}
            color="var(--focus-warn)"
            title="Intention Check"
            description="After 10 minutes, a modal asks why you're still on a distracting app. Choose a reason or get nudged back."
          />
          <TierCard
            tier="Tier 3"
            icon={<Sparkles size={20} />}
            color="var(--focus-bad)"
            title="Break Prompt"
            description="At 15 minutes, a gentle screen blur suggests a 5-minute mindful break. Your attention needs a reset."
          />
        </div>
      </section>

      {/* Tech stack */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <div className="fluent-card p-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold mb-2">Powered by Tauri v2</h2>
            <p className="text-sm text-[var(--text-secondary)]">A tiny Rust core, a familiar React shell, a native Windows experience.</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Tauri v2', note: 'Native shell' },
              { label: 'React + Vite', note: 'UI runtime' },
              { label: 'Win32 APIs', note: 'Window tracking' },
              { label: 'IndexedDB', note: 'Local storage' },
            ].map((t) => (
              <div key={t.label} className="fluent-surface p-4 text-center">
                <p className="text-sm font-semibold text-[var(--accent)]">{t.label}</p>
                <p className="text-xs text-[var(--text-muted)] mt-1">{t.note}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-6xl mx-auto px-6 py-20 text-center">
        <h2 className="text-4xl font-bold mb-4 text-balance">Take back your focus</h2>
        <p className="text-[var(--text-secondary)] mb-8 max-w-xl mx-auto">
          Install FocusGuardian in under a minute. No account, no setup wizard — just deep work.
        </p>
        <Button variant="primary" size="lg" className="px-10 text-base">
          <Download size={20} /> Download for Windows (.exe)
        </Button>
        <div className="flex justify-center gap-6 mt-8 text-sm text-[var(--text-muted)]">
          <span className="flex items-center gap-1.5"><Check size={16} className="text-[var(--focus-good)]" /> Free forever</span>
          <span className="flex items-center gap-1.5"><Check size={16} className="text-[var(--focus-good)]" /> No account</span>
          <span className="flex items-center gap-1.5"><Check size={16} className="text-[var(--focus-good)]" /> 100% private</span>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[var(--border-subtle)] py-8">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <Shield size={18} className="text-[var(--accent)]" />
            <span className="text-sm font-medium">FocusGuardian</span>
          </div>
          <p className="text-xs text-[var(--text-muted)]">
            Built with Tauri v2 · React · Win32 APIs · 100% offline
          </p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="fluent-card p-6 hover:border-[var(--accent)] transition-all duration-300 group">
      <div className="w-12 h-12 rounded-xl bg-[var(--accent-soft)] flex items-center justify-center mb-4 text-[var(--accent)] group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{description}</p>
    </div>
  );
}

function TierCard({
  tier,
  icon,
  color,
  title,
  description,
}: {
  tier: string;
  icon: React.ReactNode;
  color: string;
  title: string;
  description: string;
}) {
  return (
    <div className="fluent-card p-6 border-t-4" style={{ borderTopColor: color }}>
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xs font-bold uppercase tracking-wider" style={{ color }}>
          {tier}
        </span>
      </div>
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: `${color}22`, color }}>
          {icon}
        </div>
        <h3 className="text-lg font-semibold">{title}</h3>
      </div>
      <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{description}</p>
    </div>
  );
}
