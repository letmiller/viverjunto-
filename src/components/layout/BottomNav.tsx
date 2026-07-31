import { useEffect, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { activity as activityApi } from '../../lib/api'
import { useActivityStore } from '../../store/activity'

const items = [
  { to: '/dashboard', label: 'Início', icon: HomeIcon },
  { to: '/financas', label: 'Finanças', icon: WalletIcon },
  { to: '/organizacao', label: 'Rotina', icon: CalendarIcon },
  { to: '/lista-compras', label: 'Compras', icon: CartIcon },
  { to: '/perfil', label: 'Perfil', icon: UserIcon },
]

export function BottomNav() {
  const [latestAt, setLatestAt] = useState<string | null>(null)
  const lastSeenAt = useActivityStore((s) => s.lastSeenAt)

  useEffect(() => {
    activityApi
      .latest()
      .then((r) => setLatestAt(r.latestAt))
      .catch(() => {})
  }, [])

  const hasNewActivity = latestAt !== null && (!lastSeenAt || latestAt > lastSeenAt)

  return (
    <nav className="absolute inset-x-0 bottom-0 z-10 flex items-center justify-between border-t border-forest-100 bg-surface/95 px-4 pb-[max(12px,env(safe-area-inset-bottom))] pt-2 backdrop-blur">
      {items.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            `flex flex-1 flex-col items-center gap-1 rounded-2xl py-1.5 text-xs font-medium ${
              isActive ? 'text-teal-700' : 'text-forest-500'
            }`
          }
        >
          {({ isActive }) => (
            <>
              <span className="relative">
                <Icon active={isActive} />
                {to === '/dashboard' && hasNewActivity && (
                  <span className="absolute -right-0.5 -top-0.5 size-2 rounded-full bg-coral-700" />
                )}
              </span>
              {label}
            </>
          )}
        </NavLink>
      ))}
    </nav>
  )
}

type IconProps = { active: boolean }

function HomeIcon({ active }: IconProps) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8}>
      <path d="M3 11.5 12 4l9 7.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 10v9a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1v-9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function WalletIcon({ active }: IconProps) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8}>
      <rect x="3" y="6" width="18" height="13" rx="2.5" />
      <path d="M3 10h18" strokeLinecap="round" />
      <circle cx="16.5" cy="14" r="1.2" fill="currentColor" stroke="none" />
    </svg>
  )
}

function CalendarIcon({ active }: IconProps) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8}>
      <rect x="3.5" y="5" width="17" height="16" rx="2.5" />
      <path d="M3.5 10h17M8 3v4M16 3v4" strokeLinecap="round" />
    </svg>
  )
}

function CartIcon({ active }: IconProps) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8}>
      <path d="M3 4h2l2.2 11.4a2 2 0 0 0 2 1.6h7.6a2 2 0 0 0 2-1.6L21 8H6" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="9.5" cy="20" r="1.3" fill="currentColor" stroke="none" />
      <circle cx="17.5" cy="20" r="1.3" fill="currentColor" stroke="none" />
    </svg>
  )
}

function UserIcon({ active }: IconProps) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8}>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M4.5 20a7.5 7.5 0 0 1 15 0" strokeLinecap="round" />
    </svg>
  )
}
