import { type Env, errorResponse, json } from '../../_lib/session'

interface Body {
  token: string
}

interface VerificationRow {
  id: string
  user_id: string
  expires_at: string
  used: number
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const body = (await request.json().catch(() => null)) as Body | null
  if (!body?.token) return errorResponse('Link inválido.')

  const verification = await env.DB.prepare(
    'SELECT id, user_id, expires_at, used FROM email_verifications WHERE token = ?',
  )
    .bind(body.token)
    .first<VerificationRow>()

  if (!verification || verification.used || new Date(verification.expires_at) < new Date()) {
    return errorResponse('Esse link expirou ou já foi usado. Solicite um novo.', 400)
  }

  await env.DB.batch([
    env.DB.prepare('UPDATE users SET email_verified = 1 WHERE id = ?').bind(verification.user_id),
    env.DB.prepare('UPDATE email_verifications SET used = 1 WHERE id = ?').bind(verification.id),
  ])

  return json({ ok: true })
}
