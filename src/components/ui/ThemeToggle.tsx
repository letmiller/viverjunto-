import { useState } from 'react'
import { getStoredTheme, setTheme, type Theme } from '../../lib/theme'

const OPTIONS: { value: Theme; label: string; icon: string }[] = [
  { value: 'light', label: 'Claro', icon: '☀️' },
  { value: 'dark', label: 'Escuro', icon: '🌙' },
  { value: 'system', label: 'Sistema', icon: '⚙️' },
]

export function ThemeToggle() {
  const [theme, setThemeState] = useState<Theme>(getStoredTheme())

  function choose(value: Theme) {
    setTheme(value)
    setThemeState(value)
  }

  return (
    <div className="flex gap-1.5 rounded-2xl bg-forest-50 p-1">
      {OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => choose(opt.value)}
          className={`flex min-h-[32px] flex-1 items-center justify-center gap-1 rounded-xl text-xs font-semibold transition-colors ${
            theme === opt.value ? 'bg-surface text-forest-900 shadow-xs' : 'text-forest-500'
          }`}
        >
          <span>{opt.icon}</span> {opt.label}
        </button>
      ))}
    </div>
  )
}
