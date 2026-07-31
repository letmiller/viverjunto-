import { randomId } from '../../_lib/crypto'
import { getHouseholdIdForUser, isViewer, VIEWER_ERROR_MESSAGE } from '../../_lib/household'
import { type Env, errorResponse, getUserId, json } from '../../_lib/session'

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

export const onRequestPut: PagesFunction<Env> = async ({ request, env }) => {
  const userId = await getUserId(request, env)
  if (!userId) return errorResponse('Não autenticado.', 401)

  const householdId = await getHouseholdIdForUser(userId, env)
  if (!householdId) return errorResponse('Você ainda não faz parte de uma casa.', 400)
  if (await isViewer(userId, householdId, env)) return errorResponse(VIEWER_ERROR_MESSAGE, 403)

  const body = (await request.json().catch(() => null)) as { date?: string | null } | null
  if (body?.date && !DATE_RE.test(body.date)) return errorResponse('Data inválida.')

  const list = await env.DB.prepare('SELECT id FROM shopping_lists WHERE household_id = ? LIMIT 1')
    .bind(householdId)
    .first<{ id: string }>()

  if (list) {
    await env.DB.prepare('UPDATE shopping_lists SET next_trip_date = ? WHERE id = ?')
      .bind(body?.date || null, list.id)
      .run()
  } else {
    await env.DB.prepare('INSERT INTO shopping_lists (id, household_id, next_trip_date) VALUES (?, ?, ?)')
      .bind(randomId(), householdId, body?.date || null)
      .run()
  }

  return json({ ok: true })
}
