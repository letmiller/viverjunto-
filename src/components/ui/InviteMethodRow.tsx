import type { ReactNode } from 'react'

export function InviteMethodRow({
  icon,
  iconBg,
  iconColor,
  title,
  desc,
  onClick,
}: {
  icon: ReactNode
  iconBg: string
  iconColor: string
  title: string
  desc: string
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-4 rounded-2xl border-[1.5px] border-forest-100 bg-surface px-4 py-2.5 text-left shadow-xs"
    >
      <span className={`flex size-10 shrink-0 items-center justify-center rounded-full text-xl ${iconBg} ${iconColor}`}>
        {icon}
      </span>
      <span className="flex-1">
        <span className="block text-sm font-semibold text-forest-900">{title}</span>
        <span className="block text-xs text-forest-500">{desc}</span>
      </span>
      <span className={`text-xl ${iconColor}`}>›</span>
    </button>
  )
}
