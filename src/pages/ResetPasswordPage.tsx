import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Screen } from '../components/layout/Screen'
import { Header } from '../components/layout/Header'
import { AuraBackground } from '../components/ui/AuraBackground'
import { Input } from '../components/ui/Input'
import { Button } from '../components/ui/Button'
import { auth, ApiError } from '../lib/api'

export function ResetPasswordPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const token = params.get('token') ?? ''
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  const canSubmit = password.length >= 6 && password === confirm

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit || loading) return
    setLoading(true)
    setError('')
    try {
      await auth.resetPassword(token, password)
      setDone(true)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Não foi possível redefinir sua senha.')
    } finally {
      setLoading(false)
    }
  }

  if (!token) {
    return (
      <Screen scroll>
        <Header showBack />
        <div className="relative z-10 flex min-h-0 flex-1 flex-col items-center justify-center gap-4 overflow-y-auto px-6 py-16 text-center">
          <p className="text-sm text-forest-700">Link inválido. Solicite um novo link de redefinição.</p>
          <Button onClick={() => navigate('/esqueci-senha')}>Solicitar novo link</Button>
        </div>
      </Screen>
    )
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
        {done ? (
          <>
            <div className="flex flex-col items-center gap-3 py-6 text-center">
              <span className="text-3xl">✅</span>
              <h1 className="text-[22px] font-bold text-forest-900">Senha redefinida!</h1>
              <p className="text-sm text-forest-700">Já pode entrar com a sua nova senha.</p>
            </div>
            <Button onClick={() => navigate('/login')}>Ir para o login</Button>
          </>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            <div>
              <h1 className="text-[24px] font-bold leading-[1.3] text-forest-900">Crie uma nova senha</h1>
              <p className="mt-2 text-sm text-forest-700">Escolha uma senha com pelo menos 6 caracteres.</p>
            </div>
            <Input
              type="password"
              placeholder="Nova senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
            />
            <Input
              type="password"
              placeholder="Confirme a nova senha"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              autoComplete="new-password"
            />
            {confirm && password !== confirm && <p className="text-sm text-error">As senhas não coincidem.</p>}
            {error && <p className="text-sm text-error">{error}</p>}
            <Button type="submit" disabled={!canSubmit} loading={loading}>
              Redefinir senha
            </Button>
          </form>
        )}
      </div>
    </Screen>
  )
}
