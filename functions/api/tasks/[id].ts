import { randomId } from '../../_lib/crypto'
import { getHouseholdIdForUser, isViewer, VIEWER_ERROR_MESSAGE } from '../../_lib/household'
import { logActivity } from '../../_lib/activity'
import { type Env, errorResponse, getUserId, json } from '../../_lib/session'

interface PatchBody {
  status?: 'pending' | 'done'
  timeSpentMinutes?: number
  title?: string
  icon?: string
  assignedTo?: string | null
  assignedDependentId?: string | null
  dueDate?: string | null
  recurrence?: string | null
  recurrenceDays?: string | null
}

interface TaskRow {
  id: string
  title: string
  icon: string | null
  assigned_to: string | null
  assigned_dependent_id: string | null
  due_date: string | null
  recurrence: string | null
  recurrence_days: string | null
  sort_order: number
}

// recurrenceDays is only meaningful for recurrence === 'custom': a
// comma-separated list of weekday numbers (0 = Sunday .. 6 = Saturday) —
// e.g. tasks that repeat every Mon/Wed/Fri instead of a fixed interval.
function nextDueDate(fromDate: string | null, recurrence: string, recurrenceDays: string | null): string {
  // Parse as local calendar components, not `new Date(fromDate)` — that
  // reads "YYYY-MM-DD" as UTC midnight, which can land on the previous
  // local day (and therefore the wrong weekday) depending on the runtime's
  // offset. Custom weekday recurrence depends on getDay() being correct.
  const base = fromDate
    ? (() => {
        const [y, m, d] = fromDate.split('-').map(Number)
        return new Date(y, m - 1, d)
      })()
    : new Date()
  if (recurrence === 'daily') base.setDate(base.getDate() + 1)
  else if (recurrence === 'weekly') base.setDate(base.getDate() + 7)
  else if (recurrence === 'biweekly') base.setDate(base.getDate() + 14)
  else if (recurrence === 'monthly') base.setMonth(base.getMonth() + 1)
  else if (recurrence === 'custom') {
    const days = (recurrenceDays ?? '')
      .split(',')
      .map(Number)
      .filter((n) => !Number.isNaN(n) && n >= 0 && n <= 6)
    if (days.length === 0) {
      base.setDate(base.getDate() + 7)
    } else {
      do {
        base.setDate(base.getDate() + 1)
      } while (!days.includes(base.getDay()))
    }
  }
  return `${base.getFullYear()}-${String(base.getMonth() + 1).padStart(2, '0')}-${String(base.getDate()).padStart(2, '0')}`
}

export const onRequestPatch: PagesFunction<Env> = async ({ request, env, params }) => {
  const userId = await getUserId(request, env)
  if (!userId) return errorResponse('Não autenticado.', 401)

  const householdId = await getHouseholdIdForUser(userId, env)
  if (!householdId) return errorResponse('Você ainda não faz parte de uma casa.', 400)
  if (await isViewer(userId, householdId, env)) return errorResponse(VIEWER_ERROR_MESSAGE, 403)

  const body = (await request.json().catch(() => null)) as PatchBody | null
  if (!body) return errorResponse('Dados inválidos.')

  const id = params.id as string
  const task = await env.DB.prepare(
    'SELECT id, title, icon, assigned_to, assigned_dependent_id, due_date, recurrence, recurrence_days, sort_order FROM household_tasks WHERE id = ? AND household_id = ?',
  )
    .bind(id, householdId)
    .first<TaskRow>()
  if (!task) return errorResponse('Tarefa não encontrada.', 404)

  if (body.status) {
    if (!['pending', 'done'].includes(body.status)) return errorResponse('Status inválido.')

    const timeSpentMinutes =
      body.status === 'done' && typeof body.timeSpentMinutes === 'number' && body.timeSpentMinutes > 0
        ? Math.round(body.timeSpentMinutes)
        : null
    const completedBy = body.status === 'done' && timeSpentMinutes ? userId : null

    await env.DB.prepare(
      "UPDATE household_tasks SET status = ?, completed_at = CASE WHEN ? = 'done' THEN datetime('now') ELSE NULL END, time_spent_minutes = ?, completed_by = ? WHERE id = ? AND household_id = ?",
    )
      .bind(body.status, body.status, timeSpentMinutes, completedBy, id, householdId)
      .run()

    if (body.status === 'done') {
      await logActivity(env, householdId, userId, 'task', `concluiu a tarefa "${task.title}"`, task.icon ?? '✅')

      if (task.recurrence && task.recurrence !== 'none') {
        await env.DB.prepare(
          'INSERT INTO household_tasks (id, household_id, title, icon, assigned_to, assigned_dependent_id, status, due_date, recurrence, recurrence_days, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        )
          .bind(
            randomId(),
            householdId,
            task.title,
            task.icon,
            task.assigned_to,
            task.assigned_dependent_id,
            'pending',
            nextDueDate(task.due_date, task.recurrence, task.recurrence_days),
            task.recurrence,
            task.recurrence_days,
            task.sort_order,
          )
          .run()
      }
    }

    return json({ ok: true })
  }

  if (!body.title?.trim()) return errorResponse('Informe o nome da tarefa.')

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

  await env.DB.prepare(
    'UPDATE household_tasks SET title = ?, icon = ?, assigned_to = ?, assigned_dependent_id = ?, due_date = ?, recurrence = ?, recurrence_days = ? WHERE id = ? AND household_id = ?',
  )
    .bind(
      body.title.trim(),
      body.icon ?? task.icon,
      body.assignedDependentId ? null : body.assignedTo || null,
      body.assignedDependentId || null,
      body.dueDate || null,
      body.recurrence || null,
      body.recurrence === 'custom' ? body.recurrenceDays || null : null,
      id,
      householdId,
    )
    .run()

  await logActivity(env, householdId, userId, 'task', `editou a tarefa "${body.title.trim()}"`, body.icon ?? task.icon ?? '✏️')

  return json({ ok: true })
}

export const onRequestDelete: PagesFunction<Env> = async ({ request, env, params }) => {
  const userId = await getUserId(request, env)
  if (!userId) return errorResponse('Não autenticado.', 401)

  const householdId = await getHouseholdIdForUser(userId, env)
  if (!householdId) return errorResponse('Você ainda não faz parte de uma casa.', 400)
  if (await isViewer(userId, householdId, env)) return errorResponse(VIEWER_ERROR_MESSAGE, 403)

  const id = params.id as string
  const task = await env.DB.prepare('SELECT id, title, icon FROM household_tasks WHERE id = ? AND household_id = ?')
    .bind(id, householdId)
    .first<{ id: string; title: string; icon: string | null }>()
  if (!task) return errorResponse('Tarefa não encontrada.', 404)

  await env.DB.prepare('DELETE FROM household_tasks WHERE id = ? AND household_id = ?').bind(id, householdId).run()

  await logActivity(env, householdId, userId, 'task', `excluiu a tarefa "${task.title}"`, '🗑️')

  return json({ ok: true })
}
