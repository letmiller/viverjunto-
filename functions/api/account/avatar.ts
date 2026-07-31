import { type Env, errorResponse, getUserId, json } from '../../_lib/session'

const MAX_DATA_URI_LENGTH = 300_000

export const onRequestPut: PagesFunction<Env> = async ({ request, env }) => {
  const userId = await getUserId(request, env)
  if (!userId) return errorResponse('Não autenticado.', 401)

  const body = (await request.json().catch(() => null)) as { avatarUrl?: string | null } | null
  if (body?.avatarUrl === undefined) return errorResponse('Informe a imagem.')

  if (body.avatarUrl !== null) {
    if (!body.avatarUrl.startsWith('data:image/')) return errorResponse('Formato de imagem inválido.')
    if (body.avatarUrl.length > MAX_DATA_URI_LENGTH) return errorResponse('Imagem muito grande.')
  }

  await env.DB.prepare('UPDATE users SET avatar_url = ? WHERE id = ?').bind(body.avatarUrl, userId).run()

  return json({ ok: true })
}
