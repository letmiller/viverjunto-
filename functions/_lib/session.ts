import { verifyJwt } from './crypto'

export interface Env {
  DB: D1Database
  JWT_SECRET: string
  RESEND_API_KEY: string
  RESEND_FROM_EMAIL?: string
  CRON_SECRET: string
  VAPID_PUBLIC_KEY?: string
  VAPID_PRIVATE_KEY?: string
  VAPID_SUBJECT?: string
}

export const SESSION_COOKIE = 'vj_session'

export function sessionCookieHeader(token: string, request: Request): string {
  const maxAge = 60 * 60 * 24 * 30
  const secure = new URL(request.url).protocol === 'https:' ? ' Secure;' : ''
  return `${SESSION_COOKIE}=${token}; Path=/; HttpOnly;${secure} SameSite=Lax; Max-Age=${maxAge}`
}

export function clearSessionCookieHeader(request: Request): string {
  const secure = new URL(request.url).protocol === 'https:' ? ' Secure;' : ''
  return `${SESSION_COOKIE}=; Path=/; HttpOnly;${secure} SameSite=Lax; Max-Age=0`
}

export function getCookie(request: Request, name: string): string | null {
  const header = request.headers.get('Cookie')
  if (!header) return null
  for (const part of header.split(';')) {
    const [k, ...rest] = part.trim().split('=')
    if (k === name) return rest.join('=')
  }
  return null
}

export async function getUserId(request: Request, env: Env): Promise<string | null> {
  const token = getCookie(request, SESSION_COOKIE)
  if (!token) return null
  const payload = await verifyJwt(token, env.JWT_SECRET)
  return payload?.sub ?? null
}

export function json(data: unknown, init?: ResponseInit): Response {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
  })
}

export function errorResponse(message: string, status = 400): Response {
  return json({ error: message }, { status })
}
