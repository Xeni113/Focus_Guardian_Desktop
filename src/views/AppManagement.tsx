import { useState } from 'react';
import { GripVertical, Plus, Trash2, Search, Tag, Shield, Check } from 'lucide-react';
import type { FocusStore } from '@/lib/useFocusStore';
import type { AppCategory, TrackedApp } from '@/lib/types';
import { Card, SectionTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { AppIcon, ICON_OPTIONS } from '@/components/AppIcon';
import { Modal, ModalHeader } from '@/components/ui/Modal';
import { formatDuration } from '@/lib/focusEngine';
import { cn } from '@/lib/utils';

interface AppManagementProps {
  store: FocusStore;
}

const CATEGORIES: { key: AppCategory; label: string; color: string }[] = [
  { key: 'productive', label: 'Productive', color: 'var(--focus-good)' },
  { key: 'neutral', label: 'Neutral', color: 'var(--focus-warn)' },
  { key: 'distracting', label: 'Distracting', color: 'var(--focus-bad)' },
];

const COLORS = ['#3fb950', '#2dd4bf', '#38bdf8', '#d29922', '#fb7185', '#a78bfa', '#f85149'];

export function AppManagement({ store }: AppManagementProps) {
  const [filter, setFilter] = useState('');
  const [dragId, setDragId] = useState<string | null>(null);
  const [dragOverCat, setDragOverCat] = useState<AppCategory | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [newKeyword, setNewKeyword] = useState('');

  const filtered = store.apps.filter((a) => a.title.toLowerCase().includes(filter.toLowerCase()));

  const handleDrop = (cat: AppCategory) => {
    if (dragId) store.setAppCategory(dragId, cat);
    setDragId(null);
    setDragOverCat(null);
  };

  const appTime = (title: string) =>
    store.sessions.filter((s) => s.title === title).reduce((a, b) => a + b.durationMs, 0);

  const addKeyword = () => {
    const kw = newKeyword.trim();
    if (!kw) return;
    if (!store.settings.whitelistKeywords.includes(kw)) {
      store.updateSettings({ whitelistKeywords: [...store.settings.whitelistKeywords, kw] });
    }
    setNewKeyword('');
  };

  const removeKeyword = (kw: string) => {
    store.updateSettings({ whitelistKeywords: store.settings.whitelistKeywords.filter((k) => k !== kw) });
  };

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full">
      {/* Whitelist keyword editor */}
      <Card>
        <SectionTitle
          title="Whitelist Keywords"
          subtitle="Auto-classify windows as productive when these keywords appear in the title"
          icon={<Shield size={16} />}
        />
        <div className="flex gap-2 mb-4">
          <input
            value={newKeyword}
            onChange={(e) => setNewKeyword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addKeyword()}
            placeholder="Add keyword (e.g. 'Tutorial', 'Docs')…"
            className="flex-1 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-lg px-3 h-10 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
          />
          <Button variant="primary" size="md" onClick={addKeyword} disabled={!newKeyword.trim()}>
            <Plus size={16} /> Add
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {store.settings.whitelistKeywords.map((kw) => (
            <div
              key={kw}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[rgba(63,185,80,0.1)] border border-[rgba(63,185,80,0.25)] text-sm text-[var(--focus-good)] group"
            >
              <Check size={13} />
              <span>{kw}</span>
              <button
                onClick={() => removeKeyword(kw)}
                className="opacity-50 group-hover:opacity-100 hover:text-[var(--error)] transition-all"
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}
          {store.settings.whitelistKeywords.length === 0 && (
            <p className="text-xs text-[var(--text-muted)] py-2">No keywords yet. Add one above.</p>
          )}
        </div>
        <p className="text-xs text-[var(--text-muted)] mt-3">
          Tip: Type a custom window title in the simulation bar containing a keyword (e.g. "PW Organic Chemistry") to test live classification.
        </p>
      </Card>

      {/* App classification */}
      <Card>
        <SectionTitle
          title="App Classification"
          subtitle="Drag apps between columns or click a tag to reclassify"
          icon={<Tag size={16} />}
          action={
            <Button size="sm" variant="primary" onClick={() => setShowAdd(true)}>
              <Plus size={16} /> Add App
            </Button>
          }
        />

        <div className="relative mb-4">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Search apps…"
            className="w-full bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-lg pl-10 pr-3 h-9 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {CATEGORIES.map((cat) => {
            const apps = filtered.filter((a) => a.category === cat.key);
            return (
              <div
                key={cat.key}
                onDragOver={(e) => { e.preventDefault(); setDragOverCat(cat.key); }}
                onDragLeave={() => setDragOverCat(null)}
                onDrop={() => handleDrop(cat.key)}
                className={cn(
                  'fluent-surface p-3 min-h-[200px] transition-all',
                  dragOverCat === cat.key && 'border-[var(--accent)] bg-[var(--accent-soft)]',
                )}
              >
                <div className="flex items-center justify-between mb-3 px-1">
                  <span className="text-sm font-semibold" style={{ color: cat.color }}>{cat.label}</span>
                  <span className="text-xs text-[var(--text-muted)]">{apps.length}</span>
                </div>
                <div className="space-y-2">
                  {apps.map((app) => (
                    <div
                      key={app.id}
                      draggable
                      onDragStart={() => setDragId(app.id)}
                      onDragEnd={() => setDragId(null)}
                      className="group flex items-center gap-2.5 p-2.5 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)] hover:border-[var(--border-default)] cursor-grab active:cursor-grabbing transition-all"
                    >
                      <GripVertical size={14} className="text-[var(--text-muted)] flex-shrink-0 group-hover:text-[var(--text-secondary)]" />
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ background: `${app.color}22`, border: `1px solid ${app.color}44` }}
                      >
                        <AppIcon iconKey={app.icon ?? 'globe'} size={16} color={app.color} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-[var(--text-primary)] truncate">{app.title}</p>
                        <p className="text-xs text-[var(--text-muted)]">{formatDuration(appTime(app.title))} tracked</p>
                      </div>
                      <button
                        onClick={() => store.removeApp(app.id)}
                        className="opacity-0 group-hover:opacity-100 text-[var(--text-muted)] hover:text-[var(--error)] transition-all"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                  {apps.length === 0 && (
                    <p className="text-xs text-[var(--text-muted)] text-center py-6">Drop apps here</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <AddAppModal open={showAdd} onClose={() => setShowAdd(false)} onAdd={store.addApp} />
    </div>
  );
}

function AddAppModal({
  open,
  onClose,
  onAdd,
}: {
  open: boolean;
  onClose: () => void;
  onAdd: (app: Omit<TrackedApp, 'id'>) => void;
}) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<AppCategory>('neutral');
  const [icon, setIcon] = useState('globe');
  const [color, setColor] = useState(COLORS[0]);

  const submit = () => {
    if (!title.trim()) return;
    onAdd({ title: title.trim(), category, icon, color });
    setTitle('');
    setCategory('neutral');
    setIcon('globe');
    setColor(COLORS[0]);
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose}>
      <ModalHeader title="Add Application" onClose={onClose} icon={<Plus size={18} />} />
      <div className="space-y-4">
        <div>
          <label className="text-xs text-[var(--text-muted)] mb-1.5 block">Window title</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Slack - General"
            className="w-full bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-lg px-3 h-10 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
          />
        </div>
        <div>
          <label className="text-xs text-[var(--text-muted)] mb-1.5 block">Category</label>
          <div className="grid grid-cols-3 gap-2">
            {CATEGORIES.map((c) => (
              <button
                key={c.key}
                onClick={() => setCategory(c.key)}
                className={cn(
                  'h-9 rounded-lg text-xs font-medium border transition-all',
                  category === c.key ? 'border-current' : 'border-[var(--border-subtle)] text-[var(--text-secondary)] hover:border-[var(--border-default)]',
                )}
                style={category === c.key ? { color: c.color, background: 'var(--bg-surface)' } : undefined}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="text-xs text-[var(--text-muted)] mb-1.5 block">Icon</label>
          <div className="flex flex-wrap gap-1.5">
            {ICON_OPTIONS.map((key) => (
              <button
                key={key}
                onClick={() => setIcon(key)}
                className={cn(
                  'w-9 h-9 rounded-lg flex items-center justify-center border transition-all',
                  icon === key ? 'border-[var(--accent)] bg-[var(--accent-soft)]' : 'border-[var(--border-subtle)] text-[var(--text-muted)] hover:border-[var(--border-default)]',
                )}
              >
                <AppIcon iconKey={key} size={18} color={icon === key ? 'var(--accent)' : undefined} />
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="text-xs text-[var(--text-muted)] mb-1.5 block">Color</label>
          <div className="flex gap-2">
            {COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className={cn('w-7 h-7 rounded-full transition-all', color === c && 'ring-2 ring-offset-2 ring-offset-[var(--bg-elevated)]')}
                style={{ background: c, boxShadow: color === c ? `0 0 0 2px ${c}` : undefined }}
              />
            ))}
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
          <Button variant="primary" size="sm" onClick={submit} disabled={!title.trim()}>
            <Plus size={16} /> Add
          </Button>
        </div>
      </div>
    </Modal>
  );
}
