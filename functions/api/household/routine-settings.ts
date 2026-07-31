import { getHouseholdIdForUser, isViewer, VIEWER_ERROR_MESSAGE } from '../../_lib/household'
import { type Env, errorResponse, getUserId, json } from '../../_lib/session'

interface SettingsRow {
  lives_together: string | null
  has_pets: string | null
  has_children: string | null
  work_mode: string | null
  task_balance: string | null
  pet_count: number | null
  children_count: number | null
  age_ranges: string | null
}

interface PutBody {
  livesTogether?: string
  hasPets?: string
  hasChildren?: string
  workMode?: string
  taskBalance?: string
  petCount?: number
  childrenCount?: number
  ageRanges?: string[]
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const userId = await getUserId(request, env)
  if (!userId) return errorResponse('Não autenticado.', 401)

  const householdId = await getHouseholdIdForUser(userId, env)
  if (!householdId) return json({ settings: null })

  const row = await env.DB.prepare(
    'SELECT lives_together, has_pets, has_children, work_mode, task_balance, pet_count, children_count, age_ranges FROM routine_settings WHERE household_id = ?',
  )
    .bind(householdId)
    .first<SettingsRow>()

  return json({
    settings: row ? { ...row, age_ranges: row.age_ranges ? JSON.parse(row.age_ranges) : [] } : null,
  })
}

export const onRequestPut: PagesFunction<Env> = async ({ request, env }) => {
  const userId = await getUserId(request, env)
  if (!userId) return errorResponse('Não autenticado.', 401)

  const householdId = await getHouseholdIdForUser(userId, env)
  if (!householdId) return errorResponse('Você ainda não faz parte de uma casa.', 400)
  if (await isViewer(userId, householdId, env)) return errorResponse(VIEWER_ERROR_MESSAGE, 403)

  const body = (await request.json().catch(() => null)) as PutBody | null
  if (!body) return errorResponse('Corpo inválido.')
  if (body.petCount !== undefined && !(Number.isInteger(body.petCount) && body.petCount >= 0 && body.petCount <= 30)) {
    return errorResponse('Quantidade de pets inválida.')
  }
  if (
    body.childrenCount !== undefined &&
    !(Number.isInteger(body.childrenCount) && body.childrenCount >= 0 && body.childrenCount <= 30)
  ) {
    return errorResponse('Quantidade de filhos inválida.')
  }
  if (body.ageRanges !== undefined) {
    if (!Array.isArray(body.ageRanges) || body.ageRanges.length > 10 || body.ageRanges.some((r) => typeof r !== 'string' || r.length > 50)) {
      return errorResponse('Faixas etárias inválidas.')
    }
  }

  await env.DB.prepare(
    `INSERT INTO routine_settings (household_id, lives_together, has_pets, has_children, work_mode, task_balance, pet_count, children_count, age_ranges)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(household_id) DO UPDATE SET
       lives_together = excluded.lives_together,
       has_pets = excluded.has_pets,
       has_children = excluded.has_children,
       work_mode = excluded.work_mode,
       task_balance = excluded.task_balance,
       pet_count = excluded.pet_count,
       children_count = excluded.children_count,
       age_ranges = excluded.age_ranges`,
  )
    .bind(
      householdId,
      body.livesTogether ?? null,
      body.hasPets ?? null,
      body.hasChildren ?? null,
      body.workMode ?? null,
      body.taskBalance ?? null,
      body.petCount ?? null,
      body.childrenCount ?? null,
      body.ageRanges ? JSON.stringify(body.ageRanges) : null,
    )
    .run()

  return json({ ok: true })
}
