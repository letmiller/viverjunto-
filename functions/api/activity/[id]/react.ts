import { randomId } from '../../../_lib/crypto'
import { getHouseholdIdForUser } from '../../../_lib/household'
import { type Env, errorResponse, getUserId, json } from '../../../_lib/session'

export const onRequestPost: PagesFunction<Env> = async ({ request, env, params }) => {
  const userId = await getUserId(request, env)
  if (!userId) return errorResponse('Não autenticado.', 401)

  const householdId = await getHouseholdIdForUser(userId, env)
  if (!householdId) return errorResponse('Você ainda não faz parte de uma casa.', 400)

  const activityId = params.id as string
  const owns = await env.DB.prepare('SELECT 1 FROM activity_log WHERE id = ? AND household_id = ?')
    .bind(activityId, householdId)
    .first()
  if (!owns) return errorResponse('Atividade não encontrada.', 404)

  const body = (await request.json().catch(() => null)) as { emoji?: string } | null
  if (!body?.emoji) return errorResponse('Informe o emoji.')

  const existing = await env.DB.prepare(
    'SELECT id, emoji FROM activity_reactions WHERE activity_id = ? AND user_id = ?',
  )
    .bind(activityId, userId)
    .first<{ id: string; emoji: string }>()

  if (existing && existing.emoji === body.emoji) {
    await env.DB.prepare('DELETE FROM activity_reactions WHERE id = ?').bind(existing.id).run()
  } else if (existing) {
    await env.DB.prepare('UPDATE activity_reactions SET emoji = ? WHERE id = ?').bind(body.emoji, existing.id).run()
  } else {
    await env.DB.prepare('INSERT INTO activity_reactions (id, activity_id, user_id, emoji) VALUES (?, ?, ?, ?)')
      .bind(randomId(), activityId, userId, body.emoji)
      .run()
  }

  return json({ ok: true })
}
