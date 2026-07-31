// Redirects the old default Pages URL to the custom domain, preserving path
// and query string. Scoped to the exact production hostname only — the
// preview subdomain (dev.viver-junto.pages.dev) and the custom domain itself
// are left alone, so this can never loop.
export const onRequest: PagesFunction = async ({ request, next }) => {
  const url = new URL(request.url)
  if (url.hostname === 'viver-junto.pages.dev') {
    url.hostname = 'viverjunto.app'
    return Response.redirect(url.toString(), 301)
  }
  return next()
}
