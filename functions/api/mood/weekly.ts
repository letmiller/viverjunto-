import { getHouseholdIdForUser } from '../../_lib/household'
import { type Env, errorResponse, getUserId, json } from '../../_lib/session'

interface CheckinRow {
  user_id: string
  user_name: string
  mood: string
  date: string
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const userId = await getUserId(request, env)
  if (!userId) return errorResponse('Não autenticado.', 401)

  const householdId = await getHouseholdIdForUser(userId, env)
  if (!householdId) return json({ checkins: [] })

  const { results } = await env.DB.prepare(
    `SELECT c.user_id, u.name AS user_name, c.mood, c.date
     FROM daily_checkins c
     JOIN users u ON u.id = c.user_id
     WHERE c.household_id = ? AND c.date >= date('now', '-6 days')
     ORDER BY c.date ASC`,
  )
    .bind(householdId)
    .all<CheckinRow>()

  return json({ checkins: results })
}
