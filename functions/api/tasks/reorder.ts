import { getHouseholdIdForUser, isViewer, VIEWER_ERROR_MESSAGE } from '../../_lib/household'
import { type Env, errorResponse, getUserId, json } from '../../_lib/session'

interface ReorderBody {
  ids?: string[]
}

// Reorders only the given ids (e.g. the tasks within one urgency group on
// the client) — assigns them consecutive sort_order values starting from
// the lowest sort_order currently held by any of them, so they slot back in
// without disturbing tasks outside that group.
export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const userId = await getUserId(request, env)
  if (!userId) return errorResponse('Não autenticado.', 401)

  const householdId = await getHouseholdIdForUser(userId, env)
  if (!householdId) return errorResponse('Você ainda não faz parte de uma casa.', 400)
  if (await isViewer(userId, householdId, env)) return errorResponse(VIEWER_ERROR_MESSAGE, 403)

  const body = (await request.json().catch(() => null)) as ReorderBody | null
  if (!body?.ids?.length) return errorResponse('Lista de tarefas vazia.')

  const placeholders = body.ids.map(() => '?').join(',')
  const { results: owned } = await env.DB.prepare(
    `SELECT id, sort_order FROM household_tasks WHERE household_id = ? AND id IN (${placeholders})`,
  )
    .bind(householdId, ...body.ids)
    .all<{ id: string; sort_order: number }>()
  if (owned.length !== body.ids.length) return errorResponse('Tarefa inválida.')

  const baseOrder = Math.min(...owned.map((t) => t.sort_order))

  await env.DB.batch(
    body.ids.map((id, i) =>
      env.DB.prepare('UPDATE household_tasks SET sort_order = ? WHERE id = ? AND household_id = ?').bind(
        baseOrder + i,
        id,
        householdId,
      ),
    ),
  )

  return json({ ok: true })
}
