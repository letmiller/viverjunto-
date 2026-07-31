import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Screen } from '../components/layout/Screen'
import { Header } from '../components/layout/Header'
import { AuraBackground } from '../components/ui/AuraBackground'
import { Button } from '../components/ui/Button'
import { goals as goalsApi } from '../lib/api'
import { useSession } from '../store/session'
import { GOAL_PRESETS, GOAL_ACCENT_CLASSES } from '../lib/goalPresets'

// Ordered so short labels land next to each other and pack 2-per-line on
// wrap; the one long label ("Reduzir ansiedade financeira") never fits
// beside anything and always takes its own row regardless of position.
const DISPLAY_ORDER = [
  'dividir-tarefas',
  'reserva',
  'organizacao-casa',
  'organizar-contas',
  'dividas',
  'compras',
  'guardar-dinheiro',
  'gastos',
  'sonhos',
  'rotina',
  'esquecimentos',
  'ansiedade-financeira',
]
const ORDERED_PRESETS = DISPLAY_ORDER.map((id) => GOAL_PRESETS.find((p) => p.id === id)!)

export function GoalsPage() {
  const navigate = useNavigate()
  const isSolo = useSession((s) => s.user?.usageType) === 'solo'
  const [selected, setSelected] = useState<string[]>([])
  const [saving, setSaving] = useState(false)

  function toggle(id: string) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  async function handleContinue() {
    if (selected.length === 0) return
    setSaving(true)
    try {
      const chosen = GOAL_PRESETS.filter((p) => selected.includes(p.id)).map((p) => ({ title: p.title, icon: p.emoji }))
      await goalsApi.create(chosen)
      navigate('/config-financeira')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Screen scroll className="bg-white">
      <AuraBackground
        auras={[
          { color: 'teal', size: 260, top: -70, left: 180 },
          { color: 'coral', size: 210, bottom: -60, left: -60 },
          { color: 'amber', size: 140, top: 360, right: -60 },
        ]}
      />
      <Header showBack />

      <div className="relative z-10 flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-4 pt-6">
        <div>
          <h1 className="text-[24px] font-bold leading-[1.28] text-forest-900">
            {isSolo ? (
              <>
                O que você gostaria
                <br />
                de melhorar?
              </>
            ) : (
              <>
                O que vocês gostariam
                <br />
                de melhorar juntos?
              </>
            )}
          </h1>
          <p className="mt-3 text-sm text-forest-700">
            Selecione os temas mais importantes para {isSolo ? 'sua rotina' : 'a rotina de vocês'}.
          </p>
        </div>

        <div
          className={`flex items-center justify-center rounded-full border px-4 py-2 text-center text-xs font-bold ${
            selected.length > 0 ? 'border-coral-ink text-coral-ink' : 'border-forest-100 text-forest-500'
          }`}
        >
          {selected.length === 0 ? 'Selecione ao menos um tema' : `${selected.length} tema${selected.length > 1 ? 's' : ''} selecionado${selected.length > 1 ? 's' : ''}`}
        </div>

        <div className="flex flex-wrap gap-2">
          {ORDERED_PRESETS.map((p) => {
            const active = selected.includes(p.id)
            return (
              <button
                key={p.id}
                onClick={() => toggle(p.id)}
                aria-pressed={active}
                className={`flex shrink-0 items-center gap-2 rounded-full border-[1.5px] bg-white py-2 pl-2 pr-4 text-left text-[13px] leading-tight transition-colors ${
                  active
                    ? GOAL_ACCENT_CLASSES[p.accent]
                    : 'border-forest-100 shadow-[0px_2px_3px_0px_rgba(46,58,55,0.04)]'
                } ${active ? 'font-bold text-forest-900' : 'font-normal text-forest-700'}`}
              >
                <img src={p.icon} alt="" className="size-8 shrink-0" />
                {p.title}
              </button>
            )
          })}
        </div>

        <div className="mt-auto flex flex-col items-center gap-1 pb-8 pt-2">
          <Button disabled={selected.length === 0} loading={saving} onClick={handleContinue}>
            Continuar
          </Button>
          <button onClick={() => navigate('/config-financeira')} className="pt-1 text-sm font-medium text-forest-500">
            Pular por agora
          </button>
        </div>
      </div>
    </Screen>
  )
}
