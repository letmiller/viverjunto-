import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Screen } from '../components/layout/Screen'
import { AuraBackground } from '../components/ui/AuraBackground'
import { Button } from '../components/ui/Button'
import { auth, ApiError } from '../lib/api'
import { useSession } from '../store/session'

export function VerifyEmailPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const token = params.get('token') ?? ''
  const user = useSession((s) => s.user)
  const setUser = useSession((s) => s.setUser)
  const [status, setStatus] = useState<'checking' | 'done' | 'error'>('checking')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setError('Link inválido. Solicite um novo email de confirmação no seu perfil.')
      return
    }
    auth
      .verifyEmail(token)
      .then(() => {
        setStatus('done')
        if (user) setUser({ ...user, emailVerified: true })
      })
      .catch((err) => {
        setStatus('error')
        setError(err instanceof ApiError ? err.message : 'Não foi possível confirmar seu email.')
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  return (
    <Screen scroll>
      <AuraBackground
        auras={[
          { color: 'teal', size: 240, top: -60, left: 200 },
          { color: 'coral', size: 180, bottom: -80, left: -60 },
        ]}
      />

      <div className="relative z-10 flex min-h-0 flex-1 flex-col items-center justify-center gap-4 overflow-y-auto px-6 py-10 text-center">
        {status === 'checking' && (
          <span className="size-6 animate-spin rounded-full border-2 border-forest-100 border-t-teal-500" />
        )}
        {status === 'done' && (
          <>
            <span className="text-3xl">✅</span>
            <h1 className="text-[22px] font-bold text-forest-900">Email confirmado!</h1>
            <p className="text-sm text-forest-700">Agora você vai receber os resumos e lembretes certinho.</p>
            <Button onClick={() => navigate(user ? '/dashboard' : '/login')}>Continuar</Button>
          </>
        )}
        {status === 'error' && (
          <>
            <span className="text-3xl">⚠️</span>
            <h1 className="text-[22px] font-bold text-forest-900">Não deu certo</h1>
            <p className="text-sm text-forest-700">{error}</p>
            <Button onClick={() => navigate(user ? '/perfil' : '/login')}>
              {user ? 'Ir para o perfil' : 'Ir para o login'}
            </Button>
          </>
        )}
      </div>
    </Screen>
  )
}
