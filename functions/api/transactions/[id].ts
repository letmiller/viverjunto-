import { getHouseholdIdForUser, isViewer, VIEWER_ERROR_MESSAGE } from '../../_lib/household'
import { logActivity } from '../../_lib/activity'
import { type Env, errorResponse, getUserId, json } from '../../_lib/session'

interface PatchBody {
  category?: string
  description?: string | null
  amount?: number
  type?: 'income' | 'expense'
  date?: string
  accountId?: string | null
}

interface TransactionRow {
  id: string
  category: string
  amount: number
  type: 'income' | 'expense'
}

export const onRequestPatch: PagesFunction<Env> = async ({ request, env, params }) => {
  const userId = await getUserId(request, env)
  if (!userId) return errorResponse('Não autenticado.', 401)

  const householdId = await getHouseholdIdForUser(userId, env)
  if (!householdId) return errorResponse('Você ainda não faz parte de uma casa.', 400)
  if (await isViewer(userId, householdId, env)) return errorResponse(VIEWER_ERROR_MESSAGE, 403)

  const body = (await request.json().catch(() => null)) as PatchBody | null
  if (!body) return errorResponse('Corpo inválido.')

  if (body.amount !== undefined && !(body.amount > 0)) {
    return errorResponse('O valor precisa ser maior que zero.')
  }
  if (body.type !== undefined && !['income', 'expense'].includes(body.type)) {
    return errorResponse('Tipo inválido.')
  }
  if (body.accountId) {
    const account = await env.DB.prepare('SELECT id FROM financial_accounts WHERE id = ? AND household_id = ?')
      .bind(body.accountId, householdId)
      .first()
    if (!account) return errorResponse('Conta inválida.')
  }

  const id = params.id as string
  const existing = await env.DB.prepare('SELECT id, category, amount, type FROM transactions WHERE id = ? AND household_id = ?')
    .bind(id, householdId)
    .first<TransactionRow>()
  if (!existing) return errorResponse('Lançamento não encontrado.', 404)

  const fields: string[] = []
  const values: unknown[] = []
  for (const [key, col] of [
    ['category', 'category'],
    ['description', 'description'],
    ['amount', 'amount'],
    ['type', 'type'],
    ['date', 'date'],
    ['accountId', 'account_id'],
  ] as const) {
    if (body[key] !== undefined) {
      fields.push(`${col} = ?`)
      values.push(body[key])
    }
  }
  if (fields.length === 0) return errorResponse('Nada para atualizar.')

  values.push(id, householdId)
  await env.DB.prepare(`UPDATE transactions SET ${fields.join(', ')} WHERE id = ? AND household_id = ?`)
    .bind(...values)
    .run()

  const category = body.category ?? existing.category
  await logActivity(env, householdId, userId, 'transaction', `editou um lançamento em "${category}"`, '✏️')

  return json({ ok: true })
}

export const onRequestDelete: PagesFunction<Env> = async ({ request, env, params }) => {
  const userId = await getUserId(request, env)
  if (!userId) return errorResponse('Não autenticado.', 401)

  const householdId = await getHouseholdIdForUser(userId, env)
  if (!householdId) return errorResponse('Você ainda não faz parte de uma casa.', 400)
  if (await isViewer(userId, householdId, env)) return errorResponse(VIEWER_ERROR_MESSAGE, 403)

  const id = params.id as string
  const existing = await env.DB.prepare('SELECT id, category, amount, type FROM transactions WHERE id = ? AND household_id = ?')
    .bind(id, householdId)
    .first<TransactionRow>()
  if (!existing) return errorResponse('Lançamento não encontrado.', 404)

  await env.DB.prepare('DELETE FROM transactions WHERE id = ? AND household_id = ?').bind(id, householdId).run()

  await logActivity(
    env,
    householdId,
    userId,
    'transaction',
    `excluiu um lançamento de R$ ${existing.amount.toLocaleString('pt-BR')} em "${existing.category}"`,
    '🗑️',
  )

  return json({ ok: true })
}
