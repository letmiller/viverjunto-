import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Screen } from '../components/layout/Screen'
import { Header } from '../components/layout/Header'
import { AuraBackground } from '../components/ui/AuraBackground'
import { Input } from '../components/ui/Input'
import { Button } from '../components/ui/Button'
import { household, ApiError } from '../lib/api'
import { useSession } from '../store/session'

export function JoinHouseholdPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const user = useSession((s) => s.user)
  const setHousehold = useSession((s) => s.setHousehold)
  const [code, setCode] = useState(params.get('codigo') ?? '')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleJoin() {
    if (!code.trim()) return
    if (!user) {
      navigate(`/criar-conta?entrar=${encodeURIComponent(code.trim())}`)
      return
    }
    setLoading(true)
    setError('')
    try {
      const { household: h } = await household.join(code.trim())
      setHousehold(h)
      navigate('/dashboard')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Não foi possível entrar com esse código.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Screen scroll>
      <AuraBackground
        auras={[
          { color: 'teal', size: 240, top: -60, left: 200 },
          { color: 'coral', size: 180, bottom: -80, left: -60 },
        ]}
      />
      <Header showBack />

      <div className="relative z-10 flex min-h-0 flex-1 flex-col justify-center gap-6 overflow-y-auto px-6 py-10">
        <div>
          <h1 className="text-[24px] font-bold leading-[1.3] text-forest-900">Você foi convidado(a)! 🎉</h1>
          <p className="mt-2 text-sm leading-[1.55] text-forest-700">
            Digite ou confirme o código para entrar na casa compartilhada.
          </p>
        </div>

        <Input
          placeholder="Código de convite"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
        />

        {error && <p className="text-sm text-error">{error}</p>}

        <Button loading={loading} disabled={!code.trim()} onClick={handleJoin}>
          {user ? 'Entrar nesta casa' : 'Criar conta e entrar'}
        </Button>

        {!user && (
          <button onClick={() => navigate(`/login?entrar=${encodeURIComponent(code.trim())}`)} className="text-center text-sm font-medium text-teal-700">
            Já tenho conta, fazer login
          </button>
        )}
      </div>
    </Screen>
  )
}
