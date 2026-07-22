import { useRef, useState } from 'react';
import { Shield, Clock, Palette, Trash2, Download, Upload, Monitor, Info, MessageSquare, Zap, Lock } from 'lucide-react';
import type { FocusStore } from '@/lib/useFocusStore';
import type { InterventionTone } from '@/lib/types';
import { Card, SectionTitle } from '@/components/ui/Card';
import { Toggle } from '@/components/ui/Toggle';
import { Button } from '@/components/ui/Button';
import { Modal, ModalHeader } from '@/components/ui/Modal';
import { ACCENT_PRESETS } from '@/lib/defaultApps';
import { importData } from '@/lib/storage';
import { isTauri } from '@/lib/tauriBridge';
import { cn } from '@/lib/utils';

interface SettingsViewProps {
  store: FocusStore;
  onGoLanding: () => void;
}

const TONES: { key: InterventionTone; label: string; description: string }[] = [
  { key: 'encouraging', label: 'Encouraging', description: 'Supportive, goal-focused, positive framing' },
  { key: 'direct', label: 'Direct / Blunt', description: 'Factual time-wasted feedback, no fluff' },
  { key: 'minimal', label: 'Minimal', description: 'Only strict time numbers, no text advice' },
];

export function SettingsView({ store, onGoLanding }: SettingsViewProps) {
  const [showReset, setShowReset] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [importMsg, setImportMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const s = store.settings;

  const handleImport = async (file: File) => {
    try {
      const parsed = await importData(file);
      store.importState(parsed);
      setImportMsg({ ok: true, text: 'Data imported successfully!' });
    } catch (e) {
      setImportMsg({ ok: false, text: e instanceof Error ? e.message : 'Import failed' });
    }
    setTimeout(() => setImportMsg(null), 4000);
  };

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full max-w-3xl mx-auto">
      {/* Intervention thresholds — 4 tiers */}
      <Card>
        <SectionTitle title="Intervention Thresholds" subtitle="4-tier progressive escalation ladder" icon={<Shield size={16} />} />
        <div className="space-y-5">
          <SliderRow
            label="Tier 1 — Gentle toast nudge"
            description="Non-intrusive notification when you switch away"
            valueMs={s.distractionTier1Ms}
            min={30}
            max={300}
            step={30}
            unit="sec"
            onChange={(v) => store.updateSettings({ distractionTier1Ms: v * 1000 })}
          />
          <SliderRow
            label="Tier 2 — Goal impact modal"
            description="Modal showing time off-task and streak impact"
            valueMs={s.distractionTier2Ms}
            min={2}
            max={15}
            step={1}
            unit="min"
            onChange={(v) => store.updateSettings({ distractionTier2Ms: v * 60 * 1000 })}
          />
          <SliderRow
            label="Tier 3 — Intention check blur"
            description="Backdrop blur with intention input box"
            valueMs={s.distractionTier3Ms}
            min={5}
            max={30}
            step={1}
            unit="min"
            onChange={(v) => store.updateSettings({ distractionTier3Ms: v * 60 * 1000 })}
          />
          <SliderRow
            label="Tier 4 — Full break prompt"
            description="Full intervention screen: return or take a 5-min break"
            valueMs={s.distractionTier4Ms}
            min={10}
            max={45}
            step={1}
            unit="min"
            onChange={(v) => store.updateSettings({ distractionTier4Ms: v * 60 * 1000 })}
          />
        </div>
      </Card>

      {/* Tone selector */}
      <Card>
        <SectionTitle title="Intervention Tone" subtitle="How FocusGuardian talks to you" icon={<MessageSquare size={16} />} />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {TONES.map((t) => (
            <button
              key={t.key}
              onClick={() => store.updateSettings({ tone: t.key })}
              className={cn(
                'p-4 rounded-lg border text-left transition-all',
                s.tone === t.key
                  ? 'border-[var(--accent)] bg-[var(--accent-soft)]'
                  : 'border-[var(--border-subtle)] hover:border-[var(--border-default)] bg-[var(--bg-surface)]',
              )}
            >
              <p className={cn('text-sm font-semibold', s.tone === t.key ? 'text-[var(--accent)]' : 'text-[var(--text-primary)]')}>
                {t.label}
              </p>
              <p className="text-xs text-[var(--text-muted)] mt-1">{t.description}</p>
            </button>
          ))}
        </div>
      </Card>

      {/* SPM config */}
      <Card>
        <SectionTitle title="Context-Switch Detection" subtitle="Rapid switching fatigue warnings" icon={<Zap size={16} />} />
        <div className="space-y-5">
          <SliderRow
            label="Switches per 2 minutes"
            description="Triggers a brain-fatigue warning toast when exceeded"
            valueMs={s.spmThreshold * 1000}
            min={3}
            max={15}
            step={1}
            unit="switches"
            onChange={(v) => store.updateSettings({ spmThreshold: v })}
          />
        </div>
      </Card>

      {/* Daily goal + strict mode */}
      <Card>
        <SectionTitle title="Focus Goal & Strict Mode" subtitle="Daily target and enforcement" icon={<Clock size={16} />} />
        <div className="space-y-5">
          <SliderRow
            label="Daily focus goal"
            description="Minutes of productive time to maintain your streak"
            valueMs={s.dailyFocusGoalMinutes * 60 * 1000}
            min={30}
            max={480}
            step={15}
            unit="min"
            onChange={(v) => store.updateSettings({ dailyFocusGoalMinutes: v })}
          />
          <div className="h-px bg-[var(--border-subtle)]" />
          <Toggle
            label="Strict Mode"
            description="Enforces hard lockout at Tier 4 instead of offering a break choice (off by default)"
            checked={s.strictMode}
            onChange={(v) => store.updateSettings({ strictMode: v })}
          />
        </div>
      </Card>

      {/* System */}
      <Card>
        <SectionTitle title="System" subtitle="Desktop integration" icon={<Monitor size={16} />} />
        <div className="space-y-4">
          <Toggle
            label="Minimize to system tray"
            description="Keep FocusGuardian running in the background when the window is closed"
            checked={s.minimizeToTray}
            onChange={(v) => store.updateSettings({ minimizeToTray: v })}
          />
          <div className="h-px bg-[var(--border-subtle)]" />
          <Toggle
            label="Start on boot"
            description="Launch FocusGuardian automatically when Windows starts"
            checked={s.startOnBoot}
            onChange={(v) => store.updateSettings({ startOnBoot: v })}
            disabled={!isTauri()}
          />
          <div className="h-px bg-[var(--border-subtle)]" />
          <Toggle
            label="Notifications"
            description="Show Windows toast notifications for interventions"
            checked={s.notificationsEnabled}
            onChange={(v) => store.updateSettings({ notificationsEnabled: v })}
          />
        </div>
      </Card>

      {/* Appearance */}
      <Card>
        <SectionTitle title="Appearance" subtitle="Accent color" icon={<Palette size={16} />} />
        <div className="flex gap-3 flex-wrap">
          {ACCENT_PRESETS.map((preset) => (
            <button
              key={preset.value}
              onClick={() => {
                store.updateSettings({ accentColor: preset.value });
                document.documentElement.style.setProperty('--accent', preset.value);
              }}
              className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-lg border transition-all',
                s.accentColor === preset.value
                  ? 'border-current bg-[var(--bg-surface)]'
                  : 'border-[var(--border-subtle)] hover:border-[var(--border-default)]',
              )}
              style={s.accentColor === preset.value ? { color: preset.value } : undefined}
            >
              <span className="w-4 h-4 rounded-full" style={{ background: preset.value }} />
              <span className="text-sm font-medium">{preset.label}</span>
            </button>
          ))}
        </div>
      </Card>

      {/* Data & Privacy */}
      <Card>
        <SectionTitle title="Data & Privacy" subtitle="IndexedDB-backed · 100% local" icon={<Info size={16} />} />
        <div className="space-y-3">
          <div className="fluent-surface p-4 flex items-center gap-3">
            <Lock size={20} className="text-[var(--focus-good)]" />
            <p className="text-sm text-[var(--text-secondary)] flex-1">
              All data is stored locally in IndexedDB with a localStorage fallback. Zero cloud, zero telemetry.
            </p>
          </div>
          {importMsg && (
            <div
              className={cn(
                'p-3 rounded-lg text-sm',
                importMsg.ok
                  ? 'bg-[rgba(63,185,80,0.1)] text-[var(--focus-good)] border border-[rgba(63,185,80,0.2)]'
                  : 'bg-[rgba(248,81,73,0.1)] text-[var(--focus-bad)] border border-[rgba(248,81,73,0.2)]',
              )}
            >
              {importMsg.text}
            </div>
          )}
          <div className="flex flex-wrap gap-3">
            <Button variant="primary" size="sm" onClick={() => store.exportState()}>
              <Download size={16} /> Export Data (JSON)
            </Button>
            <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
              <Upload size={16} /> Import Data
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleImport(f);
                e.target.value = '';
              }}
            />
            <Button variant="outline" size="sm" onClick={onGoLanding}>
              <Download size={16} /> View landing page
            </Button>
            <Button variant="danger" size="sm" onClick={() => setShowReset(true)}>
              <Trash2 size={16} /> Reset all data
            </Button>
          </div>
        </div>
      </Card>

      <Modal open={showReset} onClose={() => setShowReset(false)} className="max-w-sm">
        <ModalHeader title="Reset all data?" onClose={() => setShowReset(false)} icon={<Trash2 size={18} />} />
        <p className="text-sm text-[var(--text-secondary)] mb-5">
          This will erase all sessions, summaries, streaks, timeline, goals, and settings. This cannot be undone.
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={() => setShowReset(false)}>Cancel</Button>
          <Button variant="danger" size="sm" onClick={() => { store.resetData(); setShowReset(false); }}>
            Reset everything
          </Button>
        </div>
      </Modal>
    </div>
  );
}

function SliderRow({
  label,
  description,
  valueMs,
  min,
  max,
  step,
  unit,
  onChange,
}: {
  label: string;
  description: string;
  valueMs: number;
  min: number;
  max: number;
  step: number;
  unit: 'sec' | 'min' | 'switches';
  onChange: (v: number) => void;
}) {
  const displayValue =
    unit === 'sec' ? Math.round(valueMs / 1000) : unit === 'min' ? Math.round(valueMs / 60000) : valueMs / 1000;
  return (
    <div>
      <div className="flex justify-between items-baseline mb-1.5">
        <div>
          <p className="text-sm font-medium text-[var(--text-primary)]">{label}</p>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">{description}</p>
        </div>
        <span className="text-sm font-semibold text-[var(--accent)] tabular-nums">
          {displayValue} {unit === 'switches' ? 'switches' : unit === 'sec' ? 'sec' : 'min'}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={displayValue}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-1.5 rounded-full appearance-none cursor-pointer bg-[var(--bg-surface)] accent-[var(--accent)]"
      />
    </div>
  );
}
