const CACHE_NAME = 'viver-junto-v2'
// The app shell has to be cached up front — the navigate handler below only
// ever *reads* '/index.html' from cache as its offline fallback, it never
// writes to it (network-first responses for navigations aren't cached, since
// caching an HTML document keyed by every distinct route would be wrong).
// Without this precache, the very first offline visit has nothing to fall
// back to.
const PRECACHE_URLS = ['/', '/index.html', '/manifest.webmanifest', '/icon-192.png']

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .catch(() => {}),
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))),
  )
  self.clients.claim()
})

// Network-first for navigations and API calls (always want fresh data when online);
// cache-first with background refresh for static assets, so the app shell still
// opens when offline.
self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return

  const url = new URL(request.url)
  if (url.pathname.startsWith('/api/')) return

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => caches.match('/index.html').then((r) => r ?? Response.error())),
    )
    return
  }

  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      const cached = await cache.match(request)
      const network = fetch(request)
        .then((res) => {
          if (res.ok) cache.put(request, res.clone())
          return res
        })
        .catch(() => cached)
      return cached ?? network
    }),
  )
})

self.addEventListener('push', (event) => {
  let data = { title: 'Viver Junto', body: '', url: '/' }
  try {
    if (event.data) data = { ...data, ...event.data.json() }
  } catch {
    // ignore malformed payloads
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      data: { url: data.url || '/' },
    }),
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification.data?.url || '/'
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientsList) => {
      for (const client of clientsList) {
        if (client.url.includes(url) && 'focus' in client) return client.focus()
      }
      if (self.clients.openWindow) return self.clients.openWindow(url)
    }),
  )
})
