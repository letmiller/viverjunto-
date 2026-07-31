import { randomId } from '../../_lib/crypto'
import { logActivity } from '../../_lib/activity'
import { getHouseholdIdForUser, isViewer, VIEWER_ERROR_MESSAGE } from '../../_lib/household'
import { type Env, errorResponse, getUserId, json } from '../../_lib/session'

interface CreateBody {
  title?: string
  icon?: string
  targetAmount?: number | null
  assignedTo?: string | null
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const userId = await getUserId(request, env)
  if (!userId) return errorResponse('Não autenticado.', 401)

  const householdId = await getHouseholdIdForUser(userId, env)
  if (!householdId) return errorResponse('Você ainda não faz parte de uma casa.', 400)
  if (await isViewer(userId, householdId, env)) return errorResponse(VIEWER_ERROR_MESSAGE, 403)

  const body = (await request.json().catch(() => null)) as CreateBody | null
  if (!body?.title?.trim()) return errorResponse('Dê um nome para o plano.')

  if (body.assignedTo) {
    const isMember = await env.DB.prepare('SELECT 1 FROM household_members WHERE household_id = ? AND user_id = ?')
      .bind(householdId, body.assignedTo)
      .first()
    if (!isMember) return errorResponse('Responsável inválido.')
  }

  const maxOrder = await env.DB.prepare('SELECT MAX(sort_order) AS max FROM goals WHERE household_id = ?')
    .bind(householdId)
    .first<{ max: number | null }>()

  const id = randomId()
  await env.DB.prepare(
    'INSERT INTO goals (id, household_id, title, icon, target_amount, assigned_to, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?)',
  )
    .bind(
      id,
      householdId,
      body.title.trim(),
      body.icon ?? '🎯',
      body.targetAmount ?? null,
      body.assignedTo || null,
      (maxOrder?.max ?? -1) + 1,
    )
    .run()

  await logActivity(env, householdId, userId, 'goal_created', `criou o plano "${body.title.trim()}"`, '🎯')

  return json({ id }, { status: 201 })
}
