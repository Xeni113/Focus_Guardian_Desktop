import { type ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
}

export function Card({ children, className, hover = false }: CardProps) {
  return (
    <div className={cn('fluent-card p-5', hover && 'hover:border-[var(--border-default)] transition-colors', className)}>
      {children}
    </div>
  );
}

interface SectionTitleProps {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  action?: ReactNode;
}

export function SectionTitle({ title, subtitle, icon, action }: SectionTitleProps) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-3">
        {icon && <div className="text-[var(--accent)]">{icon}</div>}
        <div>
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">{title}</h3>
          {subtitle && <p className="text-xs text-[var(--text-muted)] mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}
