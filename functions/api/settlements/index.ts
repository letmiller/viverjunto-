import { randomId } from '../../_lib/crypto'
import { logActivity } from '../../_lib/activity'
import { getHouseholdIdForUser, isViewer, VIEWER_ERROR_MESSAGE } from '../../_lib/household'
import { type Env, errorResponse, getUserId, json } from '../../_lib/session'

interface SettlementRow {
  id: string
  from_user_id: string
  to_user_id: string
  amount: number
  settled_at: string
}

interface CreateBody {
  toUserId?: string
  amount?: number
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const userId = await getUserId(request, env)
  if (!userId) return errorResponse('Não autenticado.', 401)

  const householdId = await getHouseholdIdForUser(userId, env)
  if (!householdId) return json({ settlements: [] })

  const url = new URL(request.url)
  const since = url.searchParams.get('since')

  let query = 'SELECT id, from_user_id, to_user_id, amount, settled_at FROM settlements WHERE household_id = ?'
  const params: unknown[] = [householdId]
  if (since) {
    query += ' AND settled_at >= ?'
    params.push(since)
  }
  query += ' ORDER BY settled_at DESC'

  const { results } = await env.DB.prepare(query)
    .bind(...params)
    .all<SettlementRow>()

  return json({ settlements: results })
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const userId = await getUserId(request, env)
  if (!userId) return errorResponse('Não autenticado.', 401)

  const householdId = await getHouseholdIdForUser(userId, env)
  if (!householdId) return errorResponse('Você ainda não faz parte de uma casa.', 400)
  if (await isViewer(userId, householdId, env)) return errorResponse(VIEWER_ERROR_MESSAGE, 403)

  const body = (await request.json().catch(() => null)) as CreateBody | null
  if (!body?.toUserId || !(body.amount && body.amount > 0)) {
    return errorResponse('Informe quem recebeu e o valor.')
  }
  if (body.toUserId === userId) return errorResponse('Você não pode quitar uma dívida com você mesmo(a).')

  const isMember = await env.DB.prepare('SELECT 1 FROM household_members WHERE household_id = ? AND user_id = ?')
    .bind(householdId, body.toUserId)
    .first()
  if (!isMember) return errorResponse('Pessoa inválida.')

  const id = randomId()
  await env.DB.prepare(
    'INSERT INTO settlements (id, household_id, from_user_id, to_user_id, amount) VALUES (?, ?, ?, ?, ?)',
  )
    .bind(id, householdId, userId, body.toUserId, body.amount)
    .run()

  await logActivity(env, householdId, userId, 'settlement', `quitou R$ ${body.amount.toLocaleString('pt-BR')} do acerto de contas`, '💸')

  return json({ id }, { status: 201 })
}
