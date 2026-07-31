import { getHouseholdIdForUser, isViewer, VIEWER_ERROR_MESSAGE } from '../../_lib/household'
import { type Env, errorResponse, getUserId, json } from '../../_lib/session'

interface ReorderBody {
  ids?: string[]
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const userId = await getUserId(request, env)
  if (!userId) return errorResponse('Não autenticado.', 401)

  const householdId = await getHouseholdIdForUser(userId, env)
  if (!householdId) return errorResponse('Você ainda não faz parte de uma casa.', 400)
  if (await isViewer(userId, householdId, env)) return errorResponse(VIEWER_ERROR_MESSAGE, 403)

  const body = (await request.json().catch(() => null)) as ReorderBody | null
  if (!body?.ids?.length) return errorResponse('Lista de contas vazia.')

  const { results: owned } = await env.DB.prepare('SELECT id FROM financial_accounts WHERE household_id = ?')
    .bind(householdId)
    .all<{ id: string }>()
  const ownedIds = new Set(owned.map((a) => a.id))
  if (!body.ids.every((id) => ownedIds.has(id))) return errorResponse('Conta inválida.')

  await env.DB.batch(
    body.ids.map((id, i) =>
      env.DB.prepare('UPDATE financial_accounts SET sort_order = ? WHERE id = ? AND household_id = ?').bind(
        i,
        id,
        householdId,
      ),
    ),
  )

  return json({ ok: true })
}
