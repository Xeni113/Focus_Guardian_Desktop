import { type ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const variants: Record<Variant, string> = {
  primary:
    'bg-[var(--accent)] text-[#0d1117] font-semibold hover:brightness-110 active:brightness-95 shadow-lg shadow-[var(--accent-glow)]',
  secondary:
    'bg-[var(--bg-surface)] text-[var(--text-primary)] border border-[var(--border-default)] hover:bg-[var(--bg-hover)]',
  ghost: 'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]',
  danger: 'bg-[var(--error)] text-white font-semibold hover:brightness-110',
  outline:
    'border border-[var(--border-default)] text-[var(--text-primary)] hover:bg-[var(--bg-hover)] hover:border-[var(--accent)]',
};

const sizes: Record<Size, string> = {
  sm: 'h-8 px-3 text-xs rounded-lg',
  md: 'h-10 px-4 text-sm rounded-lg',
  lg: 'h-12 px-6 text-base rounded-xl',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'secondary', size = 'md', ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        'inline-flex items-center justify-center gap-2 transition-all duration-200 select-none disabled:opacity-50 disabled:pointer-events-none focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-base)]',
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    />
  ),
);
Button.displayName = 'Button';
