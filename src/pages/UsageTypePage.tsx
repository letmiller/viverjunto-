import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Screen } from '../components/layout/Screen'
import { Header } from '../components/layout/Header'
import { AuraBackground } from '../components/ui/AuraBackground'
import { Button } from '../components/ui/Button'
import { accountSettings } from '../lib/api'
import { useSession } from '../store/session'
import usageSolo from '../assets/usage-solo.webp'
import usageCouple from '../assets/usage-couple.webp'
import usageFamily from '../assets/usage-family.webp'
import logoMark from '../assets/logo-mark.svg'

const RING_RADIUS = 52
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS

const OPTIONS = [
  { id: 'solo', title: 'Sozinho(a)', desc: 'Organize sua rotina e finanças pessoais.', img: usageSolo },
  { id: 'casal', title: 'Em casal', desc: 'Compartilhem tarefas, finanças e objetivos.', img: usageCouple },
  { id: 'familia', title: 'Família futuramente', desc: 'Prepare uma estrutura para crescer juntos.', img: usageFamily },
] as const

export function UsageTypePage() {
  const navigate = useNavigate()
  const user = useSession((s) => s.user)
  const setUser = useSession((s) => s.setUser)
  const [selected, setSelected] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [transitioning, setTransitioning] = useState(false)

  async function handleContinue() {
    if (!selected) return
    setSaving(true)
    setTransitioning(true)
    try {
      await Promise.all([accountSettings.setUsageType(selected), new Promise((r) => setTimeout(r, 900))])
      if (user) setUser({ ...user, usageType: selected })
      navigate('/convidar')
    } catch {
      setTransitioning(false)
    } finally {
      setSaving(false)
    }
  }

  if (transitioning) {
    return (
      <Screen className="bg-white">
        <AuraBackground auras={[{ color: 'teal', size: 260, top: -60, left: 160 }]} />
        <div className="relative z-10 flex min-h-svh flex-col items-center justify-center gap-6 px-6 text-center">
          <div className="relative flex size-28 items-center justify-center">
            <svg className="absolute inset-0 size-full animate-spin" style={{ animationDuration: '1.4s' }} viewBox="0 0 112 112">
              <circle cx="56" cy="56" r={RING_RADIUS} fill="none" stroke="#D1E7E5" strokeWidth="4" />
              <circle
                cx="56"
                cy="56"
                r={RING_RADIUS}
                fill="none"
                stroke="#6BA6A0"
                strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray={`${RING_CIRCUMFERENCE * 0.28} ${RING_CIRCUMFERENCE}`}
              />
            </svg>
            <span className="flex size-24 animate-pulse items-center justify-center rounded-full bg-teal-50 shadow-md">
              <img src={logoMark} alt="" className="h-9 w-auto" />
            </span>
          </div>
          <div>
            <h1 className="text-2xl font-bold leading-[1.35] text-forest-900">
              Personalizando
              <br />
              sua experiência...
            </h1>
            <p className="mt-2 text-sm text-forest-700">Preparando tudo para vocês. 💚</p>
          </div>
          <div className="flex gap-1.5">
            <span className="size-1.5 animate-bounce rounded-full bg-teal-500 [animation-delay:-0.3s]" />
            <span className="size-1.5 animate-bounce rounded-full bg-teal-300 [animation-delay:-0.15s]" />
            <span className="size-1.5 animate-bounce rounded-full bg-forest-100" />
          </div>
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

      <div className="relative z-10 flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto px-4 pt-6">
        <div>
          <h1 className="text-[26px] font-bold leading-[1.3] text-forest-900">Como você pretende usar o app?</h1>
          <p className="mt-3 text-sm text-forest-700">Isso ajuda a personalizar melhor sua experiência.</p>
        </div>

        <div className="flex flex-col gap-4">
          {OPTIONS.map((opt) => {
            const active = selected === opt.id
            return (
              <button
                key={opt.id}
                onClick={() => setSelected(opt.id)}
                className={`flex items-center overflow-hidden rounded-2xl border-[1.5px] bg-surface text-left shadow-xs transition-colors ${
                  active ? 'border-teal-500' : 'border-forest-100'
                }`}
              >
                <img src={opt.img} alt="" className="h-[104px] w-[116px] shrink-0 object-cover" />
                <div className="flex flex-1 items-center justify-between px-4 py-3">
                  <div>
                    <p className="text-[16px] font-semibold text-forest-900">{opt.title}</p>
                    <p className="mt-1 text-xs leading-[1.5] text-forest-700">{opt.desc}</p>
                  </div>
                  <span
                    className={`ml-2 flex size-[26px] shrink-0 items-center justify-center rounded-full border-2 text-xs ${
                      active ? 'border-teal-500 bg-teal-500 text-white' : 'border-forest-100 text-forest-100'
                    }`}
                  >
                    {active ? '✓' : ''}
                  </span>
                </div>
              </button>
            )
          })}
        </div>

        <div className="mt-auto flex flex-col items-center gap-3 pb-8 pt-2">
          <Button disabled={!selected} loading={saving} onClick={handleContinue}>
            Continuar
          </Button>
          {!selected && <p className="text-xs text-forest-500">Selecione uma opção para continuar</p>}
        </div>
      </div>
    </Screen>
  )
}
