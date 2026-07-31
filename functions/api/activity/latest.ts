import { getHouseholdIdForUser } from '../../_lib/household'
import { type Env, errorResponse, getUserId, json } from '../../_lib/session'

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const userId = await getUserId(request, env)
  if (!userId) return errorResponse('Não autenticado.', 401)

  const householdId = await getHouseholdIdForUser(userId, env)
  if (!householdId) return json({ latestAt: null })

  // Excludes the caller's own actions — no point badging you for things you
  // just did yourself.
  const row = await env.DB.prepare(
    'SELECT MAX(created_at) AS latestAt FROM activity_log WHERE household_id = ? AND user_id != ?',
  )
    .bind(householdId, userId)
    .first<{ latestAt: string | null }>()

  return json({ latestAt: row?.latestAt ?? null })
}
