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
}

interface TaskRow {
  id: string
  title: string
  icon: string | null
  assigned_to: string | null
}

function todayStr(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// Triggered daily by an external scheduler (e.g. cron-job.org) — Cloudflare
// Pages Functions don't support native Cron Triggers (only plain Workers do).
export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const secret = request.headers.get('X-Cron-Secret')
  if (!secret || secret !== env.CRON_SECRET) return errorResponse('Não autorizado.', 401)

  const today = todayStr()
  const { results: households } = await env.DB.prepare('SELECT id, name FROM households').all<HouseholdRow>()

  let sent = 0
  for (const hh of households) {
    const { results: tasksDue } = await env.DB.prepare(
      `SELECT id, title, icon, assigned_to FROM household_tasks
       WHERE household_id = ? AND status = 'pending' AND due_date = ?`,
    )
      .bind(hh.id, today)
      .all<TaskRow>()

    if (tasksDue.length === 0) continue

    const { results: members } = await env.DB.prepare(
      `SELECT u.id AS user_id, u.email, u.name
       FROM household_members hm
       JOIN users u ON u.id = hm.user_id
       WHERE hm.household_id = ? AND u.email_verified = 1`,
    )
      .bind(hh.id)
      .all<MemberRow>()

    for (const member of members) {
      const relevant = tasksDue.filter((t) => !t.assigned_to || t.assigned_to === member.user_id)
      if (relevant.length === 0) continue

      const plural = relevant.length > 1
      const items = relevant.map((t) => `<li>${escapeHtml(t.icon ?? '✅')} ${escapeHtml(t.title)}</li>`).join('')
      const html = `
        <h2>Tarefas de hoje — ${escapeHtml(hh.name)}</h2>
        <p>Você tem ${relevant.length} tarefa${plural ? 's' : ''} vencendo hoje:</p>
        <ul>${items}</ul>
        <p style="color:#808f8c;font-size:12px;">Enviado pelo Viver Junto.</p>
      `

      try {
        await sendEmail({
          apiKey: env.RESEND_API_KEY,
          from: env.RESEND_FROM_EMAIL,
          to: member.email,
          subject: `✅ ${relevant.length} tarefa${plural ? 's' : ''} vencendo hoje`,
          html,
        })
        sent++
      } catch {
        // continue to next member/household even if one email fails
      }

      await sendPushToUser(env, member.user_id, {
        title: `✅ ${relevant.length} tarefa${plural ? 's' : ''} vencendo hoje`,
        body: relevant.map((t) => t.title).join(', '),
        url: '/organizacao',
      })
    }
  }

  return json({ ok: true, householdsProcessed: households.length, emailsSent: sent })
}
