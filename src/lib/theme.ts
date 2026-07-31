export type Theme = 'light' | 'dark' | 'system'

const STORAGE_KEY = 'viver-junto-theme'

// Defaults to 'light' (not 'system') until the person picks something else —
// the app should never silently launch dark just because the device's OS
// preference is dark. 'system' itself is stored explicitly once chosen, so
// that choice is distinguishable from "never chosen" on the next visit.
export function getStoredTheme(): Theme {
  const stored = localStorage.getItem(STORAGE_KEY)
  return stored === 'light' || stored === 'dark' || stored === 'system' ? stored : 'light'
}

export function applyTheme(theme: Theme) {
  const root = document.documentElement
  if (theme === 'system') {
    root.removeAttribute('data-theme')
  } else {
    root.setAttribute('data-theme', theme)
  }
}

export function setTheme(theme: Theme) {
  localStorage.setItem(STORAGE_KEY, theme)
  applyTheme(theme)
}

export function initTheme() {
  applyTheme(getStoredTheme())
}
