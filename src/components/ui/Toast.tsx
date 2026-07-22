import { type ReactNode, useEffect } from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ToastData {
  id: string;
  title: string;
  message: string;
  variant?: 'info' | 'success' | 'warning' | 'error';
}

interface ToastProps {
  toast: ToastData | null;
  onDismiss: () => void;
  /** extra content rendered in the body, e.g. action buttons */
  children?: ReactNode;
  duration?: number;
}

const icons = {
  info: <AlertCircle size={20} className="text-[var(--accent)]" />,
  success: <CheckCircle2 size={20} className="text-[var(--success)]" />,
  warning: <AlertTriangle size={20} className="text-[var(--focus-warn)]" />,
  error: <AlertCircle size={20} className="text-[var(--error)]" />,
};

export function Toast({ toast, onDismiss, children, duration = 6000 }: ToastProps) {
  useEffect(() => {
    if (!toast) return;
    if (children) return; // don't auto-dismiss if there are action buttons
    const t = setTimeout(onDismiss, duration);
    return () => clearTimeout(t);
  }, [toast, onDismiss, children, duration]);

  if (!toast) return null;

  return (
    <div className="fixed top-20 right-6 z-[60] w-96 animate-toast-in">
      <div className="fluent-card p-4 shadow-2xl border-l-4 border-l-[var(--accent)]">
        <div className="flex items-start gap-3">
          {icons[toast.variant ?? 'info']}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-[var(--text-primary)]">{toast.title}</p>
            <p className="text-xs text-[var(--text-secondary)] mt-1">{toast.message}</p>
            {children}
          </div>
          <button
            onClick={onDismiss}
            className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

export function ToastContainer({
  toasts,
  onDismiss,
}: {
  toasts: ToastData[];
  onDismiss: (id: string) => void;
}) {
  return (
    <div className="fixed top-20 right-6 z-[60] flex flex-col gap-3 w-96">
      {toasts.map((t) => (
        <div key={t.id} className="fluent-card p-4 shadow-2xl animate-toast-in border-l-4 border-l-[var(--accent)]">
          <div className="flex items-start gap-3">
            {icons[t.variant ?? 'info']}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-[var(--text-primary)]">{t.title}</p>
              <p className="text-xs text-[var(--text-secondary)] mt-1">{t.message}</p>
            </div>
            <button
              onClick={() => onDismiss(t.id)}
              className={cn('text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors')}
            >
              <X size={16} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
