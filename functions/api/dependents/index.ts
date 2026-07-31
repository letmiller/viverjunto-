import { randomId } from '../../_lib/crypto'
import { getHouseholdIdForUser, isViewer, VIEWER_ERROR_MESSAGE } from '../../_lib/household'
import { type Env, errorResponse, getUserId, json } from '../../_lib/session'

interface DependentRow {
  id: string
  name: string
  icon: string
}

interface CreateBody {
  name?: string
  icon?: string
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const userId = await getUserId(request, env)
  if (!userId) return errorResponse('Não autenticado.', 401)

  const householdId = await getHouseholdIdForUser(userId, env)
  if (!householdId) return json({ dependents: [] })

  const { results } = await env.DB.prepare('SELECT id, name, icon FROM dependents WHERE household_id = ? ORDER BY created_at ASC')
    .bind(householdId)
    .all<DependentRow>()

  return json({ dependents: results })
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const userId = await getUserId(request, env)
  if (!userId) return errorResponse('Não autenticado.', 401)

  const householdId = await getHouseholdIdForUser(userId, env)
  if (!householdId) return errorResponse('Você ainda não faz parte de uma casa.', 400)
  if (await isViewer(userId, householdId, env)) return errorResponse(VIEWER_ERROR_MESSAGE, 403)

  const body = (await request.json().catch(() => null)) as CreateBody | null
  if (!body?.name?.trim()) return errorResponse('Dê um nome para o dependente.')

  const id = randomId()
  await env.DB.prepare('INSERT INTO dependents (id, household_id, name, icon) VALUES (?, ?, ?, ?)')
    .bind(id, householdId, body.name.trim(), body.icon || '🧒')
    .run()

  return json({ id }, { status: 201 })
}
