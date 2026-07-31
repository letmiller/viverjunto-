import { randomId } from '../../_lib/crypto'
import { sendEmail } from '../../_lib/mail'
import { type Env, errorResponse, getUserId, json } from '../../_lib/session'

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const userId = await getUserId(request, env)
  if (!userId) return errorResponse('Não autenticado.', 401)

  const user = await env.DB.prepare('SELECT email, name, email_verified FROM users WHERE id = ?')
    .bind(userId)
    .first<{ email: string; name: string; email_verified: number }>()
  if (!user) return errorResponse('Conta não encontrada.', 404)
  if (user.email_verified) return json({ ok: true })

  const token = randomId()
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
  await env.DB.prepare('INSERT INTO email_verifications (id, user_id, token, expires_at) VALUES (?, ?, ?, ?)')
    .bind(randomId(), userId, token, expiresAt)
    .run()

  const verifyLink = `${new URL(request.url).origin}/verificar-email?token=${token}`
  try {
    await sendEmail({
      apiKey: env.RESEND_API_KEY,
      from: env.RESEND_FROM_EMAIL,
      to: user.email,
      subject: 'Confirme seu email — Viver Junto',
      html: `
        <p>Oi, ${user.name.split(' ')[0]}!</p>
        <p><a href="${verifyLink}">Clique aqui para confirmar seu email</a> (válido por 24 horas).</p>
      `,
    })
  } catch {
    return errorResponse('Não foi possível enviar o email agora. Tente de novo em instantes.', 502)
  }

  return json({ ok: true })
}
