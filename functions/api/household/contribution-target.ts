import { getHouseholdIdForUser, isViewer, VIEWER_ERROR_MESSAGE } from '../../_lib/household'
import { type Env, errorResponse, getUserId, json } from '../../_lib/session'

interface Body {
  userId?: string
  monthlyTarget?: number | null
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const callerId = await getUserId(request, env)
  if (!callerId) return errorResponse('Não autenticado.', 401)

  const householdId = await getHouseholdIdForUser(callerId, env)
  if (!householdId) return errorResponse('Você não faz parte de uma casa.', 400)
  if (await isViewer(callerId, householdId, env)) return errorResponse(VIEWER_ERROR_MESSAGE, 403)

  const body = (await request.json().catch(() => null)) as Body | null
  if (!body?.userId) return errorResponse('Informe a pessoa.')
  if (body.monthlyTarget !== null && body.monthlyTarget !== undefined && !(body.monthlyTarget >= 0)) {
    return errorResponse('O valor precisa ser maior ou igual a zero.')
  }

  const target = await env.DB.prepare('SELECT 1 FROM household_members WHERE household_id = ? AND user_id = ?')
    .bind(householdId, body.userId)
    .first()
  if (!target) return errorResponse('Essa pessoa não faz parte da sua casa.', 404)

  await env.DB.prepare('UPDATE household_members SET monthly_contribution_target = ? WHERE household_id = ? AND user_id = ?')
    .bind(body.monthlyTarget ?? null, householdId, body.userId)
    .run()

  return json({ ok: true })
}
