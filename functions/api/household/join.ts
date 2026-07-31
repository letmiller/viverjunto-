import { isHouseholdFull } from '../../_lib/household'
import { type Env, errorResponse, getUserId, json } from '../../_lib/session'

interface JoinBody {
  code: string
}

interface HouseholdRow {
  id: string
  name: string
  invite_code: string
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const userId = await getUserId(request, env)
  if (!userId) return errorResponse('Não autenticado.', 401)

  const body = (await request.json().catch(() => null)) as JoinBody | null
  const code = body?.code?.trim().toUpperCase()
  if (!code) return errorResponse('Informe o código de convite.')

  const household = await env.DB.prepare('SELECT id, name, invite_code FROM households WHERE invite_code = ?')
    .bind(code)
    .first<HouseholdRow>()
  if (!household) return errorResponse('Código de convite inválido.', 404)

  const existing = await env.DB.prepare(
    'SELECT 1 FROM household_members WHERE household_id = ? AND user_id = ?',
  )
    .bind(household.id, userId)
    .first()
  if (existing) {
    return json({ household: { id: household.id, name: household.name, inviteCode: household.invite_code } })
  }

  const otherHousehold = await env.DB.prepare(
    'SELECT household_id FROM household_members WHERE user_id = ? LIMIT 1',
  )
    .bind(userId)
    .first<{ household_id: string }>()
  if (otherHousehold) {
    return errorResponse(
      'Você já faz parte de outra casa. Saia dela em Perfil antes de entrar em uma nova.',
      409,
    )
  }

  if (await isHouseholdFull(household.id, env)) {
    return errorResponse('Essa casa já atingiu o limite de pessoas.', 409)
  }

  await env.DB.prepare('INSERT INTO household_members (household_id, user_id, role) VALUES (?, ?, ?)')
    .bind(household.id, userId, 'member')
    .run()

  // The household code is shared across every invite sent (WhatsApp, email,
  // link, QR) rather than a unique per-invite token, so there's no way to
  // tell which specific invite this join fulfilled — mark them all accepted.
  await env.DB.prepare("UPDATE invites SET status = 'accepted' WHERE household_id = ? AND status = 'pending'")
    .bind(household.id)
    .run()

  return json({ household: { id: household.id, name: household.name, inviteCode: household.invite_code } })
}
