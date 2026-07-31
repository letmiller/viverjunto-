import { getHouseholdIdForUser, isViewer, VIEWER_ERROR_MESSAGE } from '../../_lib/household'
import { type Env, errorResponse, getUserId, json } from '../../_lib/session'

interface ReorderBody {
  ids?: string[]
}

// Reorders only the given ids (the items within one category group on the
// client) — assigns them consecutive sort_order values starting from the
// lowest sort_order currently held by any of them, so they slot back in
// without disturbing items in other categories.
export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const userId = await getUserId(request, env)
  if (!userId) return errorResponse('Não autenticado.', 401)

  const householdId = await getHouseholdIdForUser(userId, env)
  if (!householdId) return errorResponse('Você ainda não faz parte de uma casa.', 400)
  if (await isViewer(userId, householdId, env)) return errorResponse(VIEWER_ERROR_MESSAGE, 403)

  const body = (await request.json().catch(() => null)) as ReorderBody | null
  if (!body?.ids?.length) return errorResponse('Lista de itens vazia.')

  const placeholders = body.ids.map(() => '?').join(',')
  const { results: owned } = await env.DB.prepare(
    `SELECT si.id, si.sort_order
     FROM shopping_items si
     JOIN shopping_lists sl ON sl.id = si.list_id
     WHERE sl.household_id = ? AND si.id IN (${placeholders})`,
  )
    .bind(householdId, ...body.ids)
    .all<{ id: string; sort_order: number }>()
  if (owned.length !== body.ids.length) return errorResponse('Item inválido.')

  const baseOrder = Math.min(...owned.map((i) => i.sort_order))

  await env.DB.batch(
    body.ids.map((id, i) =>
      env.DB.prepare('UPDATE shopping_items SET sort_order = ? WHERE id = ?').bind(baseOrder + i, id),
    ),
  )

  return json({ ok: true })
}
