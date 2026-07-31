import { randomId } from './crypto'
import type { Env } from './session'

export async function logActivity(
  env: Env,
  householdId: string,
  userId: string,
  type: string,
  description: string,
  icon: string,
): Promise<void> {
  await env.DB.prepare(
    'INSERT INTO activity_log (id, household_id, user_id, type, description, icon) VALUES (?, ?, ?, ?, ?, ?)',
  )
    .bind(randomId(), householdId, userId, type, description, icon)
    .run()
}
