import { getHouseholdIdForUser } from '../../_lib/household'
import { type Env, errorResponse, getUserId, json } from '../../_lib/session'

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const userId = await getUserId(request, env)
  if (!userId) return errorResponse('Não autenticado.', 401)

  const householdId = await getHouseholdIdForUser(userId, env)
  if (!householdId) return json({ avgDays: null, lastPurchasedDaysAgo: null })

  const name = new URL(request.url).searchParams.get('name')?.trim().toLowerCase()
  if (!name) return errorResponse('Informe o nome do item.')

  const { results } = await env.DB.prepare(
    'SELECT purchased_at FROM shopping_purchase_log WHERE household_id = ? AND item_name = ? ORDER BY purchased_at ASC',
  )
    .bind(householdId, name)
    .all<{ purchased_at: string }>()

  if (results.length < 2) {
    const lastPurchasedDaysAgo =
      results.length === 1
        ? Math.round((Date.now() - new Date(results[0].purchased_at.replace(' ', 'T') + 'Z').getTime()) / 86400000)
        : null
    return json({ avgDays: null, lastPurchasedDaysAgo })
  }

  const timestamps = results.map((r) => new Date(r.purchased_at.replace(' ', 'T') + 'Z').getTime())
  let totalGapDays = 0
  for (let i = 1; i < timestamps.length; i++) {
    totalGapDays += (timestamps[i] - timestamps[i - 1]) / 86400000
  }
  const avgDays = Math.round(totalGapDays / (timestamps.length - 1))
  const lastPurchasedDaysAgo = Math.round((Date.now() - timestamps[timestamps.length - 1]) / 86400000)

  return json({ avgDays, lastPurchasedDaysAgo })
}
