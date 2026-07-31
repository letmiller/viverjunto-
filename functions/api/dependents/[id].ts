import { getHouseholdIdForUser, isViewer, VIEWER_ERROR_MESSAGE } from '../../_lib/household'
import { type Env, errorResponse, getUserId, json } from '../../_lib/session'

export const onRequestDelete: PagesFunction<Env> = async ({ request, env, params }) => {
  const userId = await getUserId(request, env)
  if (!userId) return errorResponse('Não autenticado.', 401)

  const householdId = await getHouseholdIdForUser(userId, env)
  if (!householdId) return errorResponse('Você ainda não faz parte de uma casa.', 400)
  if (await isViewer(userId, householdId, env)) return errorResponse(VIEWER_ERROR_MESSAGE, 403)

  const id = params.id as string
  await env.DB.batch([
    env.DB.prepare(
      'UPDATE household_tasks SET assigned_dependent_id = NULL WHERE assigned_dependent_id = ? AND household_id = ?',
    ).bind(id, householdId),
    env.DB.prepare('DELETE FROM dependents WHERE id = ? AND household_id = ?').bind(id, householdId),
  ])

  return json({ ok: true })
}
