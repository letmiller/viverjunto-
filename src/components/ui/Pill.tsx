import type { ReactNode } from 'react'

type Tone = 'coral' | 'teal' | 'amber' | 'neutral'

const toneClasses: Record<Tone, string> = {
  coral: 'bg-coral-100 text-coral-ink',
  teal: 'bg-teal-100 text-teal-ink',
  amber: 'bg-amber-100 text-amber-700',
  neutral: 'bg-forest-100 text-forest-700',
}

export function Pill({ tone = 'neutral', children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium ${toneClasses[tone]}`}>
      {children}
    </span>
  )
}
