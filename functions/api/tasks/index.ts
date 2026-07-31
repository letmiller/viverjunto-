import { randomId } from '../../_lib/crypto'
import { getHouseholdIdForUser, isViewer, VIEWER_ERROR_MESSAGE } from '../../_lib/household'
import { logActivity } from '../../_lib/activity'
import { type Env, errorResponse, getUserId, json } from '../../_lib/session'

interface TaskRow {
  id: string
  title: string
  icon: string | null
  assigned_to: string | null
  assigned_dependent_id: string | null
  assignee_name: string | null
  status: string
  due_date: string | null
  recurrence: string | null
  recurrence_days: string | null
  completed_at: string | null
  time_spent_minutes: number | null
  completed_by: string | null
  sort_order: number
}

interface CreateBody {
  title: string
  icon?: string
  assignedTo?: string | null
  assignedDependentId?: string | null
  dueDate?: string | null
  recurrence?: string | null
  recurrenceDays?: string | null
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const userId = await getUserId(request, env)
  if (!userId) return errorResponse('Não autenticado.', 401)

  const householdId = await getHouseholdIdForUser(userId, env)
  if (!householdId) return json({ tasks: [] })

  const { results } = await env.DB.prepare(
    `SELECT t.id, t.title, t.icon, t.assigned_to, t.assigned_dependent_id,
            COALESCE(u.name, d.name) AS assignee_name, t.status, t.due_date, t.recurrence, t.recurrence_days,
            t.completed_at, t.time_spent_minutes, t.completed_by, t.sort_order
     FROM household_tasks t
     LEFT JOIN users u ON u.id = t.assigned_to
     LEFT JOIN dependents d ON d.id = t.assigned_dependent_id
     WHERE t.household_id = ?
     ORDER BY t.sort_order ASC`,
  )
    .bind(householdId)
    .all<TaskRow>()

  return json({ tasks: results })
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const userId = await getUserId(request, env)
  if (!userId) return errorResponse('Não autenticado.', 401)

  const householdId = await getHouseholdIdForUser(userId, env)
  if (!householdId) return errorResponse('Você ainda não faz parte de uma casa.', 400)
  if (await isViewer(userId, householdId, env)) return errorResponse(VIEWER_ERROR_MESSAGE, 403)

  const body = (await request.json().catch(() => null)) as CreateBody | null
  if (!body?.title?.trim()) return errorResponse('Informe o título da tarefa.')

  if (body.assignedTo) {
    const isMember = await env.DB.prepare(
      'SELECT 1 FROM household_members WHERE household_id = ? AND user_id = ?',
    )
      .bind(householdId, body.assignedTo)
      .first()
    if (!isMember) return errorResponse('Responsável inválido.')
  }
  if (body.assignedDependentId) {
    const isDependent = await env.DB.prepare('SELECT 1 FROM dependents WHERE id = ? AND household_id = ?')
      .bind(body.assignedDependentId, householdId)
      .first()
    if (!isDependent) return errorResponse('Dependente inválido.')
  }

  const maxOrder = await env.DB.prepare('SELECT MAX(sort_order) AS max FROM household_tasks WHERE household_id = ?')
    .bind(householdId)
    .first<{ max: number | null }>()

  const id = randomId()
  await env.DB.prepare(
    'INSERT INTO household_tasks (id, household_id, title, icon, assigned_to, assigned_dependent_id, status, due_date, recurrence, recurrence_days, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
  )
    .bind(
      id,
      householdId,
      body.title.trim(),
      body.icon ?? '✅',
      body.assignedDependentId ? null : (body.assignedTo ?? null),
      body.assignedDependentId ?? null,
      'pending',
      body.dueDate ?? null,
      body.recurrence ?? null,
      body.recurrence === 'custom' ? body.recurrenceDays ?? null : null,
      (maxOrder?.max ?? -1) + 1,
    )
    .run()

  await logActivity(env, householdId, userId, 'task', `criou a tarefa "${body.title.trim()}"`, body.icon ?? '✅')

  return json({ id }, { status: 201 })
}
