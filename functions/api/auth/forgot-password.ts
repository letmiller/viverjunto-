import { randomId } from '../../_lib/crypto'
import { sendEmail } from '../../_lib/mail'
import { type Env, errorResponse, json } from '../../_lib/session'

interface Body {
  email: string
}

// Always returns ok:true regardless of whether the email exists, so the
// endpoint can't be used to enumerate registered accounts.
export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const body = (await request.json().catch(() => null)) as Body | null
  if (!body?.email?.trim()) return errorResponse('Informe seu email.')

  const email = body.email.trim().toLowerCase()
  const user = await env.DB.prepare('SELECT id, name FROM users WHERE email = ?')
    .bind(email)
    .first<{ id: string; name: string }>()

  if (user) {
    const token = randomId()
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString()

    await env.DB.prepare(
      'INSERT INTO password_resets (id, user_id, token, expires_at) VALUES (?, ?, ?, ?)',
    )
      .bind(randomId(), user.id, token, expiresAt)
      .run()

    const resetLink = `${new URL(request.url).origin}/redefinir-senha?token=${token}`

    try {
      await sendEmail({
        apiKey: env.RESEND_API_KEY,
        from: env.RESEND_FROM_EMAIL,
        to: email,
        subject: 'Redefinir sua senha — Viver Junto',
        html: `
          <p>Oi, ${user.name.split(' ')[0]}!</p>
          <p>Recebemos um pedido para redefinir a senha da sua conta no Viver Junto.</p>
          <p><a href="${resetLink}">Clique aqui para criar uma nova senha</a> (válido por 30 minutos).</p>
          <p>Se você não pediu isso, pode ignorar este email.</p>
        `,
      })
    } catch {
      // Swallow email delivery errors — still return ok:true to avoid leaking account existence,
      // and to avoid a hard failure blocking the UI. The token is stored regardless.
    }
  }

  return json({ ok: true })
}
