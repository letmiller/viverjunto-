import { getHouseholdIdForUser } from '../../_lib/household'
import { type Env, clearSessionCookieHeader, errorResponse, getUserId, json } from '../../_lib/session'

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const userId = await getUserId(request, env)
  if (!userId) return errorResponse('Não autenticado.', 401)

  const user = await env.DB.prepare('SELECT email FROM users WHERE id = ?').bind(userId).first<{ email: string }>()
  const householdId = await getHouseholdIdForUser(userId, env)

  // Everything below runs as one atomic batch so a failure partway through
  // (e.g. an unhandled FK) never leaves membership deleted but the
  // household/its data still dangling — which would orphan the household
  // and make a retry unable to find it via getHouseholdIdForUser again.
  const statements = [env.DB.prepare('DELETE FROM household_members WHERE user_id = ?').bind(userId)]

  if (householdId) {
    const remaining = await env.DB.prepare(
      'SELECT COUNT(*) AS n FROM household_members WHERE household_id = ? AND user_id != ?',
    )
      .bind(householdId, userId)
      .first<{ n: number }>()

    if (!remaining || remaining.n === 0) {
      const list = await env.DB.prepare('SELECT id FROM shopping_lists WHERE household_id = ?')
        .bind(householdId)
        .first<{ id: string }>()
      if (list) statements.push(env.DB.prepare('DELETE FROM shopping_items WHERE list_id = ?').bind(list.id))

      statements.push(
        env.DB.prepare(
          'DELETE FROM activity_reactions WHERE activity_id IN (SELECT id FROM activity_log WHERE household_id = ?)',
        ).bind(householdId),
        env.DB.prepare('DELETE FROM shopping_purchase_log WHERE household_id = ?').bind(householdId),
        env.DB.prepare('DELETE FROM shopping_lists WHERE household_id = ?').bind(householdId),
        env.DB.prepare('DELETE FROM household_tasks WHERE household_id = ?').bind(householdId),
        env.DB.prepare('DELETE FROM dependents WHERE household_id = ?').bind(householdId),
        env.DB.prepare('DELETE FROM transactions WHERE household_id = ?').bind(householdId),
        env.DB.prepare('DELETE FROM financial_accounts WHERE household_id = ?').bind(householdId),
        env.DB.prepare('DELETE FROM financial_settings WHERE household_id = ?').bind(householdId),
        env.DB.prepare('DELETE FROM routine_settings WHERE household_id = ?').bind(householdId),
        env.DB.prepare('DELETE FROM goals WHERE household_id = ?').bind(householdId),
        env.DB.prepare('DELETE FROM bills WHERE household_id = ?').bind(householdId),
        env.DB.prepare('DELETE FROM invites WHERE household_id = ?').bind(householdId),
        env.DB.prepare('DELETE FROM daily_checkins WHERE household_id = ?').bind(householdId),
        env.DB.prepare('DELETE FROM budgets WHERE household_id = ?').bind(householdId),
        env.DB.prepare('DELETE FROM settlements WHERE household_id = ?').bind(householdId),
        env.DB.prepare('DELETE FROM activity_log WHERE household_id = ?').bind(householdId),
        env.DB.prepare('DELETE FROM households WHERE id = ?').bind(householdId),
      )
    } else {
      // Household persists — this user's own footprint (activity log,
      // creator/assignee references) is erased unconditionally below,
      // covering this household and any other they've since left.

      // households.created_by is a NOT NULL reference to users(id) — if this
      // user created the household, deleting their row would orphan it.
      // Hand ownership (role + created_by) to the next-oldest remaining
      // member, mirroring the transfer leave.ts already does.
      const household = await env.DB.prepare('SELECT created_by FROM households WHERE id = ?')
        .bind(householdId)
        .first<{ created_by: string }>()
      if (household?.created_by === userId) {
        const nextMember = await env.DB.prepare(
          'SELECT user_id FROM household_members WHERE household_id = ? AND user_id != ? ORDER BY joined_at ASC LIMIT 1',
        )
          .bind(householdId, userId)
          .first<{ user_id: string }>()
        if (nextMember) {
          statements.push(
            env.DB.prepare("UPDATE household_members SET role = 'owner' WHERE household_id = ? AND user_id = ?").bind(
              householdId,
              nextMember.user_id,
            ),
            env.DB.prepare('UPDATE households SET created_by = ? WHERE id = ?').bind(nextMember.user_id, householdId),
          )
        }
      }
    }
  }

  // Detach creator/assignee/activity references unconditionally — not just
  // in the user's current household, since they may have left or been
  // removed from a household while their tasks/transactions/activity there
  // still point to them. Reactions on their own activity entries must go
  // before the activity_log rows themselves (FK order).
  statements.push(
    env.DB.prepare('UPDATE transactions SET created_by = NULL WHERE created_by = ?').bind(userId),
    env.DB.prepare('UPDATE household_tasks SET assigned_to = NULL WHERE assigned_to = ?').bind(userId),
    env.DB.prepare('UPDATE household_tasks SET completed_by = NULL WHERE completed_by = ?').bind(userId),
    env.DB.prepare('UPDATE bills SET created_by = NULL WHERE created_by = ?').bind(userId),
    env.DB.prepare('UPDATE bills SET assigned_to = NULL WHERE assigned_to = ?').bind(userId),
    env.DB.prepare('UPDATE goals SET assigned_to = NULL WHERE assigned_to = ?').bind(userId),
    env.DB.prepare('UPDATE shopping_items SET added_by = NULL WHERE added_by = ?').bind(userId),
    env.DB.prepare('DELETE FROM settlements WHERE from_user_id = ? OR to_user_id = ?').bind(userId, userId),
    env.DB.prepare(
      'DELETE FROM activity_reactions WHERE activity_id IN (SELECT id FROM activity_log WHERE user_id = ?)',
    ).bind(userId),
    env.DB.prepare('DELETE FROM activity_log WHERE user_id = ?').bind(userId),
    env.DB.prepare('DELETE FROM activity_reactions WHERE user_id = ?').bind(userId),
    env.DB.prepare('DELETE FROM email_verifications WHERE user_id = ?').bind(userId),
    env.DB.prepare('DELETE FROM password_resets WHERE user_id = ?').bind(userId),
    env.DB.prepare('DELETE FROM push_subscriptions WHERE user_id = ?').bind(userId),
  )
  if (user) {
    statements.push(env.DB.prepare('DELETE FROM login_attempts WHERE email = ?').bind(user.email))
  }
  statements.push(env.DB.prepare('DELETE FROM users WHERE id = ?').bind(userId))

  await env.DB.batch(statements)

  return json({ ok: true }, { headers: { 'Set-Cookie': clearSessionCookieHeader(request) } })
}
