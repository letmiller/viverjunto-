import { randomId } from '../../_lib/crypto'
import { getHouseholdIdForUser, isViewer, VIEWER_ERROR_MESSAGE } from '../../_lib/household'
import { type Env, errorResponse, getUserId, json } from '../../_lib/session'

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const userId = await getUserId(request, env)
  if (!userId) return errorResponse('Não autenticado.', 401)

  const householdId = await getHouseholdIdForUser(userId, env)
  if (!householdId) return errorResponse('Você ainda não faz parte de uma casa.', 400)
  if (await isViewer(userId, householdId, env)) return errorResponse(VIEWER_ERROR_MESSAGE, 403)

  const list = await env.DB.prepare('SELECT id FROM shopping_lists WHERE household_id = ? LIMIT 1')
    .bind(householdId)
    .first<{ id: string }>()
  if (!list) return json({ ok: true })

  // Items checked directly via clearChecked (skipping the per-item PATCH)
  // still count toward purchase-frequency history.
  const { results: checkedItems } = await env.DB.prepare(
    'SELECT name FROM shopping_items WHERE list_id = ? AND checked = 1',
  )
    .bind(list.id)
    .all<{ name: string }>()

  const statements = checkedItems.map((item) =>
    env.DB.prepare('INSERT INTO shopping_purchase_log (id, household_id, item_name) VALUES (?, ?, ?)').bind(
      randomId(),
      householdId,
      item.name.trim().toLowerCase(),
    ),
  )
  statements.push(env.DB.prepare('DELETE FROM shopping_items WHERE list_id = ? AND checked = 1').bind(list.id))
  if (statements.length > 0) await env.DB.batch(statements)

  return json({ ok: true })
}
