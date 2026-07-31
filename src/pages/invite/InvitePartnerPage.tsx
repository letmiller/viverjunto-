import { useNavigate } from 'react-router-dom'
import { Screen } from '../../components/layout/Screen'
import { Header } from '../../components/layout/Header'
import { AuraBackground } from '../../components/ui/AuraBackground'
import { InviteMethodRow } from '../../components/ui/InviteMethodRow'
import { useSession } from '../../store/session'
import { invites as invitesApi } from '../../lib/api'

export function InvitePartnerPage() {
  const navigate = useNavigate()
  const user = useSession((s) => s.user)
  const household = useSession((s) => s.household)
  const initial = user?.name?.trim()?.[0]?.toUpperCase() ?? '?'

  function openWhatsApp() {
    const link = household ? `${window.location.origin}/entrar?codigo=${household.inviteCode}` : window.location.origin
    const text = encodeURIComponent(
      `Oi! Estou te convidando para organizarmos nossa vida juntos no Viver Junto 💚 Entra pelo link: ${link}`,
    )
    window.open(`https://wa.me/?text=${text}`, '_blank')
    invitesApi.create({ method: 'whatsapp' }).catch(() => {})
    navigate('/convidar/aguardando')
  }

  return (
    <Screen className="bg-white">
      <AuraBackground
        auras={[
          { color: 'coral', size: 290, top: -80, left: 160 },
          { color: 'teal', size: 220, bottom: -60, left: -60 },
          { color: 'amber', size: 140, top: 380, right: -60 },
        ]}
      />
      <Header showBack />

      <div className="relative z-10 px-4 pb-2">
        <div className="flex items-center gap-1.5">
          {Array.from({ length: 6 }).map((_, i) => (
            <span key={i} className={`h-[3px] flex-1 rounded-full ${i <= 5 ? 'bg-coral-700' : 'bg-forest-100'}`} />
          ))}
        </div>
        <p className="mt-2 text-center text-xs font-medium text-forest-500">Passo 6 de 6</p>
      </div>

      <div className="relative z-10 flex h-[150px] items-center justify-center gap-6">
        <div className="flex flex-col items-center gap-2">
          <div className="flex size-[76px] items-center justify-center rounded-full bg-coral-300 text-2xl font-bold text-coral-ink shadow-md">
            {initial}
          </div>
          <span className="text-xs font-semibold text-forest-900">{user?.name?.split(' ')[0] ?? 'Você'}</span>
        </div>
        <span className="text-2xl">💞</span>
        <div className="flex flex-col items-center gap-2">
          <div className="flex size-[76px] items-center justify-center rounded-full border-2 border-dashed border-forest-300 bg-forest-100 text-2xl font-bold text-forest-300">
            +
          </div>
          <span className="text-xs font-medium text-forest-500">Seu par</span>
        </div>
      </div>

      <div className="relative z-10 px-4 pt-2">
        <h1 className="text-[22px] font-bold leading-[1.3] text-forest-900">
          Convide quem compartilha
          <br />a vida com você.
        </h1>
        <p className="mt-2 text-[13px] leading-[1.5] text-forest-700">
          Organizem juntos tarefas, finanças e objetivos compartilhados.
        </p>

        <div className="mt-6 flex flex-col gap-4">
          <InviteMethodRow
            icon="💬"
            iconBg="bg-[#ecf7f3]"
            iconColor="text-[#44ab84]"
            title="WhatsApp"
            desc="Envie um convite rápido pelo WhatsApp."
            onClick={openWhatsApp}
          />
          <InviteMethodRow
            icon="🔗"
            iconBg="bg-teal-50"
            iconColor="text-teal-700"
            title="Link"
            desc="Compartilhe um link personalizado."
            onClick={() => navigate('/convidar/qrcode')}
          />
          <InviteMethodRow
            icon="⬛"
            iconBg="bg-forest-100"
            iconColor="text-forest-900"
            title="QR Code"
            desc="Escaneie para conectar rapidamente."
            onClick={() => navigate('/convidar/qrcode')}
          />
        </div>

        <button
          onClick={() => {
            localStorage.setItem('vj_invite_skipped', '1')
            navigate('/objetivos')
          }}
          className="mt-4 w-full rounded-xl bg-forest-100 py-3 text-[13px] font-medium text-forest-500"
        >
          Continuar sozinho(a) por agora
        </button>
        <p className="pb-8 pt-3 text-center text-xs text-forest-500">
          Você pode convidar depois, nas configurações.
        </p>
      </div>
    </Screen>
  )
}
