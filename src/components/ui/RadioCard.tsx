export type QuestionAccent = 'teal' | 'coral' | 'amber'

const RADIO_ACCENT: Record<QuestionAccent, { border: string; bg: string; dot: string }> = {
  teal: { border: 'border-teal-500', bg: 'bg-teal-50', dot: 'bg-teal-500' },
  coral: { border: 'border-coral-700', bg: 'bg-coral-100', dot: 'bg-coral-700' },
  amber: { border: 'border-amber-700', bg: 'bg-amber-50', dot: 'bg-amber-700' },
}

export function RadioCard({
  icon,
  iconSrc,
  label,
  active,
  accent = 'teal',
  onClick,
}: {
  icon?: string
  iconSrc?: string
  label: string
  active: boolean
  accent?: QuestionAccent
  onClick: () => void
}) {
  const a = RADIO_ACCENT[accent]
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-2 rounded-2xl border-[1.5px] p-3 text-left shadow-xs transition-colors ${
        active ? `${a.border} ${a.bg}` : 'border-forest-100 bg-surface'
      }`}
    >
      <span
        className={`flex size-5 shrink-0 items-center justify-center rounded-full border-[1.5px] ${
          active ? `${a.border} bg-surface` : 'border-forest-100 bg-forest-100'
        }`}
      >
        {active && <span className={`size-2.5 rounded-full ${a.dot}`} />}
      </span>
      {iconSrc ? (
        <img src={iconSrc} alt="" className="size-8 shrink-0" />
      ) : (
        icon && <span className="text-lg">{icon}</span>
      )}
      <span className="text-sm font-medium text-forest-900">{label}</span>
    </button>
  )
}

export function ChoiceTile({
  icon,
  iconSrc,
  label,
  active,
  onClick,
}: {
  icon?: string
  iconSrc?: string
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`relative flex h-[72px] flex-col items-center justify-center gap-1 rounded-2xl border-[1.5px] px-1 text-center shadow-xs transition-colors ${
        active ? 'border-coral-700 bg-coral-100' : 'border-forest-100 bg-surface'
      }`}
    >
      {iconSrc ? <img src={iconSrc} alt="" className="size-8" /> : <span className="text-2xl leading-none">{icon}</span>}
      <span className="text-xs font-medium leading-tight text-forest-900">{label}</span>
      {active && (
        <span className="absolute right-1 top-1 flex size-5 items-center justify-center rounded-full bg-coral-700 text-xs font-bold text-white">
          ✓
        </span>
      )}
    </button>
  )
}

const BADGE_ACCENT: Record<QuestionAccent, string> = {
  teal: 'bg-teal-50',
  coral: 'bg-coral-50',
  amber: 'bg-amber-50',
}

export function QuestionHeader({
  icon,
  iconSrc,
  category,
  question,
  accent = 'teal',
}: {
  icon?: string
  iconSrc?: string
  category: string
  question: string
  accent?: QuestionAccent
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <span
          className={`flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full text-lg ${BADGE_ACCENT[accent]}`}
        >
          {iconSrc ? <img src={iconSrc} alt="" className="size-full object-cover" /> : icon}
        </span>
        <span className="text-sm font-semibold text-forest-500">{category}</span>
      </div>
      <p className="text-[16px] font-semibold leading-[1.4] text-forest-900">{question}</p>
    </div>
  )
}
