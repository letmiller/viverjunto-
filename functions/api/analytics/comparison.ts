import { getHouseholdIdForUser } from '../../_lib/household'
import { type Env, errorResponse, getUserId, json } from '../../_lib/session'

interface SumRow {
  entradas: number
  saidas: number
}

function monthRange(offsetMonths: number): { start: string; end: string } {
  const now = new Date()
  const first = new Date(now.getFullYear(), now.getMonth() + offsetMonths, 1)
  const last = new Date(now.getFullYear(), now.getMonth() + offsetMonths + 1, 0)
  const fmt = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  return { start: fmt(first), end: fmt(last) }
}

async function sumFor(env: Env, householdId: string, start: string, end: string): Promise<SumRow> {
  const row = await env.DB.prepare(
    `SELECT
       SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) AS entradas,
       SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) AS saidas
     FROM transactions
     WHERE household_id = ? AND date >= ? AND date <= ?`,
  )
    .bind(householdId, start, end)
    .first<SumRow>()
  return { entradas: row?.entradas ?? 0, saidas: row?.saidas ?? 0 }
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const userId = await getUserId(request, env)
  if (!userId) return errorResponse('Não autenticado.', 401)

  const householdId = await getHouseholdIdForUser(userId, env)
  if (!householdId) return json({ current: { entradas: 0, saidas: 0 }, previous: { entradas: 0, saidas: 0 } })

  const curRange = monthRange(0)
  const prevRange = monthRange(-1)

  const [current, previous] = await Promise.all([
    sumFor(env, householdId, curRange.start, curRange.end),
    sumFor(env, householdId, prevRange.start, prevRange.end),
  ])

  return json({ current, previous })
}
