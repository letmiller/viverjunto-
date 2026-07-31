import { escapeHtml, sendEmail } from '../../_lib/mail'
import { sendPushToUser } from '../../_lib/push'
import { type Env, errorResponse, json } from '../../_lib/session'

interface HouseholdRow {
  id: string
  name: string
}

interface MemberRow {
  user_id: string
  email: string
  name: string
  email_verified: number
}

interface BillRow {
  id: string
  title: string
  amount: number
  due_date: string
  reminder_days: number | null
}

function dateStr(daysFromNow: number): string {
  const d = new Date()
  d.setDate(d.getDate() + daysFromNow)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// Triggered daily by an external scheduler (e.g. cron-job.org). Emails
// verified household members about unpaid bills due within each bill's own
// reminder window (bills.reminder_days, default 1 day — i.e. due today or
// tomorrow — when not set on the bill). There's no automated WhatsApp/SMS
// send in this app (wa.me links are user-initiated only) — the in-app
// "Contas a pagar" card offers a one-tap wa.me reminder as the
// closer-to-real-time channel.
export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const secret = request.headers.get('X-Cron-Secret')
  if (!secret || secret !== env.CRON_SECRET) return errorResponse('Não autorizado.', 401)

  const today = dateStr(0)
  // 30 days is the UI's max reminder-days input, so nothing further out could
  // ever be "due soon" for any bill — fetch that wide, then filter per-bill.
  const maxWindowEnd = dateStr(30)
  const { results: households } = await env.DB.prepare('SELECT id, name FROM households').all<HouseholdRow>()

  let sent = 0
  for (const hh of households) {
    const { results: candidateBills } = await env.DB.prepare(
      `SELECT id, title, amount, due_date, reminder_days FROM bills
       WHERE household_id = ? AND paid = 0 AND due_date BETWEEN ? AND ?
       ORDER BY due_date ASC`,
    )
      .bind(hh.id, today, maxWindowEnd)
      .all<BillRow>()

    const billsDue = candidateBills.filter((b) => b.due_date <= dateStr(b.reminder_days ?? 1))
    if (billsDue.length === 0) continue

    // Push doesn't depend on a verified email — a member with push enabled
    // but an unverified email should still get the push. Only the email send
    // below is gated on email_verified.
    const { results: members } = await env.DB.prepare(
      `SELECT u.id AS user_id, u.email, u.name, u.email_verified
       FROM household_members hm
       JOIN users u ON u.id = hm.user_id
       WHERE hm.household_id = ?`,
    )
      .bind(hh.id)
      .all<MemberRow>()

    if (members.length === 0) continue

    const items = billsDue
      .map((b) => {
        const diffDays = Math.round(
          (new Date(b.due_date + 'T00:00:00').getTime() - new Date(today + 'T00:00:00').getTime()) / 86400000,
        )
        const label = diffDays === 0 ? 'vence hoje' : diffDays === 1 ? 'vence amanhã' : `vence em ${diffDays}d`
        return `<li>${escapeHtml(b.title)} — R$ ${b.amount.toLocaleString('pt-BR')} (${label})</li>`
      })
      .join('')
    const html = `
      <h2>Contas perto de vencer — ${escapeHtml(hh.name)}</h2>
      <ul>${items}</ul>
      <p style="color:#808f8c;font-size:12px;">Enviado pelo Viver Junto.</p>
    `

    for (const member of members) {
      if (member.email_verified) {
        try {
          await sendEmail({
            apiKey: env.RESEND_API_KEY,
            from: env.RESEND_FROM_EMAIL,
            to: member.email,
            subject: `🧾 ${billsDue.length} conta${billsDue.length > 1 ? 's' : ''} perto de vencer`,
            html,
          })
          sent++
        } catch {
          // continue to next member/household even if one email fails
        }
      }

      await sendPushToUser(env, member.user_id, {
        title: `🧾 ${billsDue.length} conta${billsDue.length > 1 ? 's' : ''} perto de vencer`,
        body: billsDue.map((b) => b.title).join(', '),
        url: '/financas',
      })
    }
  }

  return json({ ok: true, householdsProcessed: households.length, emailsSent: sent })
}
