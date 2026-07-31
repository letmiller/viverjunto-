import { type Env, errorResponse, getUserId, json } from '../../_lib/session'

export const onRequestPut: PagesFunction<Env> = async ({ request, env }) => {
  const userId = await getUserId(request, env)
  if (!userId) return errorResponse('Não autenticado.', 401)

  const body = (await request.json().catch(() => null)) as { whatsappNumber?: string | null } | null
  if (body?.whatsappNumber === undefined) return errorResponse('Informe o número de WhatsApp.')

  await env.DB.prepare('UPDATE users SET whatsapp_number = ? WHERE id = ?')
    .bind(body.whatsappNumber?.trim() || null, userId)
    .run()

  return json({ ok: true })
}
