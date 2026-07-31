import { randomId } from '../../_lib/crypto'
import { type Env, errorResponse, json } from '../../_lib/session'

interface GroupRow {
  series_id: string
  household_id: string
  category: string
  type: 'income' | 'expense'
  recurrence: string
  amount: number
  description: string | null
  payment_method: string | null
  account_id: string | null
  created_by: string | null
  last_date: string
}

function nextDate(fromDate: string, recurrence: string): string {
  const [y, m, d] = fromDate.split('-').map(Number)
  const base = new Date(y, m - 1, d)
  if (recurrence === 'weekly') base.setDate(base.getDate() + 7)
  else if (recurrence === 'monthly') base.setMonth(base.getMonth() + 1)
  return `${base.getFullYear()}-${String(base.getMonth() + 1).padStart(2, '0')}-${String(base.getDate()).padStart(2, '0')}`
}

function todayStr(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// Triggered daily by an external scheduler (e.g. cron-job.org). For each
// recurring transaction "series" (grouped by series_id — each recurring
// entry is its own independent series, anchored to the transaction that
// first created it), clones the most recent occurrence forward one period
// at a time once its next date has arrived. Mirrors how recurring tasks
// clone on completion, but time-triggered since transactions have no "done"
// state to hook into.
export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const secret = request.headers.get('X-Cron-Secret')
  if (!secret || secret !== env.CRON_SECRET) return errorResponse('Não autorizado.', 401)

  const today = todayStr()

  const { results: groups } = await env.DB.prepare(
    `SELECT series_id, household_id, category, type, recurrence, amount, description, payment_method, account_id, created_by, MAX(date) AS last_date
     FROM transactions
     WHERE series_id IS NOT NULL
     GROUP BY series_id`,
  ).all<GroupRow>()

  let created = 0
  for (const g of groups) {
    const due = nextDate(g.last_date, g.recurrence)
    if (due > today) continue

    await env.DB.prepare(
      `INSERT INTO transactions (id, household_id, category, description, amount, type, date, created_by, payment_method, recurrence, series_id, account_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
      .bind(
        randomId(),
        g.household_id,
        g.category,
        g.description,
        g.amount,
        g.type,
        due,
        g.created_by,
        g.payment_method,
        g.recurrence,
        g.series_id,
        g.account_id,
      )
      .run()
    created++
  }

  return json({ ok: true, groupsChecked: groups.length, transactionsCreated: created })
}
