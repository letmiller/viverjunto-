import type { HTMLAttributes } from 'react'
import { cn } from '../../lib/cn'

export function Card({ className = '', ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('rounded-sm border border-forest-100 bg-surface p-4 shadow-sm', className)}
      {...props}
    />
  )
}
