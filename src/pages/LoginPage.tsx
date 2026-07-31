import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Screen } from '../components/layout/Screen'
import { Header } from '../components/layout/Header'
import { AuraBackground } from '../components/ui/AuraBackground'
import { Input } from '../components/ui/Input'
import { Button } from '../components/ui/Button'
import { auth, household, ApiError } from '../lib/api'
import { useSession } from '../store/session'

export function LoginPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const inviteCode = params.get('entrar')
  const setUser = useSession((s) => s.setUser)
  const setHousehold = useSession((s) => s.setHousehold)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const canSubmit = email.trim() && password.length > 0

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit || loading) return
    setLoading(true)
    setError('')
    try {
      const { user } = await auth.login({ email, password })
      setUser(user)
      if (inviteCode) {
        const { household: h } = await household.join(inviteCode)
        setHousehold(h)
      }
      navigate('/dashboard')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Não foi possível entrar.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Screen scroll className="bg-white">
      <AuraBackground
        auras={[
          { color: 'teal', size: 240, top: -60, left: 200 },
          { color: 'coral', size: 180, bottom: -80, left: -60 },
        ]}
      />
      <Header showBack />

      <form
        onSubmit={handleSubmit}
        className="relative z-10 flex min-h-0 flex-1 flex-col gap-7 overflow-y-auto px-6 pt-10"
      >
        <h1 className="text-[24px] font-bold leading-[1.3] text-forest-900">
          Entre e veja sua organização compartilhada.
        </h1>

        <div className="flex flex-col gap-3.5">
          <Input
            type="email"
            placeholder="Seu melhor email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
          <Input
            type="password"
            placeholder="Sua senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />
        </div>

        <button
          type="button"
          onClick={() => navigate('/esqueci-senha')}
          className="-mt-4 flex min-h-[32px] items-center self-end text-sm font-medium text-teal-700"
        >
          Esqueci minha senha
        </button>

        {error && <p className="text-sm text-error">{error}</p>}

        <Button type="submit" disabled={!canSubmit} loading={loading}>
          Entrar
        </Button>

        <div className="mt-auto flex flex-col items-center gap-1 pb-8 text-center">
          <p className="text-[13px] text-forest-500">Não tem conta?</p>
          <button
            type="button"
            onClick={() => navigate('/criar-conta')}
            className="flex min-h-[32px] items-center text-sm font-semibold text-coral-900"
          >
            Criar conta
          </button>
        </div>
      </form>
    </Screen>
  )
}
