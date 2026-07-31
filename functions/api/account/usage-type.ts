import { type Env, errorResponse, getUserId, json } from '../../_lib/session'

export const onRequestPut: PagesFunction<Env> = async ({ request, env }) => {
  const userId = await getUserId(request, env)
  if (!userId) return errorResponse('Não autenticado.', 401)

  const body = (await request.json().catch(() => null)) as { usageType?: string } | null
  if (!body?.usageType) return errorResponse('Informe o tipo de uso.')

  await env.DB.prepare('UPDATE users SET usage_type = ? WHERE id = ?').bind(body.usageType, userId).run()

  return json({ ok: true })
}
