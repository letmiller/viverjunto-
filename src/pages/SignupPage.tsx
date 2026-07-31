import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Screen } from '../components/layout/Screen'
import { Header } from '../components/layout/Header'
import { AuraBackground } from '../components/ui/AuraBackground'
import { Input } from '../components/ui/Input'
import { Button } from '../components/ui/Button'
import { auth, ApiError } from '../lib/api'
import { useSession } from '../store/session'

const CONFETTI = [
  { x: 13.7, y: 23.5, size: 10, color: '#FF8A7A' },
  { x: 81.4, y: 24.6, size: 8, color: '#F5D8A6' },
  { x: 9.7, y: 35.2, size: 8, color: '#6BA6A0' },
  { x: 86.5, y: 36.4, size: 10, color: '#FF8A7A' },
  { x: 17.8, y: 41.1, size: 6, color: '#F5D8A6' },
  { x: 78.9, y: 39.9, size: 7, color: '#6BA6A0' },
]

export function SignupPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const inviteCode = params.get('entrar') ?? undefined
  const setUser = useSession((s) => s.setUser)
  const setHousehold = useSession((s) => s.setHousehold)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [whatsappNumber, setWhatsappNumber] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [accountCreated, setAccountCreated] = useState(false)

  const canSubmit = name.trim() && email.trim() && password.length >= 6 && whatsappNumber.trim()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit || loading) return
    setLoading(true)
    setError('')
    try {
      const { user, household } = await auth.signup({ name, email, password, whatsappNumber, inviteCode })
      setUser(user)
      setHousehold(household)
      setAccountCreated(true)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Não foi possível criar sua conta.')
    } finally {
      setLoading(false)
    }
  }

  if (accountCreated) {
    const firstName = name.trim().split(' ')[0]
    return (
      <Screen className="bg-white">
        <AuraBackground
          auras={[
            { color: 'teal', size: 300, top: -80, left: 134 },
            { color: 'coral', size: 200, bottom: -40, left: -40 },
          ]}
        />
        {CONFETTI.map((c, i) => (
          <span
            key={i}
            className="absolute rounded-full"
            style={{ left: `${c.x}%`, top: `${c.y}%`, width: c.size, height: c.size, backgroundColor: c.color }}
          />
        ))}
        <div className="relative z-10 flex min-h-svh flex-col items-center justify-center gap-6 px-6 text-center">
          <span className="flex size-[100px] items-center justify-center rounded-full bg-teal-500 text-[40px] text-white shadow-lg">
            ✓
          </span>
          <div>
            <h1 className="text-[28px] font-bold leading-[1.3] text-forest-900">Conta criada com sucesso!</h1>
            <p className="mt-2 text-sm leading-[1.55] text-forest-700">
              Bem-vindo ao ViverJunto, {firstName}.
              <br />
              Agora é hora de construir algo incrível juntos.
            </p>
          </div>
          <Button onClick={() => navigate(inviteCode ? '/dashboard' : '/tipo-de-uso')}>Começar a organizar</Button>
        </div>
      </Screen>
    )
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
        <div>
          <h1 className="text-[24px] font-bold leading-[1.3] text-forest-900">
            {inviteCode ? 'Você foi convidado(a)! Crie sua conta para entrar.' : 'Vamos começar sua organização compartilhada.'}
          </h1>
          <p className="mt-2 text-sm leading-[1.55] text-forest-700">
            Crie sua conta para começar a construir uma rotina mais leve.
          </p>
        </div>

        <div className="flex flex-col gap-3.5">
          <Input placeholder="Seu nome" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
          <Input
            type="email"
            placeholder="Seu melhor email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
          <Input
            type="tel"
            placeholder="Seu WhatsApp (com DDD)"
            value={whatsappNumber}
            onChange={(e) => setWhatsappNumber(e.target.value)}
            autoComplete="tel"
          />
          <Input
            type="password"
            placeholder="Crie uma senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
          />
        </div>

        {error && <p className="text-sm text-error">{error}</p>}

        <Button type="submit" disabled={!canSubmit} loading={loading}>
          Continuar
        </Button>

        <div className="mt-auto flex flex-col items-center gap-1 pb-8 text-center">
          <p className="text-[13px] text-forest-500">Já possui conta?</p>
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="flex min-h-[32px] items-center text-sm font-semibold text-coral-900"
          >
            Entrar
          </button>
        </div>
      </form>
    </Screen>
  )
}
