import { getHouseholdIdForUser } from '../../_lib/household'
import { type Env, errorResponse, getUserId, json } from '../../_lib/session'

interface WeekRow {
  week: string
  entradas: number
  saidas: number
}

interface CategoryRow {
  category: string
  total: number
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const userId = await getUserId(request, env)
  if (!userId) return errorResponse('Não autenticado.', 401)

  const householdId = await getHouseholdIdForUser(userId, env)
  if (!householdId) return json({ weeks: [], categories: [] })

  const since = new Date()
  since.setDate(since.getDate() - 29)
  const sinceStr = since.toISOString().slice(0, 10)

  const { results: weeks } = await env.DB.prepare(
    `SELECT strftime('%Y-%W', date) AS week,
            SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) AS entradas,
            SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) AS saidas
     FROM transactions
     WHERE household_id = ? AND date >= ?
     GROUP BY week
     ORDER BY week ASC`,
  )
    .bind(householdId, sinceStr)
    .all<WeekRow>()

  const { results: categories } = await env.DB.prepare(
    `SELECT category, SUM(amount) AS total
     FROM transactions
     WHERE household_id = ? AND type = 'expense' AND date >= ?
     GROUP BY category
     ORDER BY total DESC
     LIMIT 6`,
  )
    .bind(householdId, sinceStr)
    .all<CategoryRow>()

  return json({ weeks, categories })
}
