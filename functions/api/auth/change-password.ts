import { hashPassword, verifyPassword } from '../../_lib/crypto'
import { type Env, errorResponse, getUserId, json } from '../../_lib/session'

interface Body {
  currentPassword?: string
  newPassword?: string
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const userId = await getUserId(request, env)
  if (!userId) return errorResponse('Não autenticado.', 401)

  const body = (await request.json().catch(() => null)) as Body | null
  if (!body?.currentPassword || !body?.newPassword) {
    return errorResponse('Informe a senha atual e a nova senha.')
  }
  if (body.newPassword.length < 6) {
    return errorResponse('A nova senha precisa ter pelo menos 6 caracteres.')
  }

  const user = await env.DB.prepare('SELECT password_hash FROM users WHERE id = ?')
    .bind(userId)
    .first<{ password_hash: string }>()
  if (!user) return errorResponse('Conta não encontrada.', 404)

  const currentOk = await verifyPassword(body.currentPassword, user.password_hash)
  if (!currentOk) return errorResponse('Senha atual incorreta.', 400)

  const passwordHash = await hashPassword(body.newPassword)
  await env.DB.prepare('UPDATE users SET password_hash = ? WHERE id = ?').bind(passwordHash, userId).run()

  return json({ ok: true })
}
