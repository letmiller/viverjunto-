import { randomId } from '../../_lib/crypto'
import { getHouseholdIdForUser, isViewer, VIEWER_ERROR_MESSAGE } from '../../_lib/household'
import { logActivity } from '../../_lib/activity'
import { type Env, errorResponse, getUserId, json } from '../../_lib/session'

interface BillRow {
  id: string
  title: string
  amount: number
  due_date: string
  paid: number
  paid_amount: number
  assigned_to: string | null
  assignee_name: string | null
  recurrence: string | null
  account_id: string | null
  account_name: string | null
  reminder_days: number | null
  category: string | null
  installment_number: number | null
  installment_total: number | null
  sort_order: number
}

interface CreateBody {
  title: string
  amount: number
  dueDate: string
  recurrence?: string | null
  assignedTo?: string | null
  accountId?: string | null
  reminderDays?: number | null
  category?: string | null
  installmentTotal?: number | null
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const userId = await getUserId(request, env)
  if (!userId) return errorResponse('Não autenticado.', 401)

  const householdId = await getHouseholdIdForUser(userId, env)
  if (!householdId) return json({ bills: [] })

  const { results } = await env.DB.prepare(
    `SELECT b.id, b.title, b.amount, b.due_date, b.paid, b.paid_amount, b.assigned_to, u.name AS assignee_name,
            b.recurrence, b.account_id, a.name AS account_name, b.reminder_days, b.category,
            b.installment_number, b.installment_total, b.sort_order
     FROM bills b
     LEFT JOIN users u ON u.id = b.assigned_to
     LEFT JOIN financial_accounts a ON a.id = b.account_id
     WHERE b.household_id = ?
     ORDER BY b.paid ASC, b.sort_order ASC`,
  )
    .bind(householdId)
    .all<BillRow>()

  return json({ bills: results })
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const userId = await getUserId(request, env)
  if (!userId) return errorResponse('Não autenticado.', 401)

  const householdId = await getHouseholdIdForUser(userId, env)
  if (!householdId) return errorResponse('Você ainda não faz parte de uma casa.', 400)
  if (await isViewer(userId, householdId, env)) return errorResponse(VIEWER_ERROR_MESSAGE, 403)

  const body = (await request.json().catch(() => null)) as CreateBody | null
  if (!body?.title?.trim() || !(body.amount > 0) || !body.dueDate) {
    return errorResponse('Preencha nome, valor e data de vencimento.')
  }

  if (body.assignedTo) {
    const isMember = await env.DB.prepare('SELECT 1 FROM household_members WHERE household_id = ? AND user_id = ?')
      .bind(householdId, body.assignedTo)
      .first()
    if (!isMember) return errorResponse('Responsável inválido.')
  }
  if (body.accountId) {
    const accountOk = await env.DB.prepare('SELECT 1 FROM financial_accounts WHERE id = ? AND household_id = ?')
      .bind(body.accountId, householdId)
      .first()
    if (!accountOk) return errorResponse('Conta inválida.')
  }
  if (body.reminderDays !== undefined && body.reminderDays !== null && !(body.reminderDays >= 0)) {
    return errorResponse('O aviso precisa ser 0 ou mais dias.')
  }
  if (body.installmentTotal !== undefined && body.installmentTotal !== null && !(body.installmentTotal >= 2)) {
    return errorResponse('O número de parcelas precisa ser 2 ou mais (deixe em branco para repetir sempre).')
  }

  // Installments only make sense on a recurring bill — a fixed count of
  // "how many times this repeats", not a one-off due date.
  const installmentTotal = body.recurrence && body.installmentTotal ? body.installmentTotal : null
  const installmentNumber = installmentTotal ? 1 : null

  const maxOrder = await env.DB.prepare('SELECT MAX(sort_order) AS max FROM bills WHERE household_id = ?')
    .bind(householdId)
    .first<{ max: number | null }>()

  const id = randomId()
  await env.DB.prepare(
    'INSERT INTO bills (id, household_id, title, amount, due_date, paid, recurrence, created_by, assigned_to, account_id, reminder_days, category, installment_number, installment_total, sort_order) VALUES (?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
  )
    .bind(
      id,
      householdId,
      body.title.trim(),
      body.amount,
      body.dueDate,
      body.recurrence || null,
      userId,
      body.assignedTo || null,
      body.accountId || null,
      body.reminderDays ?? null,
      body.category?.trim() || null,
      installmentNumber,
      installmentTotal,
      (maxOrder?.max ?? -1) + 1,
    )
    .run()

  await logActivity(env, householdId, userId, 'bill', `adicionou a conta "${body.title.trim()}"`, '🧾')

  return json({ id }, { status: 201 })
}
