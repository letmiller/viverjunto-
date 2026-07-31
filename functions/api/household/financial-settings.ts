import { getHouseholdIdForUser, isViewer, VIEWER_ERROR_MESSAGE } from '../../_lib/household'
import { type Env, errorResponse, getUserId, json } from '../../_lib/session'

interface SettingsRow {
  monthly_income: number | null
  split_method: string | null
  categories: string | null
  currency: string
  bill_reminder_days: number
}

interface PutBody {
  organization?: string
  debts?: string
  emergencyFund?: string
  debtTypes?: string[]
  priority?: string
  monthlyIncome?: number
  billReminderDays?: number
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const userId = await getUserId(request, env)
  if (!userId) return errorResponse('Não autenticado.', 401)

  const householdId = await getHouseholdIdForUser(userId, env)
  if (!householdId) return json({ settings: null })

  const row = await env.DB.prepare(
    'SELECT monthly_income, split_method, categories, currency, bill_reminder_days FROM financial_settings WHERE household_id = ?',
  )
    .bind(householdId)
    .first<SettingsRow>()

  return json({ settings: row ? { ...row, categories: row.categories ? JSON.parse(row.categories) : null } : null })
}

export const onRequestPut: PagesFunction<Env> = async ({ request, env }) => {
  const userId = await getUserId(request, env)
  if (!userId) return errorResponse('Não autenticado.', 401)

  const householdId = await getHouseholdIdForUser(userId, env)
  if (!householdId) return errorResponse('Você ainda não faz parte de uma casa.', 400)
  if (await isViewer(userId, householdId, env)) return errorResponse(VIEWER_ERROR_MESSAGE, 403)

  const body = (await request.json().catch(() => null)) as PutBody | null
  if (!body) return errorResponse('Corpo inválido.')
  if (body.billReminderDays !== undefined && !(body.billReminderDays >= 0 && body.billReminderDays <= 30)) {
    return errorResponse('O aviso de conta precisa ser entre 0 e 30 dias.')
  }
  if (body.debtTypes !== undefined) {
    if (!Array.isArray(body.debtTypes) || body.debtTypes.length > 10 || body.debtTypes.some((t) => typeof t !== 'string' || t.length > 50)) {
      return errorResponse('Tipos de dívida inválidos.')
    }
  }
  if (body.priority !== undefined && (typeof body.priority !== 'string' || body.priority.length > 50)) {
    return errorResponse('Prioridade inválida.')
  }

  const existing = await env.DB.prepare(
    'SELECT categories, monthly_income, bill_reminder_days FROM financial_settings WHERE household_id = ?',
  )
    .bind(householdId)
    .first<{ categories: string | null; monthly_income: number | null; bill_reminder_days: number }>()

  const existingCategories = existing?.categories ? JSON.parse(existing.categories) : {}
  const categories = JSON.stringify({
    organization: body.organization ?? existingCategories.organization ?? null,
    debts: body.debts ?? existingCategories.debts ?? null,
    emergencyFund: body.emergencyFund ?? existingCategories.emergencyFund ?? null,
    debtTypes: body.debtTypes ?? existingCategories.debtTypes ?? null,
    priority: body.priority ?? existingCategories.priority ?? null,
  })
  const monthlyIncome = body.monthlyIncome ?? existing?.monthly_income ?? null
  const billReminderDays = body.billReminderDays ?? existing?.bill_reminder_days ?? 1

  await env.DB.prepare(
    `INSERT INTO financial_settings (household_id, categories, monthly_income, bill_reminder_days)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(household_id) DO UPDATE SET categories = excluded.categories, monthly_income = excluded.monthly_income, bill_reminder_days = excluded.bill_reminder_days`,
  )
    .bind(householdId, categories, monthlyIncome, billReminderDays)
    .run()

  return json({ ok: true })
}
