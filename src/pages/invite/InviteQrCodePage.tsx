import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import { Screen } from '../../components/layout/Screen'
import { Header } from '../../components/layout/Header'
import { AuraBackground } from '../../components/ui/AuraBackground'
import { Card } from '../../components/ui/Card'
import { useSession } from '../../store/session'
import { invites as invitesApi } from '../../lib/api'

export function InviteQrCodePage() {
  const navigate = useNavigate()
  const household = useSession((s) => s.household)
  const [copied, setCopied] = useState(false)

  const inviteLink = household
    ? `${window.location.origin}/entrar?codigo=${household.inviteCode}`
    : `${window.location.origin}/entrar`

  function copyLink() {
    navigator.clipboard.writeText(inviteLink).then(() => {
      setCopied(true)
      invitesApi.create({ method: 'link' }).catch(() => {})
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <Screen scroll className="bg-white">
      <AuraBackground
        auras={[
          { color: 'teal', size: 220, top: -60, right: -60 },
          { color: 'coral', size: 180, bottom: -60, left: -60 },
        ]}
      />
      <Header showBack />

      <div className="relative z-10 flex min-h-0 flex-1 flex-col items-center justify-center gap-6 overflow-y-auto px-6 py-6 text-center">
        <div>
          <h1 className="text-[22px] font-bold text-forest-900">Escaneie para conectar</h1>
          <p className="mt-2 text-[13px] text-forest-700">Peça para seu par escanear este código com a câmera.</p>
        </div>

        <Card className="flex flex-col items-center gap-4 p-6">
          <div className="rounded-2xl bg-surface p-3 shadow-sm">
            <QRCodeSVG value={inviteLink} size={200} fgColor="#2e3a37" bgColor="#ffffff" />
          </div>
          <p className="text-xs text-forest-500">
            Esse código não expira sozinho — dá pra gerar um novo a qualquer momento no seu perfil.
          </p>
        </Card>

        <div className="flex w-full items-center gap-3">
          <div className="h-px flex-1 bg-forest-100" />
          <span className="text-xs text-forest-500">ou envie o link</span>
          <div className="h-px flex-1 bg-forest-100" />
        </div>

        <div className="flex w-full items-center gap-2 rounded-2xl border-[1.5px] border-forest-100 bg-surface px-4 py-3">
          <span className="flex-1 truncate text-left text-sm text-forest-700">{inviteLink}</span>
          <button
            onClick={copyLink}
            className="shrink-0 rounded-full bg-teal-100 px-3 py-1.5 text-xs font-semibold text-teal-ink"
          >
            {copied ? 'Copiado!' : 'Copiar'}
          </button>
        </div>

        <button onClick={() => navigate('/objetivos')} className="pb-8 pt-2 text-sm font-medium text-forest-500">
          Pular por agora
        </button>
      </div>
    </Screen>
  )
}
