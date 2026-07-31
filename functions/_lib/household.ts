import type { Env } from './session'

export const MAX_HOUSEHOLD_MEMBERS = 8

export async function getHouseholdIdForUser(userId: string, env: Env): Promise<string | null> {
  const row = await env.DB.prepare('SELECT household_id FROM household_members WHERE user_id = ? LIMIT 1')
    .bind(userId)
    .first<{ household_id: string }>()
  return row?.household_id ?? null
}

export async function isHouseholdFull(householdId: string, env: Env): Promise<boolean> {
  const memberCount = await env.DB.prepare('SELECT COUNT(*) AS n FROM household_members WHERE household_id = ?')
    .bind(householdId)
    .first<{ n: number }>()
  return !!memberCount && memberCount.n >= MAX_HOUSEHOLD_MEMBERS
}

export const VIEWER_ERROR_MESSAGE = 'Sua conta tem acesso somente leitura nessa casa.'

// A 'viewer' can see everything but can't create/edit/delete anything.
// Call at the top of every write handler (POST/PATCH/PUT/DELETE) that
// mutates household-shared data, right after resolving householdId.
export async function isViewer(userId: string, householdId: string, env: Env): Promise<boolean> {
  const row = await env.DB.prepare(
    "SELECT 1 FROM household_members WHERE household_id = ? AND user_id = ? AND role = 'viewer'",
  )
    .bind(householdId, userId)
    .first()
  return !!row
}
