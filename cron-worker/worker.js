export default {
  async scheduled(event, env, ctx) {
    ctx.waitUntil(runDigests(env))
  },
  // Lets us trigger a run manually over HTTP for testing (still requires the
  // same secret, so it's not an open endpoint).
  async fetch(request, env) {
    const secret = new URL(request.url).searchParams.get('secret')
    if (secret !== env.CRON_SECRET) return new Response('Not authorized', { status: 401 })
    const results = await runDigests(env)
    return new Response(JSON.stringify(results, null, 2), { headers: { 'Content-Type': 'application/json' } })
  },
}

// One entry per digest to trigger daily. Add more paths here (tasks-due,
// weekly, monthly-summary) whenever those should start firing too — they're
// already implemented on the Pages Functions side, just never called.
const DIGEST_PATHS = ['/api/digest/bills-due']

async function runDigests(env) {
  const results = {}
  for (const path of DIGEST_PATHS) {
    try {
      const res = await fetch(`${env.APP_ORIGIN}${path}`, {
        method: 'POST',
        headers: { 'X-Cron-Secret': env.CRON_SECRET },
      })
      results[path] = { status: res.status, body: await res.text() }
    } catch (err) {
      results[path] = { error: String(err) }
    }
  }
  return results
}
