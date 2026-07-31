import type { Env } from './session'
import { sendWebPush } from './webpush'

interface SubscriptionRow {
  id: string
  endpoint: string
  p256dh: string
  auth: string
}

// Best-effort push fan-out to every device a user has subscribed from.
// Silently no-ops if VAPID isn't configured (push is an optional channel
// alongside email, never a hard dependency of the digest crons).
export async function sendPushToUser(
  env: Env,
  userId: string,
  payload: { title: string; body: string; url?: string },
): Promise<void> {
  if (!env.VAPID_PUBLIC_KEY || !env.VAPID_PRIVATE_KEY) return

  const { results: subs } = await env.DB.prepare(
    'SELECT id, endpoint, p256dh, auth FROM push_subscriptions WHERE user_id = ?',
  )
    .bind(userId)
    .all<SubscriptionRow>()

  if (subs.length === 0) return

  const vapid = {
    publicKey: env.VAPID_PUBLIC_KEY,
    privateKey: env.VAPID_PRIVATE_KEY,
    subject: env.VAPID_SUBJECT || 'mailto:contato@viverjunto.app',
  }

  for (const sub of subs) {
    try {
      const res = await sendWebPush(sub, payload, vapid)
      // 404/410 means the push service considers the subscription gone
      // (unsubscribed, expired, or browser data cleared) — clean it up.
      if (res.status === 404 || res.status === 410) {
        await env.DB.prepare('DELETE FROM push_subscriptions WHERE id = ?').bind(sub.id).run()
      }
    } catch {
      // Don't let one dead endpoint break the rest of the fan-out.
    }
  }
}
