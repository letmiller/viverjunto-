import { hashPassword } from '../../_lib/crypto'
import { getHouseholdIdForUser } from '../../_lib/household'
import { type Env, errorResponse, getUserId, json } from '../../_lib/session'

interface Body {
  userId?: string
  newPassword?: string
}

// Lets one household member reset another member's password without email —
// the two people already share finances/tasks/routine, so this trust is
// consistent with the rest of the app. Doesn't require the owner role: it's
// a recovery path, not a permissions action, and gating it to the owner
// would leave no one able to help if the owner themself is locked out.
export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const callerId = await getUserId(request, env)
  if (!callerId) return errorResponse('Não autenticado.', 401)

  const householdId = await getHouseholdIdForUser(callerId, env)
  if (!householdId) return errorResponse('Você não faz parte de uma casa.', 400)

  const body = (await request.json().catch(() => null)) as Body | null
  if (!body?.userId || !body?.newPassword) {
    return errorResponse('Informe a pessoa e a nova senha.')
  }
  if (body.userId === callerId) {
    return errorResponse('Para trocar sua própria senha, use "Alterar senha" no seu perfil.')
  }
  if (body.newPassword.length < 6) {
    return errorResponse('A nova senha precisa ter pelo menos 6 caracteres.')
  }

  const target = await env.DB.prepare(
    'SELECT u.email FROM household_members hm JOIN users u ON u.id = hm.user_id WHERE hm.household_id = ? AND hm.user_id = ?',
  )
    .bind(householdId, body.userId)
    .first<{ email: string }>()
  if (!target) return errorResponse('Essa pessoa não faz parte da sua casa.', 404)

  const passwordHash = await hashPassword(body.newPassword)
  await env.DB.batch([
    env.DB.prepare('UPDATE users SET password_hash = ? WHERE id = ?').bind(passwordHash, body.userId),
    // Clear any lockout from the failed attempts that led here, so the
    // person can log in with the new password right away instead of
    // waiting out the 15-minute window.
    env.DB.prepare('DELETE FROM login_attempts WHERE email = ?').bind(target.email),
  ])

  return json({ ok: true })
}
