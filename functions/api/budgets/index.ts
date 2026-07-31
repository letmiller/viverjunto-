import { getHouseholdIdForUser, isViewer, VIEWER_ERROR_MESSAGE } from '../../_lib/household'
import { type Env, errorResponse, getUserId, json } from '../../_lib/session'

interface BudgetRow {
  category: string
  monthly_limit: number
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const userId = await getUserId(request, env)
  if (!userId) return errorResponse('Não autenticado.', 401)

  const householdId = await getHouseholdIdForUser(userId, env)
  if (!householdId) return json({ budgets: [] })

  const { results } = await env.DB.prepare(
    'SELECT category, monthly_limit FROM budgets WHERE household_id = ?',
  )
    .bind(householdId)
    .all<BudgetRow>()

  return json({ budgets: results })
}

export const onRequestPut: PagesFunction<Env> = async ({ request, env }) => {
  const userId = await getUserId(request, env)
  if (!userId) return errorResponse('Não autenticado.', 401)

  const householdId = await getHouseholdIdForUser(userId, env)
  if (!householdId) return errorResponse('Você ainda não faz parte de uma casa.', 400)
  if (await isViewer(userId, householdId, env)) return errorResponse(VIEWER_ERROR_MESSAGE, 403)

  const body = (await request.json().catch(() => null)) as { category?: string; monthlyLimit?: number } | null
  if (!body?.category?.trim() || !(body.monthlyLimit && body.monthlyLimit > 0)) {
    return errorResponse('Informe categoria e um limite maior que zero.')
  }

  await env.DB.prepare(
    `INSERT INTO budgets (household_id, category, monthly_limit) VALUES (?, ?, ?)
     ON CONFLICT(household_id, category) DO UPDATE SET monthly_limit = excluded.monthly_limit`,
  )
    .bind(householdId, body.category.trim(), body.monthlyLimit)
    .run()

  return json({ ok: true })
}
