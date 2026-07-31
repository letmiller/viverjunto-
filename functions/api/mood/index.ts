import { randomId } from '../../_lib/crypto'
import { getHouseholdIdForUser, isViewer, VIEWER_ERROR_MESSAGE } from '../../_lib/household'
import { logActivity } from '../../_lib/activity'
import { type Env, errorResponse, getUserId, json } from '../../_lib/session'

const MOOD_LABELS: Record<string, { icon: string; label: string }> = {
  calma: { icon: '😌', label: 'Calma' },
  equilibrado: { icon: '⚖️', label: 'Equilibrado' },
  corrido: { icon: '🏃', label: 'Corrido' },
  sobrecarregado: { icon: '😮‍💨', label: 'Sobrecarregado' },
}

interface CheckinRow {
  user_id: string
  user_name: string
  mood: string
  date: string
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/
const MONTH_RE = /^\d{4}-\d{2}$/

function serverToday(): string {
  return new Date().toISOString().slice(0, 10)
}

function daysAgo(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString().slice(0, 10)
}

// YYYY-MM-DD strings compare lexicographically the same as chronologically.
function isRecentDate(date: string): boolean {
  return date >= daysAgo(7) && date <= serverToday()
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const userId = await getUserId(request, env)
  if (!userId) return errorResponse('Não autenticado.', 401)

  const householdId = await getHouseholdIdForUser(userId, env)
  if (!householdId) return json({ checkins: [] })

  const url = new URL(request.url)
  const monthParam = url.searchParams.get('month')
  if (monthParam && MONTH_RE.test(monthParam)) {
    const { results } = await env.DB.prepare(
      `SELECT c.user_id, u.name AS user_name, c.mood, c.date
       FROM daily_checkins c
       JOIN users u ON u.id = c.user_id
       WHERE c.household_id = ? AND c.date >= ? AND c.date < date(?, '+1 month')
       ORDER BY c.date ASC`,
    )
      .bind(householdId, `${monthParam}-01`, `${monthParam}-01`)
      .all<CheckinRow>()
    return json({ checkins: results })
  }

  const dateParam = url.searchParams.get('date')
  const date = dateParam && DATE_RE.test(dateParam) ? dateParam : serverToday()

  const { results } = await env.DB.prepare(
    `SELECT c.user_id, u.name AS user_name, c.mood, c.date
     FROM daily_checkins c
     JOIN users u ON u.id = c.user_id
     WHERE c.household_id = ? AND c.date = ?`,
  )
    .bind(householdId, date)
    .all<CheckinRow>()

  return json({ checkins: results })
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const userId = await getUserId(request, env)
  if (!userId) return errorResponse('Não autenticado.', 401)

  const householdId = await getHouseholdIdForUser(userId, env)
  if (!householdId) return errorResponse('Você ainda não faz parte de uma casa.', 400)
  if (await isViewer(userId, householdId, env)) return errorResponse(VIEWER_ERROR_MESSAGE, 403)

  const body = (await request.json().catch(() => null)) as { mood?: string; date?: string } | null
  if (!body?.mood?.trim()) return errorResponse('Informe o humor.')

  if (body.date && DATE_RE.test(body.date) && !isRecentDate(body.date)) {
    return errorResponse('Só dá pra registrar o humor de hoje ou dos últimos 7 dias.')
  }
  const date = body.date && DATE_RE.test(body.date) ? body.date : serverToday()
  const existing = await env.DB.prepare(
    'SELECT id FROM daily_checkins WHERE household_id = ? AND user_id = ? AND date = ?',
  )
    .bind(householdId, userId, date)
    .first<{ id: string }>()

  if (existing) {
    await env.DB.prepare('UPDATE daily_checkins SET mood = ? WHERE id = ?').bind(body.mood, existing.id).run()
  } else {
    await env.DB.prepare(
      'INSERT INTO daily_checkins (id, household_id, user_id, date, mood) VALUES (?, ?, ?, ?, ?)',
    )
      .bind(randomId(), householdId, userId, date, body.mood)
      .run()
  }

  const moodInfo = MOOD_LABELS[body.mood]
  await logActivity(
    env,
    householdId,
    userId,
    'mood',
    `registrou o humor: ${moodInfo?.label ?? body.mood}`,
    moodInfo?.icon ?? '💭',
  )

  return json({ ok: true })
}
