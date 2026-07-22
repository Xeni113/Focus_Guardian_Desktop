import { cn } from '@/lib/utils';

interface ToggleProps {
  checked: boolean;
  onChange: (v: boolean) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
}

export function Toggle({ checked, onChange, label, description, disabled }: ToggleProps) {
  return (
    <label className={cn('flex items-center justify-between gap-4 cursor-pointer', disabled && 'opacity-50 pointer-events-none')}>
      {(label || description) && (
        <div className="min-w-0">
          {label && <p className="text-sm font-medium text-[var(--text-primary)]">{label}</p>}
          {description && <p className="text-xs text-[var(--text-muted)] mt-0.5">{description}</p>}
        </div>
      )}
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative h-6 w-11 rounded-full transition-colors duration-200 flex-shrink-0',
          checked ? 'bg-[var(--accent)]' : 'bg-[var(--border-default)]',
        )}
      >
        <span
          className={cn(
            'absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200',
            checked && 'translate-x-5',
          )}
        />
      </button>
    </label>
  );
}
