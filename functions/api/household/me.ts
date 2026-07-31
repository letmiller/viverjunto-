import { getHouseholdIdForUser } from '../../_lib/household'
import { type Env, errorResponse, getUserId, json } from '../../_lib/session'

interface HouseholdRow {
  id: string
  name: string
  invite_code: string
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const userId = await getUserId(request, env)
  if (!userId) return errorResponse('Não autenticado.', 401)

  const householdId = await getHouseholdIdForUser(userId, env)
  if (!householdId) return json({ household: null })

  const household = await env.DB.prepare('SELECT id, name, invite_code FROM households WHERE id = ?')
    .bind(householdId)
    .first<HouseholdRow>()

  if (!household) return json({ household: null })

  return json({ household: { id: household.id, name: household.name, inviteCode: household.invite_code } })
}
