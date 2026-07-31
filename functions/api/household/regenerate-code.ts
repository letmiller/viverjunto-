import { randomInviteCode } from '../../_lib/crypto'
import { getHouseholdIdForUser } from '../../_lib/household'
import { type Env, errorResponse, getUserId, json } from '../../_lib/session'

// Owner-only: rotates the household's invite code, invalidating the old one
// immediately. There is no other way to revoke a leaked/over-shared code.
export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const userId = await getUserId(request, env)
  if (!userId) return errorResponse('Não autenticado.', 401)

  const householdId = await getHouseholdIdForUser(userId, env)
  if (!householdId) return errorResponse('Você ainda não faz parte de uma casa.', 400)

  const member = await env.DB.prepare('SELECT role FROM household_members WHERE household_id = ? AND user_id = ?')
    .bind(householdId, userId)
    .first<{ role: string }>()
  if (member?.role !== 'owner') return errorResponse('Só quem criou a casa pode gerar um novo código.', 403)

  let code = randomInviteCode()
  for (let attempt = 0; attempt < 5; attempt++) {
    const clash = await env.DB.prepare('SELECT 1 FROM households WHERE invite_code = ?').bind(code).first()
    if (!clash) break
    code = randomInviteCode()
  }

  await env.DB.prepare('UPDATE households SET invite_code = ? WHERE id = ?').bind(code, householdId).run()

  return json({ inviteCode: code })
}
