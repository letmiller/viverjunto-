import { randomId } from '../../_lib/crypto'
import { getHouseholdIdForUser, isViewer, VIEWER_ERROR_MESSAGE } from '../../_lib/household'
import { type Env, errorResponse, getUserId, json } from '../../_lib/session'

interface ItemRow {
  id: string
  category: string | null
  name: string
  quantity: string | null
  price: number | null
  checked: number
  added_by: string | null
  added_by_name: string | null
  recurrence: string | null
  sort_order: number
}

interface CreateBody {
  name: string
  category?: string
  quantity?: string
  price?: number
  recurrence?: string | null
}

async function getOrCreateListId(householdId: string, env: Env): Promise<string> {
  const existing = await env.DB.prepare('SELECT id FROM shopping_lists WHERE household_id = ? LIMIT 1')
    .bind(householdId)
    .first<{ id: string }>()
  if (existing) return existing.id

  const id = randomId()
  await env.DB.prepare('INSERT INTO shopping_lists (id, household_id) VALUES (?, ?)').bind(id, householdId).run()
  return id
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const userId = await getUserId(request, env)
  if (!userId) return errorResponse('Não autenticado.', 401)

  const householdId = await getHouseholdIdForUser(userId, env)
  if (!householdId) return json({ items: [] })

  const list = await env.DB.prepare('SELECT id, next_trip_date FROM shopping_lists WHERE household_id = ? LIMIT 1')
    .bind(householdId)
    .first<{ id: string; next_trip_date: string | null }>()
  if (!list) return json({ items: [], nextTripDate: null })

  const { results } = await env.DB.prepare(
    `SELECT si.id, si.category, si.name, si.quantity, si.price, si.checked, si.added_by, u.name AS added_by_name, si.recurrence, si.sort_order
     FROM shopping_items si
     LEFT JOIN users u ON u.id = si.added_by
     WHERE si.list_id = ?
     ORDER BY si.checked ASC, si.category ASC, si.sort_order ASC`,
  )
    .bind(list.id)
    .all<ItemRow>()

  return json({ items: results, nextTripDate: list.next_trip_date })
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const userId = await getUserId(request, env)
  if (!userId) return errorResponse('Não autenticado.', 401)

  const householdId = await getHouseholdIdForUser(userId, env)
  if (!householdId) return errorResponse('Você ainda não faz parte de uma casa.', 400)
  if (await isViewer(userId, householdId, env)) return errorResponse(VIEWER_ERROR_MESSAGE, 403)

  const body = (await request.json().catch(() => null)) as CreateBody | null
  if (!body?.name?.trim()) return errorResponse('Informe o nome do item.')

  const listId = await getOrCreateListId(householdId, env)

  const maxOrder = await env.DB.prepare('SELECT MAX(sort_order) AS max FROM shopping_items WHERE list_id = ?')
    .bind(listId)
    .first<{ max: number | null }>()

  const id = randomId()
  await env.DB.prepare(
    'INSERT INTO shopping_items (id, list_id, category, name, quantity, price, checked, added_by, recurrence, sort_order) VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?, ?)',
  )
    .bind(
      id,
      listId,
      body.category?.trim() ?? 'Outros',
      body.name.trim(),
      body.quantity?.trim() || null,
      body.price ?? null,
      userId,
      body.recurrence || null,
      (maxOrder?.max ?? -1) + 1,
    )
    .run()

  return json({ id }, { status: 201 })
}
