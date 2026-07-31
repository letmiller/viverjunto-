import { hashPassword } from '../../_lib/crypto'
import { type Env, errorResponse, json } from '../../_lib/session'

interface Body {
  token: string
  password: string
}

interface ResetRow {
  id: string
  user_id: string
  expires_at: string
  used: number
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const body = (await request.json().catch(() => null)) as Body | null
  if (!body?.token || !body?.password || body.password.length < 6) {
    return errorResponse('Link inválido ou senha muito curta (mínimo 6 caracteres).')
  }

  const reset = await env.DB.prepare(
    'SELECT id, user_id, expires_at, used FROM password_resets WHERE token = ?',
  )
    .bind(body.token)
    .first<ResetRow>()

  if (!reset || reset.used || new Date(reset.expires_at) < new Date()) {
    return errorResponse('Esse link expirou ou já foi usado. Solicite um novo.', 400)
  }

  const passwordHash = await hashPassword(body.password)

  await env.DB.batch([
    env.DB.prepare('UPDATE users SET password_hash = ? WHERE id = ?').bind(passwordHash, reset.user_id),
    env.DB.prepare('UPDATE password_resets SET used = 1 WHERE id = ?').bind(reset.id),
  ])

  return json({ ok: true })
}
