import { type ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface BadgeProps {
  children: ReactNode;
  variant?: 'default' | 'productive' | 'neutral' | 'distracting' | 'accent';
  className?: string;
}

const variantStyles: Record<NonNullable<BadgeProps['variant']>, string> = {
  default: 'bg-[var(--bg-surface)] text-[var(--text-secondary)] border-[var(--border-subtle)]',
  productive: 'bg-[rgba(63,185,80,0.12)] text-[var(--focus-good)] border-[rgba(63,185,80,0.25)]',
  neutral: 'bg-[rgba(210,153,34,0.12)] text-[var(--focus-warn)] border-[rgba(210,153,34,0.25)]',
  distracting: 'bg-[rgba(248,81,73,0.12)] text-[var(--focus-bad)] border-[rgba(248,81,73,0.25)]',
  accent: 'accent-chip',
};

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full border',
        variantStyles[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
