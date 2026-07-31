import { getHouseholdIdForUser, isViewer, VIEWER_ERROR_MESSAGE } from '../../_lib/household'
import { type Env, errorResponse, getUserId, json } from '../../_lib/session'

interface PatchBody {
  name?: string
  type?: string
  balance?: number
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
  const account = await env.DB.prepare('SELECT id FROM financial_accounts WHERE id = ? AND household_id = ?')
    .bind(id, householdId)
    .first()
  if (!account) return errorResponse('Conta não encontrada.', 404)

  const fields: string[] = []
  const values: unknown[] = []
  if (body.name !== undefined) {
    if (!body.name.trim()) return errorResponse('Dê um nome para a conta.')
    fields.push('name = ?')
    values.push(body.name.trim())
  }
  if (body.type !== undefined) {
    fields.push('type = ?')
    values.push(body.type)
  }
  if (body.balance !== undefined) {
    // balance is derived (initial_balance + sum of linked transactions), so
    // "setting the balance" means back-solving initial_balance to make that
    // sum true right now — the same trick as adjusting an opening balance.
    const sum = await env.DB.prepare(
      `SELECT COALESCE(SUM(CASE WHEN type = 'income' THEN amount WHEN type = 'expense' THEN -amount ELSE 0 END), 0) AS total
       FROM transactions WHERE account_id = ?`,
    )
      .bind(id)
      .first<{ total: number }>()
    fields.push('initial_balance = ?')
    values.push(body.balance - (sum?.total ?? 0))
  }
  if (fields.length === 0) return errorResponse('Nada para atualizar.')

  values.push(id, householdId)
  await env.DB.prepare(`UPDATE financial_accounts SET ${fields.join(', ')} WHERE id = ? AND household_id = ?`)
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
  // Transactions and bills keep their history — they just lose the account
  // tag, rather than being deleted along with the account.
  await env.DB.batch([
    env.DB.prepare('UPDATE transactions SET account_id = NULL WHERE account_id = ? AND household_id = ?').bind(
      id,
      householdId,
    ),
    env.DB.prepare('UPDATE bills SET account_id = NULL WHERE account_id = ? AND household_id = ?').bind(
      id,
      householdId,
    ),
    env.DB.prepare('DELETE FROM financial_accounts WHERE id = ? AND household_id = ?').bind(id, householdId),
  ])

  return json({ ok: true })
}
