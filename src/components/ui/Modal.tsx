import { useEffect, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  className?: string;
  closeOnBackdrop?: boolean;
}

export function Modal({ open, onClose, children, className, closeOnBackdrop = true }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
      style={{ background: 'rgba(13,17,23,0.6)', backdropFilter: 'blur(8px)' }}
      onClick={() => closeOnBackdrop && onClose()}
    >
      <div
        className={cn(
          'fluent-card max-w-md w-full p-6 animate-scale-in shadow-2xl',
          className,
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

interface ModalHeaderProps {
  title: string;
  onClose: () => void;
  icon?: ReactNode;
}

export function ModalHeader({ title, onClose, icon }: ModalHeaderProps) {
  return (
    <div className="flex items-start justify-between mb-4">
      <div className="flex items-center gap-3">
        {icon && <div className="text-[var(--accent)]">{icon}</div>}
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">{title}</h2>
      </div>
      <button
        onClick={onClose}
        className="text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] rounded-lg p-1.5 transition-colors"
        aria-label="Close"
      >
        <X size={18} />
      </button>
    </div>
  );
}
