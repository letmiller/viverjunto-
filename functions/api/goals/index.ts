import { randomId } from '../../_lib/crypto'
import { getHouseholdIdForUser, isViewer, VIEWER_ERROR_MESSAGE } from '../../_lib/household'
import { type Env, errorResponse, getUserId, json } from '../../_lib/session'

interface GoalRow {
  id: string
  title: string
  icon: string | null
  target_amount: number | null
  saved_amount: number
  assigned_to: string | null
  assignee_name: string | null
  sort_order: number
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const userId = await getUserId(request, env)
  if (!userId) return errorResponse('Não autenticado.', 401)

  const householdId = await getHouseholdIdForUser(userId, env)
  if (!householdId) return json({ goals: [] })

  const { results } = await env.DB.prepare(
    `SELECT g.id, g.title, g.icon, g.target_amount, g.saved_amount, g.assigned_to, u.name AS assignee_name, g.sort_order
     FROM goals g
     LEFT JOIN users u ON u.id = g.assigned_to
     WHERE g.household_id = ?
     ORDER BY g.sort_order ASC`,
  )
    .bind(householdId)
    .all<GoalRow>()

  return json({ goals: results })
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const userId = await getUserId(request, env)
  if (!userId) return errorResponse('Não autenticado.', 401)

  const householdId = await getHouseholdIdForUser(userId, env)
  if (!householdId) return errorResponse('Você ainda não faz parte de uma casa.', 400)
  if (await isViewer(userId, householdId, env)) return errorResponse(VIEWER_ERROR_MESSAGE, 403)

  const body = (await request.json().catch(() => null)) as { titles?: { title: string; icon: string }[] } | null
  if (!body?.titles?.length) return errorResponse('Selecione ao menos um objetivo.')

  // Reconcile instead of blind replace, so progress (target/saved amount) on
  // goals the user keeps selected isn't wiped out.
  const { results: existing } = await env.DB.prepare('SELECT id, title FROM goals WHERE household_id = ?')
    .bind(householdId)
    .all<{ id: string; title: string }>()

  const wantedTitles = new Set(body.titles.map((t) => t.title))
  const existingTitles = new Set(existing.map((g) => g.title))

  const toDelete = existing.filter((g) => !wantedTitles.has(g.title))
  const toInsert = body.titles.filter((t) => !existingTitles.has(t.title))

  const maxOrder = await env.DB.prepare('SELECT MAX(sort_order) AS max FROM goals WHERE household_id = ?')
    .bind(householdId)
    .first<{ max: number | null }>()
  let nextOrder = (maxOrder?.max ?? -1) + 1

  const statements = [
    ...toDelete.map((g) => env.DB.prepare('DELETE FROM goals WHERE id = ?').bind(g.id)),
    ...toInsert.map((t) =>
      env.DB.prepare('INSERT INTO goals (id, household_id, title, icon, sort_order) VALUES (?, ?, ?, ?, ?)').bind(
        randomId(),
        householdId,
        t.title,
        t.icon,
        nextOrder++,
      ),
    ),
  ]
  if (statements.length > 0) await env.DB.batch(statements)

  return json({ ok: true }, { status: 201 })
}
