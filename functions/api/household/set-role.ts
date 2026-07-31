import { getHouseholdIdForUser } from '../../_lib/household'
import { type Env, errorResponse, getUserId, json } from '../../_lib/session'

interface SetRoleBody {
  userId?: string
  role?: string
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const callerId = await getUserId(request, env)
  if (!callerId) return errorResponse('Não autenticado.', 401)

  const householdId = await getHouseholdIdForUser(callerId, env)
  if (!householdId) return errorResponse('Você não faz parte de uma casa.', 400)

  const callerRole = await env.DB.prepare('SELECT role FROM household_members WHERE household_id = ? AND user_id = ?')
    .bind(householdId, callerId)
    .first<{ role: string }>()
  if (callerRole?.role !== 'owner') return errorResponse('Só o(a) dono(a) da casa pode alterar papéis.', 403)

  const body = (await request.json().catch(() => null)) as SetRoleBody | null
  if (!body?.userId || !body.role || !['member', 'viewer'].includes(body.role)) {
    return errorResponse('Informe a pessoa e o papel (member ou viewer).')
  }
  if (body.userId === callerId) return errorResponse('Você não pode mudar seu próprio papel.', 400)

  const target = await env.DB.prepare('SELECT role FROM household_members WHERE household_id = ? AND user_id = ?')
    .bind(householdId, body.userId)
    .first<{ role: string }>()
  if (!target) return errorResponse('Essa pessoa não faz parte da sua casa.', 404)
  if (target.role === 'owner') return errorResponse('Não é possível mudar o papel do(a) dono(a).', 400)

  await env.DB.prepare('UPDATE household_members SET role = ? WHERE household_id = ? AND user_id = ?')
    .bind(body.role, householdId, body.userId)
    .run()

  return json({ ok: true })
}
