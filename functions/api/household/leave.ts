import { getHouseholdIdForUser } from '../../_lib/household'
import { type Env, errorResponse, getUserId, json } from '../../_lib/session'

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const userId = await getUserId(request, env)
  if (!userId) return errorResponse('Não autenticado.', 401)

  const householdId = await getHouseholdIdForUser(userId, env)
  if (!householdId) return errorResponse('Você não faz parte de uma casa.', 400)

  const memberCount = await env.DB.prepare('SELECT COUNT(*) AS n FROM household_members WHERE household_id = ?')
    .bind(householdId)
    .first<{ n: number }>()

  if (memberCount && memberCount.n <= 1) {
    return errorResponse('Você é a única pessoa nessa casa. Exclua a casa em vez de sair, ou convide alguém antes.', 400)
  }

  await env.DB.prepare('DELETE FROM household_members WHERE household_id = ? AND user_id = ?')
    .bind(householdId, userId)
    .run()

  const ownerCheck = await env.DB.prepare(
    "SELECT 1 FROM household_members WHERE household_id = ? AND role = 'owner'",
  )
    .bind(householdId)
    .first()

  if (!ownerCheck) {
    const nextMember = await env.DB.prepare(
      'SELECT user_id FROM household_members WHERE household_id = ? ORDER BY joined_at ASC LIMIT 1',
    )
      .bind(householdId)
      .first<{ user_id: string }>()
    if (nextMember) {
      await env.DB.prepare("UPDATE household_members SET role = 'owner' WHERE household_id = ? AND user_id = ?")
        .bind(householdId, nextMember.user_id)
        .run()
    }
  }

  return json({ ok: true })
}
