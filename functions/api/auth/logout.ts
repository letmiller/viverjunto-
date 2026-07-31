import { clearSessionCookieHeader, json } from '../../_lib/session'

export const onRequestPost: PagesFunction = async ({ request }) => {
  return json({ ok: true }, { headers: { 'Set-Cookie': clearSessionCookieHeader(request) } })
}
