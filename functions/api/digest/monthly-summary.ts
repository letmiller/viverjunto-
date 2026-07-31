import { sendEmail } from '../../_lib/mail'
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

function monthStart(offsetMonths: number): string {
  const d = new Date()
  d.setDate(1)
  d.setMonth(d.getMonth() + offsetMonths)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
}

// Triggered once a month by an external scheduler (e.g. cron-job.org, on the
// 1st). Mirrors weekly.ts but aggregates the prior calendar month and adds a
// month-over-month spending comparison.
export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const secret = request.headers.get('X-Cron-Secret')
  if (!secret || secret !== env.CRON_SECRET) return errorResponse('Não autorizado.', 401)

  const thisMonthStart = monthStart(0)
  const lastMonthStart = monthStart(-1)
  const twoMonthsAgoStart = monthStart(-2)

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
       FROM transactions WHERE household_id = ? AND date >= ? AND date < ?`,
    )
      .bind(hh.id, lastMonthStart, thisMonthStart)
      .first<SumRow>()

    const entradas = sums?.entradas ?? 0
    const saidas = sums?.saidas ?? 0
    if (entradas === 0 && saidas === 0) continue // nothing to report

    const prevSums = await env.DB.prepare(
      `SELECT SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) AS saidas
       FROM transactions WHERE household_id = ? AND date >= ? AND date < ?`,
    )
      .bind(hh.id, twoMonthsAgoStart, lastMonthStart)
      .first<{ saidas: number }>()
    const prevSaidas = prevSums?.saidas ?? 0

    const { results: categories } = await env.DB.prepare(
      `SELECT category, SUM(amount) AS total FROM transactions
       WHERE household_id = ? AND type = 'expense' AND date >= ? AND date < ?
       GROUP BY category ORDER BY total DESC LIMIT 5`,
    )
      .bind(hh.id, lastMonthStart, thisMonthStart)
      .all<CategoryRow>()

    const categoryLines = categories.map((c) => `<li>${c.category}: R$ ${c.total.toLocaleString('pt-BR')}</li>`).join('')

    let comparisonLine = ''
    if (prevSaidas > 0) {
      const deltaPct = Math.round(((saidas - prevSaidas) / prevSaidas) * 100)
      comparisonLine = `<p>${Math.abs(deltaPct)}% ${deltaPct > 0 ? 'a mais' : 'a menos'} em gastos vs. o mês anterior.</p>`
    }

    const html = `
      <h2>Resumo do mês — ${hh.name}</h2>
      <p>Entradas: <strong>R$ ${entradas.toLocaleString('pt-BR')}</strong></p>
      <p>Saídas: <strong>R$ ${saidas.toLocaleString('pt-BR')}</strong></p>
      <p>Saldo: <strong>R$ ${(entradas - saidas).toLocaleString('pt-BR')}</strong></p>
      ${comparisonLine}
      ${categoryLines ? `<p>Principais categorias:</p><ul>${categoryLines}</ul>` : ''}
      <p style="color:#808f8c;font-size:12px;">Enviado pelo Viver Junto.</p>
    `

    for (const member of members) {
      try {
        await sendEmail({
          apiKey: env.RESEND_API_KEY,
          from: env.RESEND_FROM_EMAIL,
          to: member.email,
          subject: `📅 Resumo do mês de ${hh.name}`,
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
