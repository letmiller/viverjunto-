import { randomId } from '../../_lib/crypto'
import { getHouseholdIdForUser, isViewer, VIEWER_ERROR_MESSAGE } from '../../_lib/household'
import { type Env, errorResponse, getUserId, json } from '../../_lib/session'

interface InviteRow {
  id: string
  method: string
  email: string | null
  status: string
  created_at: string
}

interface CreateBody {
  method?: string
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const userId = await getUserId(request, env)
  if (!userId) return errorResponse('Não autenticado.', 401)

  const householdId = await getHouseholdIdForUser(userId, env)
  if (!householdId) return json({ invites: [] })

  const { results } = await env.DB.prepare(
    'SELECT id, method, email, status, created_at FROM invites WHERE household_id = ? ORDER BY created_at DESC',
  )
    .bind(householdId)
    .all<InviteRow>()

  return json({ invites: results })
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const userId = await getUserId(request, env)
  if (!userId) return errorResponse('Não autenticado.', 401)

  const householdId = await getHouseholdIdForUser(userId, env)
  if (!householdId) return errorResponse('Você ainda não faz parte de uma casa.', 400)
  if (await isViewer(userId, householdId, env)) return errorResponse(VIEWER_ERROR_MESSAGE, 403)

  const body = (await request.json().catch(() => null)) as CreateBody | null
  const method = body?.method?.trim()
  if (!method || !['whatsapp', 'link', 'qrcode'].includes(method)) {
    return errorResponse('Método de convite inválido.')
  }

  const id = randomId()
  await env.DB.prepare(
    "INSERT INTO invites (id, household_id, method, email, token, status) VALUES (?, ?, ?, NULL, ?, 'pending')",
  )
    .bind(id, householdId, method, randomId())
    .run()

  return json({ id }, { status: 201 })
}
