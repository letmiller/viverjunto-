import { getHouseholdIdForUser } from '../../_lib/household'
import { type Env, errorResponse, getUserId, json } from '../../_lib/session'

interface RemoveBody {
  userId?: string
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const callerId = await getUserId(request, env)
  if (!callerId) return errorResponse('Não autenticado.', 401)

  const householdId = await getHouseholdIdForUser(callerId, env)
  if (!householdId) return errorResponse('Você não faz parte de uma casa.', 400)

  const callerRole = await env.DB.prepare('SELECT role FROM household_members WHERE household_id = ? AND user_id = ?')
    .bind(householdId, callerId)
    .first<{ role: string }>()
  if (callerRole?.role !== 'owner') return errorResponse('Só o(a) dono(a) da casa pode remover membros.', 403)

  const body = (await request.json().catch(() => null)) as RemoveBody | null
  const targetId = body?.userId
  if (!targetId) return errorResponse('Informe quem remover.')
  if (targetId === callerId) return errorResponse('Use "Sair da casa" pra remover a si mesmo(a).', 400)

  const target = await env.DB.prepare('SELECT 1 FROM household_members WHERE household_id = ? AND user_id = ?')
    .bind(householdId, targetId)
    .first()
  if (!target) return errorResponse('Essa pessoa não faz parte da sua casa.', 404)

  await env.DB.prepare('DELETE FROM household_members WHERE household_id = ? AND user_id = ?')
    .bind(householdId, targetId)
    .run()

  return json({ ok: true })
}
