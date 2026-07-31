import { randomId } from '../../_lib/crypto'
import { getHouseholdIdForUser, isViewer, VIEWER_ERROR_MESSAGE } from '../../_lib/household'
import { type Env, errorResponse, getUserId, json } from '../../_lib/session'

interface PatchBody {
  checked?: boolean
  name?: string
  category?: string | null
  quantity?: string | null
  price?: number | null
  recurrence?: string | null
}

interface ItemDetail {
  id: string
  list_id: string
  name: string
  category: string | null
  quantity: string | null
  price: number | null
  recurrence: string | null
  added_by: string | null
  sort_order: number
}

async function findItem(itemId: string, householdId: string, env: Env): Promise<ItemDetail | null> {
  const row = await env.DB.prepare(
    `SELECT si.id, si.list_id, si.name, si.category, si.quantity, si.price, si.recurrence, si.added_by, si.sort_order
     FROM shopping_items si
     JOIN shopping_lists sl ON sl.id = si.list_id
     WHERE si.id = ? AND sl.household_id = ?`,
  )
    .bind(itemId, householdId)
    .first<ItemDetail>()
  return row
}

export const onRequestPatch: PagesFunction<Env> = async ({ request, env, params }) => {
  const userId = await getUserId(request, env)
  if (!userId) return errorResponse('Não autenticado.', 401)

  const householdId = await getHouseholdIdForUser(userId, env)
  if (!householdId) return errorResponse('Você ainda não faz parte de uma casa.', 400)
  if (await isViewer(userId, householdId, env)) return errorResponse(VIEWER_ERROR_MESSAGE, 403)

  const id = params.id as string
  const item = await findItem(id, householdId, env)
  if (!item) return errorResponse('Item não encontrado.', 404)

  const body = (await request.json().catch(() => null)) as PatchBody | null
  if (!body) return errorResponse('Corpo inválido.')

  if (typeof body.checked === 'boolean') {
    await env.DB.prepare('UPDATE shopping_items SET checked = ? WHERE id = ?')
      .bind(body.checked ? 1 : 0, id)
      .run()
  } else if (body.name !== undefined) {
    if (!body.name.trim()) return errorResponse('Informe o nome do item.')
    await env.DB.prepare(
      'UPDATE shopping_items SET name = ?, category = ?, quantity = ?, price = ?, recurrence = ? WHERE id = ?',
    )
      .bind(
        body.name.trim(),
        body.category || null,
        body.quantity?.trim() || null,
        body.price ?? null,
        body.recurrence || null,
        id,
      )
      .run()
    return json({ ok: true })
  } else {
    return errorResponse('Informe checked ou os dados do item.')
  }

  if (body.checked) {
    await env.DB.prepare(
      'INSERT INTO shopping_purchase_log (id, household_id, item_name) VALUES (?, ?, ?)',
    )
      .bind(randomId(), householdId, item.name.trim().toLowerCase())
      .run()

    // Recurring items respawn immediately, unchecked — a shopping list has no
    // due dates to gate against, so "next time" just means "ready right away".
    if (item.recurrence) {
      await env.DB.prepare(
        'INSERT INTO shopping_items (id, list_id, category, name, quantity, price, checked, added_by, recurrence, sort_order) VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?, ?)',
      )
        .bind(
          randomId(),
          item.list_id,
          item.category,
          item.name,
          item.quantity,
          item.price,
          item.added_by,
          item.recurrence,
          item.sort_order,
        )
        .run()
    }
  }

  return json({ ok: true })
}

export const onRequestDelete: PagesFunction<Env> = async ({ request, env, params }) => {
  const userId = await getUserId(request, env)
  if (!userId) return errorResponse('Não autenticado.', 401)

  const householdId = await getHouseholdIdForUser(userId, env)
  if (!householdId) return errorResponse('Você ainda não faz parte de uma casa.', 400)
  if (await isViewer(userId, householdId, env)) return errorResponse(VIEWER_ERROR_MESSAGE, 403)

  const id = params.id as string
  if (!(await findItem(id, householdId, env))) return errorResponse('Item não encontrado.', 404)

  await env.DB.prepare('DELETE FROM shopping_items WHERE id = ?').bind(id).run()

  return json({ ok: true })
}
