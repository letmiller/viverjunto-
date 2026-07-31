import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { ErrorBoundary } from './components/layout/ErrorBoundary.tsx'
import { initTheme } from './lib/theme'

initTheme()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ErrorBoundary>
  </StrictMode>,
)

// A stale tab can hold references to JS chunk URLs from a build that's since
// been replaced (chunk filenames are content-hashed). When that happens the
// lazy route import 404s and — with no error boundary — takes the whole app
// down. Vite fires this event for exactly that failure; reload to fetch the
// current build instead of showing a blank screen.
window.addEventListener('vite:preloadError', () => {
  window.location.reload()
})

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then((reg) => {
      // The browser only checks for a new SW on navigation (or ~daily) —
      // a PWA reopened from the home screen without a real page load can
      // sit on a stale build indefinitely otherwise. Check explicitly
      // whenever the app comes back to the foreground.
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') reg.update().catch(() => {})
      })
    }).catch(() => {})
  })
  // Same idea for the service worker: once a new one takes control, reload
  // so the page isn't left running old JS against a fresh cache.
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    window.location.reload()
  })
}
