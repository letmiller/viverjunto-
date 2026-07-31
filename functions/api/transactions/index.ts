import { randomId } from '../../_lib/crypto'
import { getHouseholdIdForUser, isViewer, VIEWER_ERROR_MESSAGE } from '../../_lib/household'
import { logActivity } from '../../_lib/activity'
import { type Env, errorResponse, getUserId, json } from '../../_lib/session'

interface TransactionRow {
  id: string
  category: string
  description: string | null
  amount: number
  type: 'income' | 'expense'
  date: string
  created_by: string
  created_by_name: string
  payment_method: string | null
  recurrence: string | null
  account_id: string | null
  account_name: string | null
}

interface CreateBody {
  category: string
  description?: string
  amount: number
  type: 'income' | 'expense'
  date: string
  paymentMethod?: string
  recurrence?: string
  accountId?: string
  paidBy?: string
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const userId = await getUserId(request, env)
  if (!userId) return errorResponse('Não autenticado.', 401)

  const householdId = await getHouseholdIdForUser(userId, env)
  if (!householdId) return json({ transactions: [] })

  const url = new URL(request.url)
  const from = url.searchParams.get('from')
  const to = url.searchParams.get('to')

  let query =
    `SELECT t.id, t.category, t.description, t.amount, t.type, t.date, t.created_by,
            COALESCE(u.name, 'Ex-membro') AS created_by_name,
            t.payment_method, t.recurrence, t.account_id, a.name AS account_name
     FROM transactions t
     LEFT JOIN users u ON u.id = t.created_by
     LEFT JOIN financial_accounts a ON a.id = t.account_id
     WHERE t.household_id = ?`
  const params: unknown[] = [householdId]
  if (from) {
    query += ' AND t.date >= ?'
    params.push(from)
  }
  if (to) {
    query += ' AND t.date <= ?'
    params.push(to)
  }
  query += ' ORDER BY t.date DESC'

  const { results } = await env.DB.prepare(query)
    .bind(...params)
    .all<TransactionRow>()

  return json({ transactions: results })
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const userId = await getUserId(request, env)
  if (!userId) return errorResponse('Não autenticado.', 401)

  const householdId = await getHouseholdIdForUser(userId, env)
  if (!householdId) return errorResponse('Você ainda não faz parte de uma casa.', 400)
  if (await isViewer(userId, householdId, env)) return errorResponse(VIEWER_ERROR_MESSAGE, 403)

  const body = (await request.json().catch(() => null)) as CreateBody | null
  if (!body?.category?.trim() || !body.amount || !body.date || !['income', 'expense'].includes(body.type)) {
    return errorResponse('Preencha categoria, valor, tipo e data.')
  }

  if (body.accountId) {
    const account = await env.DB.prepare('SELECT id FROM financial_accounts WHERE id = ? AND household_id = ?')
      .bind(body.accountId, householdId)
      .first()
    if (!account) return errorResponse('Conta inválida.')
  }
  if (body.paidBy) {
    const isMember = await env.DB.prepare('SELECT 1 FROM household_members WHERE household_id = ? AND user_id = ?')
      .bind(householdId, body.paidBy)
      .first()
    if (!isMember) return errorResponse('Pessoa inválida.')
  }

  const id = randomId()
  // A recurring transaction is its own series anchor — the cron groups by
  // series_id (not category+type+recurrence) so two distinct recurring
  // entries that happen to share a category (e.g. two different monthly
  // subscriptions both tagged "Contas") clone forward independently instead
  // of colliding into a single series.
  const seriesId = body.recurrence ? id : null
  await env.DB.prepare(
    `INSERT INTO transactions (id, household_id, category, description, amount, type, date, created_by, payment_method, recurrence, series_id, account_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  )
    .bind(
      id,
      householdId,
      body.category.trim(),
      body.description?.trim() ?? null,
      body.amount,
      body.type,
      body.date,
      body.paidBy || userId,
      body.paymentMethod || null,
      body.recurrence || null,
      seriesId,
      body.accountId || null,
    )
    .run()

  const verb = body.type === 'income' ? 'registrou uma entrada' : 'lançou um gasto'
  await logActivity(
    env,
    householdId,
    userId,
    'transaction',
    `${verb} de R$ ${body.amount.toLocaleString('pt-BR')} em ${body.category.trim()}`,
    body.type === 'income' ? '💰' : '💸',
  )

  return json({ id }, { status: 201 })
}
