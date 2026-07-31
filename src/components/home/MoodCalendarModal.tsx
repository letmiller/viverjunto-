import { useEffect, useState } from 'react'
import { Modal } from '../ui/Modal'
import { mood as moodApi, type Checkin, type ActivityEntry } from '../../lib/api'
import { localDateString, timeAgo } from '../../lib/date'

function entryDate(iso: string): string {
  return localDateString(new Date(iso.replace(' ', 'T') + 'Z'))
}

const MOOD_ICON: Record<string, string> = {
  calma: '😌',
  equilibrado: '⚖️',
  corrido: '🏃',
  sobrecarregado: '😮‍💨',
}
const WEEKDAY_LABELS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']

function monthKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function monthLabel(d: Date) {
  const raw = d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
  return raw.charAt(0).toUpperCase() + raw.slice(1)
}

export function MoodCalendarModal({
  open,
  onClose,
  feed,
}: {
  open: boolean
  onClose: () => void
  feed: ActivityEntry[]
}) {
  const [cursor, setCursor] = useState(() => new Date())
  const [checkins, setCheckins] = useState<Checkin[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setLoading(true)
    moodApi
      .month(monthKey(cursor))
      .then((r) => setCheckins(r.checkins))
      .catch(() => setCheckins([]))
      .finally(() => setLoading(false))
  }, [open, cursor])

  const year = cursor.getFullYear()
  const monthIdx = cursor.getMonth()
  const firstWeekday = new Date(year, monthIdx, 1).getDay()
  const daysInMonth = new Date(year, monthIdx + 1, 0).getDate()
  const cells: (number | null)[] = [...Array(firstWeekday).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)]
  const todayStr = localDateString()

  return (
    <Modal open={open} onClose={onClose} title="Calendário de humor">
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setCursor((c) => new Date(c.getFullYear(), c.getMonth() - 1, 1))}
            aria-label="Mês anterior"
            className="flex size-8 items-center justify-center rounded-full bg-forest-50 text-forest-700"
          >
            ‹
          </button>
          <p className="text-sm font-semibold text-forest-900">{monthLabel(cursor)}</p>
          <button
            onClick={() => setCursor((c) => new Date(c.getFullYear(), c.getMonth() + 1, 1))}
            aria-label="Próximo mês"
            className="flex size-8 items-center justify-center rounded-full bg-forest-50 text-forest-700"
          >
            ›
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1">
          {WEEKDAY_LABELS.map((l, i) => (
            <span key={i} className="text-center text-xs font-medium text-forest-500">
              {l}
            </span>
          ))}
          {cells.map((day, i) => {
            if (day === null) return <span key={i} />
            const dateStr = `${year}-${String(monthIdx + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
            const dayCheckins = checkins.filter((c) => c.date === dateStr)
            const dayActivityCount = feed.filter((e) => entryDate(e.created_at) === dateStr).length
            const isToday = dateStr === todayStr
            const isSelected = dateStr === selectedDate
            return (
              <button
                key={i}
                onClick={() => setSelectedDate((d) => (d === dateStr ? null : dateStr))}
                className={`flex flex-col items-center gap-0.5 rounded-xl py-1.5 ${
                  isSelected ? 'bg-teal-500' : isToday ? 'bg-teal-50' : ''
                }`}
              >
                <span
                  className={`text-xs ${isSelected ? 'font-bold text-white' : isToday ? 'font-bold text-teal-ink' : 'text-forest-500'}`}
                >
                  {day}
                </span>
                <div className="flex min-h-[18px] flex-wrap items-center justify-center gap-0.5">
                  {dayCheckins.map((c) => (
                    <span key={c.user_id} title={c.user_name} className="text-sm leading-none">
                      {MOOD_ICON[c.mood] ?? '·'}
                    </span>
                  ))}
                </div>
                {dayActivityCount > 0 && (
                  <span className={`size-1 rounded-full ${isSelected ? 'bg-white' : 'bg-teal-500'}`} />
                )}
              </button>
            )
          })}
        </div>

        {!loading && checkins.length === 0 && feed.length === 0 && (
          <p className="py-4 text-center text-xs text-forest-500">Nada registrado neste mês.</p>
        )}

        {selectedDate && (
          <div className="flex flex-col gap-2 rounded-2xl bg-forest-50 p-3">
            <p className="text-xs font-semibold text-forest-900">
              {new Date(selectedDate + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })}
            </p>
            {(() => {
              const dayFeed = feed.filter((e) => entryDate(e.created_at) === selectedDate)
              if (dayFeed.length === 0) {
                return <p className="text-xs text-forest-500">Nenhuma atividade registrada neste dia.</p>
              }
              return dayFeed.map((entry) => (
                <div key={entry.id} className="flex items-center gap-2 text-xs">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-surface text-xs">
                    {entry.icon ?? '💬'}
                  </span>
                  <p className="min-w-0 flex-1 text-forest-700">
                    <span className="font-semibold text-forest-900">{entry.user_name.split(' ')[0]}</span>{' '}
                    {entry.description}
                  </p>
                  <span className="shrink-0 text-forest-400">{timeAgo(entry.created_at)}</span>
                </div>
              ))
            })()}
          </div>
        )}
      </div>
    </Modal>
  )
}
