import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useSession } from '../../store/session'

export function RequireAuth({ children }: { children: ReactNode }) {
  const user = useSession((s) => s.user)
  const authChecked = useSession((s) => s.authChecked)

  if (!authChecked) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-app-bg">
        <span className="size-6 animate-spin rounded-full border-2 border-forest-100 border-t-teal-500" />
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />

  return <>{children}</>
}
