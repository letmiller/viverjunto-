import type { ReactNode } from 'react'

// bg-*-50/100 accent tints never invert for dark mode (by design — see
// index.css), so any text sitting on them must also stay a fixed color.
// Only the "forest" tone's background is a neutral that DOES invert, so its
// value text can safely use the theme-adapting forest-900.
const TONES = {
  teal: { bg: 'bg-teal-50', border: 'border-teal-100', iconBg: 'bg-teal-100', titleText: 'text-teal-ink', valueText: 'text-ink' },
  coral: { bg: 'bg-coral-50', border: 'border-coral-100', iconBg: 'bg-coral-100', titleText: 'text-coral-ink', valueText: 'text-ink' },
  amber: { bg: 'bg-amber-50', border: 'border-amber-100', iconBg: 'bg-amber-100', titleText: 'text-amber-ink', valueText: 'text-ink' },
  forest: {
    bg: 'bg-forest-50',
    border: 'border-forest-100',
    iconBg: 'bg-forest-100',
    titleText: 'text-forest-700',
    valueText: 'text-forest-900',
  },
} as const

export type MiniStatTone = keyof typeof TONES

export function MiniStatTile({
  icon,
  title,
  value,
  sub,
  tone,
  layout = 'left',
  onClick,
}: {
  /** Emoji string, or a ReactNode (e.g. an <img>) for a real illustrated icon. */
  icon: string | ReactNode
  title: string
  value: string
  sub?: string
  tone: MiniStatTone
  /** 'left': icon+title row, value, muted sub (Dashboard). 'center': icon on top, value, tone-colored title below (Compras). */
  layout?: 'left' | 'center'
  onClick?: () => void
}) {
  const t = TONES[tone]
  const Comp = onClick ? 'button' : 'div'

  if (layout === 'center') {
    return (
      <Comp
        onClick={onClick}
        className={`flex flex-1 flex-col items-center gap-1 rounded-lg border ${t.border} ${t.bg} p-2 text-center shadow-xs`}
      >
        <span className={`flex size-7 items-center justify-center rounded-full ${t.iconBg} text-sm`}>{icon}</span>
        <span className={`text-sm font-bold ${t.valueText}`}>{value}</span>
        <span className={`text-xs font-medium leading-tight ${t.titleText}`}>{title}</span>
      </Comp>
    )
  }

  return (
    <Comp
      onClick={onClick}
      className={`flex flex-1 flex-col items-start gap-1 rounded-lg border ${t.border} ${t.bg} p-2 text-left shadow-xs`}
    >
      <span className="flex items-center gap-1.5">
        <span className={`flex size-7 shrink-0 items-center justify-center overflow-hidden rounded-full ${t.iconBg} text-sm`}>{icon}</span>
        <span className={`text-xs font-semibold ${t.titleText}`}>{title}</span>
      </span>
      <span className={`text-base font-bold ${t.valueText}`}>{value}</span>
      {sub && <span className="text-xs text-forest-500">{sub}</span>}
    </Comp>
  )
}
