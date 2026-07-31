import { useNavigate } from 'react-router-dom'
import { Logo } from '../ui/Logo'

interface HeaderProps {
  title?: string
  showBack?: boolean
  showLogo?: boolean
  onSettings?: () => void
}

export function Header({ title, showBack, showLogo, onSettings }: HeaderProps) {
  const navigate = useNavigate()

  return (
    <header className="relative z-10 flex h-14 items-center justify-between px-4">
      <div className="flex w-9 items-center">
        {showBack && (
          <button
            onClick={() => navigate(-1)}
            aria-label="Voltar"
            className="flex size-9 items-center justify-center rounded-full text-forest-900 hover:bg-forest-100"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        )}
      </div>

      {showLogo ? <Logo compact /> : title && <h1 className="text-base font-semibold text-forest-900">{title}</h1>}

      <div className="flex w-9 items-center justify-end">
        {onSettings && (
          <button
            onClick={onSettings}
            aria-label="Configurações"
            className="flex size-9 items-center justify-center rounded-full text-forest-900 hover:bg-forest-100"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3" />
              <path
                d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        )}
      </div>
    </header>
  )
}
