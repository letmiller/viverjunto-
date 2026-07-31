import { getHouseholdIdForUser } from '../../_lib/household'
import { type Env, errorResponse, getUserId, json } from '../../_lib/session'

interface MemberRow {
  id: string
  name: string
  role: string
  whatsapp_number: string | null
  avatar_url: string | null
  monthly_contribution_target: number | null
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const userId = await getUserId(request, env)
  if (!userId) return errorResponse('Não autenticado.', 401)

  const householdId = await getHouseholdIdForUser(userId, env)
  if (!householdId) return json({ members: [] })

  const { results } = await env.DB.prepare(
    `SELECT u.id, u.name, hm.role, u.whatsapp_number, u.avatar_url, hm.monthly_contribution_target
     FROM household_members hm
     JOIN users u ON u.id = hm.user_id
     WHERE hm.household_id = ?
     ORDER BY hm.joined_at ASC`,
  )
    .bind(householdId)
    .all<MemberRow>()

  return json({ members: results })
}
