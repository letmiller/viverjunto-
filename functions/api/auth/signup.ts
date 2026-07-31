import { hashPassword, randomId, randomInviteCode, signJwt } from '../../_lib/crypto'
import { isHouseholdFull } from '../../_lib/household'
import { escapeHtml, sendEmail } from '../../_lib/mail'
import { type Env, errorResponse, json, sessionCookieHeader } from '../../_lib/session'

interface SignupBody {
  name: string
  email: string
  password: string
  whatsappNumber: string
  inviteCode?: string
}

interface HouseholdRow {
  id: string
  name: string
  invite_code: string
}

const MAX_SIGNUPS_PER_WINDOW = 5
const WINDOW_MINUTES = 60

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const body = (await request.json().catch(() => null)) as SignupBody | null
  if (!body?.name?.trim() || !body?.email?.trim() || !body?.password || body.password.length < 6) {
    return errorResponse('Preencha nome, email e uma senha com pelo menos 6 caracteres.')
  }

  const ip = request.headers.get('CF-Connecting-IP') ?? 'unknown'
  const attempt = await env.DB.prepare('SELECT count, window_started_at FROM signup_attempts WHERE ip = ?')
    .bind(ip)
    .first<{ count: number; window_started_at: string }>()
  const windowExpired =
    !attempt || Date.now() - new Date(attempt.window_started_at).getTime() > WINDOW_MINUTES * 60 * 1000

  if (!windowExpired && attempt.count >= MAX_SIGNUPS_PER_WINDOW) {
    return errorResponse('Muitas contas criadas a partir deste dispositivo. Tente novamente mais tarde.', 429)
  }

  if (windowExpired) {
    await env.DB.prepare(
      `INSERT INTO signup_attempts (ip, count, window_started_at) VALUES (?, 1, datetime('now'))
       ON CONFLICT(ip) DO UPDATE SET count = 1, window_started_at = datetime('now')`,
    )
      .bind(ip)
      .run()
  } else {
    await env.DB.prepare('UPDATE signup_attempts SET count = count + 1 WHERE ip = ?').bind(ip).run()
  }

  const email = body.email.trim().toLowerCase()
  const existing = await env.DB.prepare('SELECT id FROM users WHERE email = ?').bind(email).first()
  if (existing) return errorResponse('Já existe uma conta com esse email.', 409)

  const userId = randomId()
  const passwordHash = await hashPassword(body.password)

  await env.DB.prepare(
    'INSERT INTO users (id, email, password_hash, name, whatsapp_number) VALUES (?, ?, ?, ?, ?)',
  )
    .bind(userId, email, passwordHash, body.name.trim(), body.whatsappNumber?.trim() ?? null)
    .run()

  let household: { id: string; name: string; inviteCode: string }

  const inviteCodeInput = body.inviteCode?.trim().toUpperCase()
  const invited = inviteCodeInput
    ? await env.DB.prepare('SELECT id, name, invite_code FROM households WHERE invite_code = ?')
        .bind(inviteCodeInput)
        .first<HouseholdRow>()
    : null

  if (invited && (await isHouseholdFull(invited.id, env))) {
    // The user row above was already committed as its own statement — undo
    // it rather than leaving a login-less orphan behind on this rejection.
    await env.DB.prepare('DELETE FROM users WHERE id = ?').bind(userId).run()
    return errorResponse('Essa casa já atingiu o limite de pessoas.', 409)
  }

  if (invited) {
    await env.DB.prepare('INSERT INTO household_members (household_id, user_id, role) VALUES (?, ?, ?)')
      .bind(invited.id, userId, 'member')
      .run()
    await env.DB.prepare("UPDATE invites SET status = 'accepted' WHERE household_id = ? AND status = 'pending'")
      .bind(invited.id)
      .run()
    household = { id: invited.id, name: invited.name, inviteCode: invited.invite_code }
  } else {
    const householdId = randomId()
    const newInviteCode = randomInviteCode()
    const householdName = `Casa de ${body.name.trim().split(' ')[0]}`
    await env.DB.prepare('INSERT INTO households (id, name, invite_code, created_by) VALUES (?, ?, ?, ?)')
      .bind(householdId, householdName, newInviteCode, userId)
      .run()
    await env.DB.prepare('INSERT INTO household_members (household_id, user_id, role) VALUES (?, ?, ?)')
      .bind(householdId, userId, 'owner')
      .run()
    household = { id: householdId, name: householdName, inviteCode: newInviteCode }
  }

  const token = await signJwt({ sub: userId }, env.JWT_SECRET)

  const verificationToken = randomId()
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
  await env.DB.prepare('INSERT INTO email_verifications (id, user_id, token, expires_at) VALUES (?, ?, ?, ?)')
    .bind(randomId(), userId, verificationToken, expiresAt)
    .run()

  const verifyLink = `${new URL(request.url).origin}/verificar-email?token=${verificationToken}`
  try {
    await sendEmail({
      apiKey: env.RESEND_API_KEY,
      from: env.RESEND_FROM_EMAIL,
      to: email,
      subject: 'Confirme seu email — Viver Junto',
      html: `
        <p>Oi, ${escapeHtml(body.name.trim().split(' ')[0])}!</p>
        <p>Confirme seu email para garantir que os resumos e lembretes do Viver Junto cheguem certinho.</p>
        <p><a href="${verifyLink}">Clique aqui para confirmar seu email</a> (válido por 24 horas).</p>
      `,
    })
  } catch {
    // Swallow email delivery errors — signup should still succeed even if the
    // verification email fails to send. The user can request a new one later.
  }

  return json(
    {
      user: {
        id: userId,
        name: body.name.trim(),
        email,
        whatsappNumber: body.whatsappNumber ?? null,
        usageType: null,
        avatarUrl: null,
        emailVerified: false,
      },
      household,
    },
    { headers: { 'Set-Cookie': sessionCookieHeader(token, request) } },
  )
}
