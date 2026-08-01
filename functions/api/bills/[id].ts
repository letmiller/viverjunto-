import { randomId } from '../../_lib/crypto'
import { getHouseholdIdForUser, isViewer, VIEWER_ERROR_MESSAGE } from '../../_lib/household'
import { logActivity } from '../../_lib/activity'
import { type Env, errorResponse, getUserId, json } from '../../_lib/session'

interface PatchBody {
  title?: string
  amount?: number
  dueDate?: string
  paid?: boolean
  paidAmount?: number
  recurrence?: string | null
  assignedTo?: string | null
  accountId?: string | null
  reminderDays?: number | null
  category?: string | null
  installmentTotal?: number | null
}

interface BillRow {
  id: string
  title: string
  amount: number
  due_date: string
  recurrence: string | null
  assigned_to: string | null
  paid_amount: number
  account_id: string | null
  reminder_days: number | null
  category: string | null
  installment_number: number | null
  installment_total: number | null
  sort_order: number
}

// Every bill payment logs an expense transaction, so it shows up in "Últimos
// lançamentos" and analytics regardless of whether the bill has a linked
// account. When it IS linked to an account, that account's balance drops
// accordingly (account_id column, nullable, is just left null otherwise).
async function recordPaymentTransaction(
  env: Env,
  householdId: string,
  userId: string,
  bill: { title: string; account_id: string | null; category: string | null },
  delta: number,
) {
  if (delta <= 0) return
  await env.DB.prepare(
    `INSERT INTO transactions (id, household_id, account_id, category, description, amount, type, date, created_by)
     VALUES (?, ?, ?, ?, ?, ?, 'expense', date('now'), ?)`,
  )
    .bind(randomId(), householdId, bill.account_id, bill.category || 'Contas', bill.title, delta, userId)
    .run()
}

function nextDueDate(fromDate: string, recurrence: string): string {
  const [y, m, d] = fromDate.split('-').map(Number)
  const base = new Date(y, m - 1, d)
  if (recurrence === 'weekly') base.setDate(base.getDate() + 7)
  else if (recurrence === 'monthly') base.setMonth(base.getMonth() + 1)
  return `${base.getFullYear()}-${String(base.getMonth() + 1).padStart(2, '0')}-${String(base.getDate()).padStart(2, '0')}`
}

// Clones the next occurrence of a recurring bill once the current one is
// paid. When it's an installment plan (installment_total set), stops once
// the last installment has been paid instead of repeating forever.
async function cloneNextBill(env: Env, householdId: string, userId: string, bill: BillRow) {
  if (!bill.recurrence) return
  if (bill.installment_total && bill.installment_number && bill.installment_number >= bill.installment_total) return

  await env.DB.prepare(
    'INSERT INTO bills (id, household_id, title, amount, due_date, paid, recurrence, created_by, assigned_to, account_id, reminder_days, category, installment_number, installment_total, sort_order) VALUES (?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
  )
    .bind(
      randomId(),
      householdId,
      bill.title,
      bill.amount,
      nextDueDate(bill.due_date, bill.recurrence),
      bill.recurrence,
      userId,
      bill.assigned_to,
      bill.account_id,
      bill.reminder_days,
      bill.category,
      bill.installment_number ? bill.installment_number + 1 : null,
      bill.installment_total,
      bill.sort_order,
    )
    .run()
}

export const onRequestPatch: PagesFunction<Env> = async ({ request, env, params }) => {
  const userId = await getUserId(request, env)
  if (!userId) return errorResponse('Não autenticado.', 401)

  const householdId = await getHouseholdIdForUser(userId, env)
  if (!householdId) return errorResponse('Você ainda não faz parte de uma casa.', 400)
  if (await isViewer(userId, householdId, env)) return errorResponse(VIEWER_ERROR_MESSAGE, 403)

  const body = (await request.json().catch(() => null)) as PatchBody | null
  if (!body) return errorResponse('Corpo inválido.')
  if (body.amount !== undefined && !(body.amount > 0)) return errorResponse('O valor precisa ser maior que zero.')

  const id = params.id as string
  const bill = await env.DB.prepare(
    'SELECT id, title, amount, due_date, recurrence, assigned_to, paid_amount, account_id, reminder_days, category, installment_number, installment_total, sort_order FROM bills WHERE id = ? AND household_id = ?',
  )
    .bind(id, householdId)
    .first<BillRow>()
  if (!bill) return errorResponse('Conta não encontrada.', 404)

  if (body.paid !== undefined) {
    await env.DB.prepare('UPDATE bills SET paid = ?, paid_amount = ? WHERE id = ? AND household_id = ?')
      .bind(body.paid ? 1 : 0, body.paid ? bill.amount : 0, id, householdId)
      .run()

    if (body.paid) {
      await recordPaymentTransaction(env, householdId, userId, bill, bill.amount - bill.paid_amount)
      await logActivity(env, householdId, userId, 'bill', `pagou a conta "${bill.title}"`, '✅')
      await cloneNextBill(env, householdId, userId, bill)
    }

    return json({ ok: true })
  }

  if (body.paidAmount !== undefined) {
    if (body.paidAmount < 0) return errorResponse('O valor pago não pode ser negativo.')
    const isFullyPaid = body.paidAmount >= bill.amount
    await env.DB.prepare('UPDATE bills SET paid_amount = ?, paid = ? WHERE id = ? AND household_id = ?')
      .bind(body.paidAmount, isFullyPaid ? 1 : 0, id, householdId)
      .run()
    await recordPaymentTransaction(env, householdId, userId, bill, body.paidAmount - bill.paid_amount)

    if (isFullyPaid) {
      await logActivity(env, householdId, userId, 'bill', `pagou a conta "${bill.title}"`, '✅')
      await cloneNextBill(env, householdId, userId, bill)
    } else if (body.paidAmount > 0) {
      await logActivity(
        env,
        householdId,
        userId,
        'bill',
        `pagou parte da conta "${bill.title}" (R$ ${body.paidAmount.toLocaleString('pt-BR')})`,
        '🧾',
      )
    }

    return json({ ok: true })
  }

  const fields: string[] = []
  const values: unknown[] = []
  if (body.title !== undefined) {
    fields.push('title = ?')
    values.push(body.title.trim())
  }
  if (body.amount !== undefined) {
    fields.push('amount = ?')
    values.push(body.amount)
  }
  if (body.dueDate !== undefined) {
    fields.push('due_date = ?')
    values.push(body.dueDate)
  }
  if (body.recurrence !== undefined) {
    fields.push('recurrence = ?')
    values.push(body.recurrence || null)
  }
  if (body.assignedTo !== undefined) {
    if (body.assignedTo) {
      const isMember = await env.DB.prepare('SELECT 1 FROM household_members WHERE household_id = ? AND user_id = ?')
        .bind(householdId, body.assignedTo)
        .first()
      if (!isMember) return errorResponse('Responsável inválido.')
    }
    fields.push('assigned_to = ?')
    values.push(body.assignedTo || null)
  }
  if (body.accountId !== undefined) {
    if (body.accountId) {
      const accountOk = await env.DB.prepare('SELECT 1 FROM financial_accounts WHERE id = ? AND household_id = ?')
        .bind(body.accountId, householdId)
        .first()
      if (!accountOk) return errorResponse('Conta inválida.')
    }
    fields.push('account_id = ?')
    values.push(body.accountId || null)
  }
  if (body.reminderDays !== undefined) {
    if (body.reminderDays !== null && !(body.reminderDays >= 0)) {
      return errorResponse('O aviso precisa ser 0 ou mais dias.')
    }
    fields.push('reminder_days = ?')
    values.push(body.reminderDays)
  }
  if (body.category !== undefined) {
    fields.push('category = ?')
    values.push(body.category?.trim() || null)
  }
  if (body.installmentTotal !== undefined) {
    if (body.installmentTotal !== null && !(body.installmentTotal >= 2)) {
      return errorResponse('O número de parcelas precisa ser 2 ou mais (deixe em branco para repetir sempre).')
    }
    fields.push('installment_total = ?', 'installment_number = ?')
    values.push(body.installmentTotal, body.installmentTotal ? (bill.installment_number ?? 1) : null)
  }
  if (fields.length === 0) return errorResponse('Nada para atualizar.')

  values.push(id, householdId)
  await env.DB.prepare(`UPDATE bills SET ${fields.join(', ')} WHERE id = ? AND household_id = ?`)
    .bind(...values)
    .run()

  return json({ ok: true })
}

export const onRequestDelete: PagesFunction<Env> = async ({ request, env, params }) => {
  const userId = await getUserId(request, env)
  if (!userId) return errorResponse('Não autenticado.', 401)

  const householdId = await getHouseholdIdForUser(userId, env)
  if (!householdId) return errorResponse('Você ainda não faz parte de uma casa.', 400)
  if (await isViewer(userId, householdId, env)) return errorResponse(VIEWER_ERROR_MESSAGE, 403)

  const id = params.id as string
  await env.DB.prepare('DELETE FROM bills WHERE id = ? AND household_id = ?').bind(id, householdId).run()

  return json({ ok: true })
}
