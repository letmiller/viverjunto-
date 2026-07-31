import { randomId } from '../../_lib/crypto'
import { type Env, errorResponse, getUserId, json } from '../../_lib/session'

interface SubscribeBody {
  endpoint?: string
  keys?: { p256dh?: string; auth?: string }
}

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  return json({ publicKey: env.VAPID_PUBLIC_KEY ?? null })
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const userId = await getUserId(request, env)
  if (!userId) return errorResponse('Não autenticado.', 401)
  if (!env.VAPID_PUBLIC_KEY || !env.VAPID_PRIVATE_KEY) {
    return errorResponse('Notificações push não estão configuradas neste ambiente.', 503)
  }

  const body = (await request.json().catch(() => null)) as SubscribeBody | null
  if (!body?.endpoint || !body.keys?.p256dh || !body.keys?.auth) {
    return errorResponse('Inscrição inválida.')
  }

  const existing = await env.DB.prepare('SELECT id FROM push_subscriptions WHERE endpoint = ?')
    .bind(body.endpoint)
    .first<{ id: string }>()

  if (existing) {
    await env.DB.prepare(
      'UPDATE push_subscriptions SET user_id = ?, p256dh = ?, auth = ? WHERE id = ?',
    )
      .bind(userId, body.keys.p256dh, body.keys.auth, existing.id)
      .run()
    return json({ id: existing.id })
  }

  const id = randomId()
  await env.DB.prepare(
    'INSERT INTO push_subscriptions (id, user_id, endpoint, p256dh, auth) VALUES (?, ?, ?, ?, ?)',
  )
    .bind(id, userId, body.endpoint, body.keys.p256dh, body.keys.auth)
    .run()

  return json({ id }, { status: 201 })
}

export const onRequestDelete: PagesFunction<Env> = async ({ request, env }) => {
  const userId = await getUserId(request, env)
  if (!userId) return errorResponse('Não autenticado.', 401)

  const body = (await request.json().catch(() => null)) as { endpoint?: string } | null
  if (!body?.endpoint) return errorResponse('Informe o endpoint da inscrição.')

  await env.DB.prepare('DELETE FROM push_subscriptions WHERE user_id = ? AND endpoint = ?')
    .bind(userId, body.endpoint)
    .run()

  return json({ ok: true })
}
