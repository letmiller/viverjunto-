import { getHouseholdIdForUser, isViewer, VIEWER_ERROR_MESSAGE } from '../../_lib/household'
import { type Env, errorResponse, getUserId, json } from '../../_lib/session'

interface PatchBody {
  targetAmount?: number | null
  savedAmount?: number
  assignedTo?: string | null
}

export const onRequestPatch: PagesFunction<Env> = async ({ request, env, params }) => {
  const userId = await getUserId(request, env)
  if (!userId) return errorResponse('Não autenticado.', 401)

  const householdId = await getHouseholdIdForUser(userId, env)
  if (!householdId) return errorResponse('Você ainda não faz parte de uma casa.', 400)
  if (await isViewer(userId, householdId, env)) return errorResponse(VIEWER_ERROR_MESSAGE, 403)

  const body = (await request.json().catch(() => null)) as PatchBody | null
  if (!body) return errorResponse('Corpo inválido.')

  const id = params.id as string
  const fields: string[] = []
  const values: unknown[] = []
  if (body.targetAmount !== undefined) {
    fields.push('target_amount = ?')
    values.push(body.targetAmount)
  }
  if (body.savedAmount !== undefined) {
    fields.push('saved_amount = ?')
    values.push(body.savedAmount)
  }
  if (body.assignedTo !== undefined) {
    if (body.assignedTo) {
      const isMember = await env.DB.prepare('SELECT 1 FROM household_members WHERE household_id = ? AND user_id = ?')
        .bind(householdId, body.assignedTo)
        .first()
      if (!isMember) return errorResponse('Responsável inválido.')
    }
    fields.push('assigned_to = ?')
    values.push(body.assignedTo || null)
  }
  if (fields.length === 0) return errorResponse('Nada para atualizar.')

  values.push(id, householdId)
  await env.DB.prepare(`UPDATE goals SET ${fields.join(', ')} WHERE id = ? AND household_id = ?`)
    .bind(...values)
    .run()

  return json({ ok: true })
}

export const onRequestDelete: PagesFunction<Env> = async ({ request, env, params }) => {
  const userId = await getUserId(request, env)
  if (!userId) return errorResponse('Não autenticado.', 401)

  const householdId = await getHouseholdIdForUser(userId, env)
  if (!householdId) return errorResponse('Você ainda não faz parte de uma casa.', 400)
  if (await isViewer(userId, householdId, env)) return errorResponse(VIEWER_ERROR_MESSAGE, 403)

  const id = params.id as string
  await env.DB.prepare('DELETE FROM goals WHERE id = ? AND household_id = ?').bind(id, householdId).run()

  return json({ ok: true })
}
