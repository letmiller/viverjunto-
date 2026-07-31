import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from '../../lib/cn'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  fullWidth?: boolean
  loading?: boolean
  icon?: ReactNode
}

const variantClasses: Record<Variant, string> = {
  primary:
    'bg-coral-700 text-white shadow-sm hover:bg-coral-900 disabled:bg-forest-100 disabled:text-forest-300 disabled:shadow-none',
  secondary:
    'bg-surface text-forest-900 border border-forest-100 shadow-xs hover:border-teal-500 disabled:text-forest-300',
  ghost: 'bg-transparent text-forest-700 hover:bg-forest-50 disabled:text-forest-300',
  danger: 'bg-error text-white shadow-sm hover:opacity-90',
}

export function Button({
  variant = 'primary',
  fullWidth = true,
  loading = false,
  icon,
  disabled,
  className = '',
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-full px-6 py-4 text-[15px] font-semibold transition-colors duration-150 disabled:cursor-not-allowed',
        fullWidth && 'w-full',
        variantClasses[variant],
        className,
      )}
      {...props}
    >
      {loading ? (
        <span className="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
      ) : (
        icon
      )}
      {children}
    </button>
  )
}
