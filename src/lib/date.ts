/** Returns YYYY-MM-DD for the given date using LOCAL time components (never UTC/toISOString, which can be off by a day). */
export function localDateString(date: Date = new Date()): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Formats a "YYYY-MM-DD" date string for display in pt-BR.
 * Never use `new Date(dateStr).toLocaleDateString()` for date-only strings —
 * that parses the string as UTC midnight, which renders as the previous day
 * in any timezone behind UTC (e.g. Brazil).
 */
export function formatLocalDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number)
  return new Date(year, month - 1, day).toLocaleDateString('pt-BR')
}

/** Formats an ISO/SQL timestamp (assumed UTC, no offset) as a relative "Xmin/h/d atrás" label. */
export function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso.replace(' ', 'T') + 'Z').getTime()
  const mins = Math.round(diffMs / 60000)
  if (mins < 1) return 'agora'
  if (mins < 60) return `${mins}min atrás`
  const hours = Math.round(mins / 60)
  if (hours < 24) return `${hours}h atrás`
  return `${Math.round(hours / 24)}d atrás`
}
