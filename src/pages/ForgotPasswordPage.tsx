import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Screen } from '../components/layout/Screen'
import { Header } from '../components/layout/Header'
import { AuraBackground } from '../components/ui/AuraBackground'
import { Input } from '../components/ui/Input'
import { Button } from '../components/ui/Button'
import { auth } from '../lib/api'

export function ForgotPasswordPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim() || loading) return
    setLoading(true)
    try {
      await auth.forgotPassword(email.trim())
      setSent(true)
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
        {sent ? (
          <>
            <div className="flex flex-col items-center gap-3 py-6 text-center">
              <span className="text-3xl">📬</span>
              <h1 className="text-[22px] font-bold text-forest-900">Verifique seu email</h1>
              <p className="text-sm leading-[1.55] text-forest-700">
                Se <strong>{email}</strong> tiver uma conta no Viver Junto, enviamos um link para redefinir a senha.
                O link expira em 30 minutos.
              </p>
            </div>
            <Button variant="secondary" onClick={() => navigate('/login')}>
              Voltar para o login
            </Button>
          </>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            <div>
              <h1 className="text-[24px] font-bold leading-[1.3] text-forest-900">Esqueceu sua senha?</h1>
              <p className="mt-2 text-sm leading-[1.55] text-forest-700">
                Digite seu email e enviaremos um link para você criar uma nova senha.
              </p>
            </div>
            <Input
              type="email"
              placeholder="Seu melhor email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
            <Button type="submit" disabled={!email.trim()} loading={loading}>
              Enviar link de redefinição
            </Button>
          </form>
        )}
      </div>
    </Screen>
  )
}
