import { escapeHtml, sendEmail } from '../../_lib/mail'
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

interface SumRow {
  entradas: number
  saidas: number
}

interface CategoryRow {
  category: string
  total: number
}

function last7DaysStart(): string {
  const d = new Date()
  d.setDate(d.getDate() - 6)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// Triggered by an external scheduler (e.g. cron-job.org) once a week — Cloudflare
// Pages Functions don't support native Cron Triggers (only plain Workers do).
export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const secret = request.headers.get('X-Cron-Secret')
  if (!secret || secret !== env.CRON_SECRET) return errorResponse('Não autorizado.', 401)

  const since = last7DaysStart()

  const { results: households } = await env.DB.prepare('SELECT id, name FROM households').all<HouseholdRow>()

  let sent = 0
  for (const hh of households) {
    const { results: members } = await env.DB.prepare(
      `SELECT u.id AS user_id, u.email, u.name
       FROM household_members hm
       JOIN users u ON u.id = hm.user_id
       WHERE hm.household_id = ? AND u.email_verified = 1`,
    )
      .bind(hh.id)
      .all<MemberRow>()

    if (members.length === 0) continue

    const sums = await env.DB.prepare(
      `SELECT SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) AS entradas,
              SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) AS saidas
       FROM transactions WHERE household_id = ? AND date >= ?`,
    )
      .bind(hh.id, since)
      .first<SumRow>()

    const { results: categories } = await env.DB.prepare(
      `SELECT category, SUM(amount) AS total FROM transactions
       WHERE household_id = ? AND type = 'expense' AND date >= ?
       GROUP BY category ORDER BY total DESC LIMIT 3`,
    )
      .bind(hh.id, since)
      .all<CategoryRow>()

    const entradas = sums?.entradas ?? 0
    const saidas = sums?.saidas ?? 0
    if (entradas === 0 && saidas === 0) continue // nothing to report

    const categoryLines = categories
      .map((c) => `<li>${escapeHtml(c.category)}: R$ ${c.total.toLocaleString('pt-BR')}</li>`)
      .join('')

    const html = `
      <h2>Resumo da semana — ${escapeHtml(hh.name)}</h2>
      <p>Entradas: <strong>R$ ${entradas.toLocaleString('pt-BR')}</strong></p>
      <p>Saídas: <strong>R$ ${saidas.toLocaleString('pt-BR')}</strong></p>
      <p>Saldo: <strong>R$ ${(entradas - saidas).toLocaleString('pt-BR')}</strong></p>
      ${categoryLines ? `<p>Principais categorias:</p><ul>${categoryLines}</ul>` : ''}
      <p style="color:#808f8c;font-size:12px;">Enviado pelo Viver Junto.</p>
    `

    for (const member of members) {
      try {
        await sendEmail({
          apiKey: env.RESEND_API_KEY,
          from: env.RESEND_FROM_EMAIL,
          to: member.email,
          subject: `📊 Resumo semanal de ${hh.name}`,
          html,
        })
        sent++
      } catch {
        // continue to next member/household even if one email fails
      }
    }
  }

  return json({ ok: true, householdsProcessed: households.length, emailsSent: sent })
}
