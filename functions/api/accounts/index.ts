import { randomId } from '../../_lib/crypto'
import { getHouseholdIdForUser, isViewer, VIEWER_ERROR_MESSAGE } from '../../_lib/household'
import { type Env, errorResponse, getUserId, json } from '../../_lib/session'

interface AccountRow {
  id: string
  name: string
  type: string
  color: string | null
  balance: number
  sort_order: number
}

interface CreateBody {
  name?: string
  type?: string
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const userId = await getUserId(request, env)
  if (!userId) return errorResponse('Não autenticado.', 401)

  const householdId = await getHouseholdIdForUser(userId, env)
  if (!householdId) return json({ accounts: [] })

  const { results } = await env.DB.prepare(
    `SELECT a.id, a.name, a.type, a.color, a.sort_order,
            a.initial_balance + COALESCE(SUM(CASE WHEN t.type = 'income' THEN t.amount WHEN t.type = 'expense' THEN -t.amount ELSE 0 END), 0) AS balance
     FROM financial_accounts a
     LEFT JOIN transactions t ON t.account_id = a.id
     WHERE a.household_id = ?
     GROUP BY a.id
     ORDER BY a.sort_order ASC`,
  )
    .bind(householdId)
    .all<AccountRow>()

  return json({ accounts: results })
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const userId = await getUserId(request, env)
  if (!userId) return errorResponse('Não autenticado.', 401)

  const householdId = await getHouseholdIdForUser(userId, env)
  if (!householdId) return errorResponse('Você ainda não faz parte de uma casa.', 400)
  if (await isViewer(userId, householdId, env)) return errorResponse(VIEWER_ERROR_MESSAGE, 403)

  const body = (await request.json().catch(() => null)) as CreateBody | null
  if (!body?.name?.trim()) return errorResponse('Dê um nome para a conta.')

  const maxOrder = await env.DB.prepare('SELECT MAX(sort_order) AS max FROM financial_accounts WHERE household_id = ?')
    .bind(householdId)
    .first<{ max: number | null }>()

  const id = randomId()
  await env.DB.prepare(
    'INSERT INTO financial_accounts (id, household_id, name, type, balance, sort_order) VALUES (?, ?, ?, ?, 0, ?)',
  )
    .bind(id, householdId, body.name.trim(), body.type || 'corrente', (maxOrder?.max ?? -1) + 1)
    .run()

  return json({ id }, { status: 201 })
}
