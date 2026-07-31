import { type Env, getUserId, json } from '../../_lib/session'

interface UserRow {
  id: string
  email: string
  name: string
  whatsapp_number: string | null
  usage_type: string | null
  avatar_url: string | null
  email_verified: number
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const userId = await getUserId(request, env)
  if (!userId) return json({ user: null })

  const user = await env.DB.prepare(
    'SELECT id, email, name, whatsapp_number, usage_type, avatar_url, email_verified FROM users WHERE id = ?',
  )
    .bind(userId)
    .first<UserRow>()

  if (!user) return json({ user: null })

  return json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      whatsappNumber: user.whatsapp_number,
      usageType: user.usage_type,
      avatarUrl: user.avatar_url,
      emailVerified: !!user.email_verified,
    },
  })
}
