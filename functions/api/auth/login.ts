import { signJwt, verifyPassword } from '../../_lib/crypto'
import { type Env, errorResponse, json, sessionCookieHeader } from '../../_lib/session'

interface LoginBody {
  email: string
  password: string
}

interface UserRow {
  id: string
  email: string
  password_hash: string
  name: string
  whatsapp_number: string | null
  usage_type: string | null
  avatar_url: string | null
  email_verified: number
}

const MAX_ATTEMPTS = 5
const LOCKOUT_MINUTES = 15

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const body = (await request.json().catch(() => null)) as LoginBody | null
  if (!body?.email?.trim() || !body?.password) return errorResponse('Informe email e senha.')

  const email = body.email.trim().toLowerCase()
  // Keyed by email+IP (not email alone) so one attacker spamming wrong
  // passwords can't lock a victim out of their own account from every
  // device — only their own IP gets throttled. The victim can still log in
  // fine from their usual network.
  const ip = request.headers.get('CF-Connecting-IP') ?? 'unknown'

  const attempt = await env.DB.prepare(
    'SELECT failed_count, last_attempt_at FROM login_attempts WHERE email = ? AND ip = ?',
  )
    .bind(email, ip)
    .first<{ failed_count: number; last_attempt_at: string }>()

  if (attempt && attempt.failed_count >= MAX_ATTEMPTS) {
    const elapsedMs = Date.now() - new Date(attempt.last_attempt_at).getTime()
    if (elapsedMs < LOCKOUT_MINUTES * 60 * 1000) {
      return errorResponse(
        `Muitas tentativas incorretas. Tente novamente em alguns minutos ou use "Esqueci minha senha".`,
        429,
      )
    }
  }

  const user = await env.DB.prepare('SELECT * FROM users WHERE email = ?').bind(email).first<UserRow>()
  const valid = user ? await verifyPassword(body.password, user.password_hash) : false

  if (!valid) {
    await env.DB.prepare(
      `INSERT INTO login_attempts (email, ip, failed_count, last_attempt_at) VALUES (?, ?, 1, datetime('now'))
       ON CONFLICT(email, ip) DO UPDATE SET failed_count = failed_count + 1, last_attempt_at = datetime('now')`,
    )
      .bind(email, ip)
      .run()
    return errorResponse('Email ou senha incorretos.', 401)
  }

  await env.DB.prepare('DELETE FROM login_attempts WHERE email = ? AND ip = ?').bind(email, ip).run()

  const token = await signJwt({ sub: user!.id }, env.JWT_SECRET)

  return json(
    {
      user: {
        id: user!.id,
        name: user!.name,
        email: user!.email,
        whatsappNumber: user!.whatsapp_number,
        usageType: user!.usage_type,
        avatarUrl: user!.avatar_url,
        emailVerified: !!user!.email_verified,
      },
    },
    { headers: { 'Set-Cookie': sessionCookieHeader(token, request) } },
  )
}
