import { getHouseholdIdForUser } from '../../_lib/household'
import { type Env, errorResponse, getUserId, json } from '../../_lib/session'

interface ActivityRow {
  id: string
  type: string
  description: string
  icon: string | null
  created_at: string
  user_id: string
  user_name: string
}

interface ReactionRow {
  activity_id: string
  emoji: string
  user_id: string
  user_name: string
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const userId = await getUserId(request, env)
  if (!userId) return errorResponse('Não autenticado.', 401)

  const householdId = await getHouseholdIdForUser(userId, env)
  if (!householdId) return json({ activity: [] })

  const { results: rows } = await env.DB.prepare(
    `SELECT a.id, a.type, a.description, a.icon, a.created_at, a.user_id, u.name AS user_name
     FROM activity_log a
     JOIN users u ON u.id = a.user_id
     WHERE a.household_id = ?
     ORDER BY a.created_at DESC
     LIMIT 30`,
  )
    .bind(householdId)
    .all<ActivityRow>()

  const ids = rows.map((r) => r.id)
  let reactions: ReactionRow[] = []
  if (ids.length > 0) {
    const placeholders = ids.map(() => '?').join(',')
    const { results } = await env.DB.prepare(
      `SELECT r.activity_id, r.emoji, r.user_id, u.name AS user_name
       FROM activity_reactions r
       JOIN users u ON u.id = r.user_id
       WHERE r.activity_id IN (${placeholders})`,
    )
      .bind(...ids)
      .all<ReactionRow>()
    reactions = results
  }

  const activity = rows.map((r) => ({
    ...r,
    reactions: reactions
      .filter((x) => x.activity_id === r.id)
      .map((x) => ({ emoji: x.emoji, user_id: x.user_id, user_name: x.user_name })),
  }))

  return json({ activity })
}
