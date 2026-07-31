import { getHouseholdIdForUser, isViewer, VIEWER_ERROR_MESSAGE } from '../../_lib/household'
import { type Env, errorResponse, getUserId, json } from '../../_lib/session'

interface Body {
  userId?: string
  whatsappNumber?: string | null
}

// Same trust model as the password-reset endpoint: any full household member
// can fix another member's WhatsApp number (e.g. after they changed phones) —
// it's contact info, not a credential, so there's no reason to gate it to
// the owner. Viewers still can't, though: redirecting where someone else's
// notifications go is a write to shared data, same as anything else a
// read-only member is blocked from.
export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const callerId = await getUserId(request, env)
  if (!callerId) return errorResponse('Não autenticado.', 401)

  const householdId = await getHouseholdIdForUser(callerId, env)
  if (!householdId) return errorResponse('Você não faz parte de uma casa.', 400)
  if (await isViewer(callerId, householdId, env)) return errorResponse(VIEWER_ERROR_MESSAGE, 403)

  const body = (await request.json().catch(() => null)) as Body | null
  if (!body?.userId || body.whatsappNumber === undefined) {
    return errorResponse('Informe a pessoa e o número de WhatsApp.')
  }

  const target = await env.DB.prepare(
    'SELECT 1 FROM household_members WHERE household_id = ? AND user_id = ?',
  )
    .bind(householdId, body.userId)
    .first()
  if (!target) return errorResponse('Essa pessoa não faz parte da sua casa.', 404)

  await env.DB.prepare('UPDATE users SET whatsapp_number = ? WHERE id = ?')
    .bind(body.whatsappNumber?.trim() || null, body.userId)
    .run()

  return json({ ok: true })
}
