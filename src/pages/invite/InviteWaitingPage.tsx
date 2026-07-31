import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Screen } from '../../components/layout/Screen'
import { Header } from '../../components/layout/Header'
import { AuraBackground } from '../../components/ui/AuraBackground'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { invites as invitesApi, type Invite } from '../../lib/api'
import { toast, toastError } from '../../store/toast'

const METHOD_LABELS: Record<Invite['method'], string> = {
  whatsapp: 'WhatsApp',
  link: 'Link',
  qrcode: 'QR Code',
}

export function InviteWaitingPage() {
  const navigate = useNavigate()
  const [invites, setInvites] = useState<Invite[]>([])

  useEffect(() => {
    invitesApi
      .list()
      .then((r) => setInvites(r.invites))
      .catch(() => {})
  }, [])

  async function handleCancelInvite(id: string) {
    setInvites((prev) => prev.filter((i) => i.id !== id))
    try {
      await invitesApi.remove(id)
      toast('Convite cancelado.')
    } catch {
      toastError('Não foi possível cancelar o convite.')
      invitesApi.list().then((r) => setInvites(r.invites)).catch(() => {})
    }
  }

  return (
    <Screen scroll className="bg-white">
      <AuraBackground
        auras={[
          { color: 'amber', size: 220, top: -60, left: 40 },
          { color: 'teal', size: 180, bottom: -60, right: -40 },
        ]}
      />
      <Header showBack />

      <div className="relative z-10 flex min-h-0 flex-1 flex-col items-center justify-center gap-6 overflow-y-auto px-6 py-10 text-center">
        <div className="flex size-20 items-center justify-center rounded-full bg-amber-100 text-3xl">⏳</div>
        <div>
          <h1 className="text-[22px] font-bold text-forest-900">Convite enviado!</h1>
          <p className="mt-2 text-[14px] leading-[1.5] text-forest-700">
            Assim que seu par aceitar o convite, vocês estarão conectados no Viver Junto.
          </p>
        </div>

        <Card className="w-full text-left">
          <p className="text-sm leading-[1.5] text-forest-700">
            💡 Dica: peça para conferir a caixa de spam ou o WhatsApp, caso o convite demore a aparecer.
          </p>
        </Card>

        {invites.length > 0 && (
          <Card className="w-full text-left">
            <p className="text-xs font-semibold uppercase tracking-wide text-forest-500">Convites enviados</p>
            <div className="mt-3 flex flex-col gap-2">
              {invites.map((inv) => (
                <div key={inv.id} className="flex items-center justify-between gap-2 text-xs">
                  <span className="text-forest-700">
                    {METHOD_LABELS[inv.method]}
                    {inv.email ? ` · ${inv.email}` : ''}
                  </span>
                  <span className="flex shrink-0 items-center gap-1.5">
                    <span
                      className={`rounded-full px-2 py-0.5 font-semibold ${
                        inv.status === 'accepted' ? 'bg-teal-100 text-teal-ink' : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      {inv.status === 'accepted' ? 'Aceito' : 'Pendente'}
                    </span>
                    {inv.status === 'pending' && (
                      <button
                        onClick={() => handleCancelInvite(inv.id)}
                        aria-label="Cancelar convite"
                        className="text-forest-300 hover:text-error"
                      >
                        ✕
                      </button>
                    )}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        )}

        <Button variant="secondary" onClick={() => navigate('/convidar')}>
          Reenviar convite
        </Button>

        <div className="h-px w-full bg-forest-100" />

        <div>
          <Button variant="ghost" onClick={() => navigate('/objetivos')}>
            Continuar sozinho(a) por agora
          </Button>
          <p className="mt-3 pb-8 text-xs text-forest-500">Você pode conectar seu par quando quiser, depois.</p>
        </div>
      </div>
    </Screen>
  )
}
