import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Screen } from '../components/layout/Screen'
import { Header } from '../components/layout/Header'
import { AuraBackground } from '../components/ui/AuraBackground'
import { Button } from '../components/ui/Button'
import { RadioCard, ChoiceTile, QuestionHeader } from '../components/ui/RadioCard'
import { QuestionProgress } from '../components/ui/QuestionProgress'
import { Stepper } from '../components/ui/Stepper'
import { household } from '../lib/api'
import { useSession } from '../store/session'
import iconMoradiaBadge from '../assets/routine/rt-moradia-badge.webp'
import iconMoradiaSim from '../assets/routine/rt-moradia-sim.webp'
import iconMoradiaParcialmente from '../assets/routine/rt-moradia-parcialmente.webp'
import iconMoradiaAindaNao from '../assets/routine/rt-moradia-ainda-nao.webp'
import iconPetsBadge from '../assets/routine/rt-pets-badge.webp'
import iconPetsNao from '../assets/routine/rt-pets-nao.webp'
import iconPetsCachorro from '../assets/routine/rt-pets-cachorro.webp'
import iconPetsGato from '../assets/routine/rt-pets-gato.webp'
import iconPetsOutros from '../assets/routine/rt-pets-outros.webp'
import iconFilhosBadge from '../assets/routine/rt-filhos-badge.webp'
import iconFilhosSim from '../assets/routine/rt-filhos-sim.webp'
import iconTrabalhoBadge from '../assets/routine/rt-trabalho-badge.webp'
import iconTrabalhoPresencial from '../assets/routine/rt-trabalho-presencial.webp'
import iconTrabalhoHibrido from '../assets/routine/rt-trabalho-hibrido.webp'
import iconEquilibrioBadge from '../assets/routine/rt-equilibrio-badge.webp'
import iconEquilibrioConcentradas from '../assets/routine/rt-equilibrio-concentradas.webp'
import iconEquilibrioDesorganizadas from '../assets/routine/rt-equilibrio-desorganizadas.webp'
import iconEquilibrioDificeis from '../assets/routine/rt-equilibrio-dificeis.webp'

const AGE_RANGES = [
  { id: 'bebe', label: 'Bebê (0–2)' },
  { id: 'crianca', label: 'Criança (3–10)' },
  { id: 'pre-adolescente', label: 'Pré-adolescente (11–13)' },
  { id: 'adolescente', label: 'Adolescente (14-17)' },
  { id: 'jovem-adulto', label: 'Jovem adulto (18-21)' },
]

export function RoutineConfigPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const editMode = new URLSearchParams(location.search).get('edit') === '1'
  const isSolo = useSession((s) => s.user?.usageType) === 'solo'

  const [moradia, setMoradia] = useState('')
  const [pets, setPets] = useState<string[]>([])
  const [petCount, setPetCount] = useState(1)
  const [filhos, setFilhos] = useState('')
  const [filhosCount, setFilhosCount] = useState(1)
  const [faixasEtarias, setFaixasEtarias] = useState<string[]>([])
  const [trabalho, setTrabalho] = useState('')
  const [tarefas, setTarefas] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!editMode) return
    household.getRoutineSettings().then(({ settings }) => {
      if (!settings) return
      if (settings.lives_together) setMoradia(settings.lives_together)
      if (settings.has_pets) setPets(settings.has_pets === 'none' ? [] : settings.has_pets.split(','))
      if (settings.pet_count) setPetCount(settings.pet_count)
      if (settings.has_children) setFilhos(settings.has_children)
      if (settings.children_count) setFilhosCount(settings.children_count)
      if (settings.age_ranges?.length) setFaixasEtarias(settings.age_ranges)
      if (settings.work_mode) setTrabalho(settings.work_mode)
      if (settings.task_balance) setTarefas(settings.task_balance)
    })
  }, [editMode])

  function togglePet(id: string) {
    setPets((prev) => (prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]))
  }

  function toggleFaixa(id: string) {
    setFaixasEtarias((prev) => (prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]))
  }

  const allAnswered = moradia && filhos && trabalho && tarefas
  const answeredCount = [moradia, filhos, trabalho, tarefas].filter(Boolean).length

  async function handleContinue() {
    setSaving(true)
    try {
      await household.putRoutineSettings({
        livesTogether: moradia,
        hasPets: pets.length === 0 ? 'none' : pets.join(','),
        petCount: pets.length > 0 ? petCount : undefined,
        hasChildren: filhos,
        childrenCount: filhos === 'Sim' ? filhosCount : undefined,
        ageRanges: filhos === 'Sim' ? faixasEtarias : undefined,
        workMode: trabalho,
        taskBalance: tarefas,
      })
      navigate(editMode ? '/perfil' : '/dashboard')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Screen className="bg-white">
      <AuraBackground
        auras={[
          { color: 'teal', size: 260, top: -80, left: 180 },
          { color: 'amber', size: 200, bottom: -80, left: -60 },
        ]}
      />
      <Header showBack />

      <div className="relative z-10 flex flex-col gap-6 px-4 pt-6">
        <h1 className="text-[22px] font-bold leading-[1.28] text-forest-900">
          {editMode ? (
            'Atualize a rotina da casa.'
          ) : isSolo ? (
            <>
              Agora vamos entender um
              <br />
              pouco da sua rotina.
            </>
          ) : (
            <>
              Agora vamos entender um
              <br />
              pouco da rotina de vocês.
            </>
          )}
        </h1>

        <QuestionProgress answered={answeredCount} total={4} />

        <div className="flex flex-col gap-3 border-b border-forest-100 pb-6">
          <QuestionHeader
            iconSrc={iconMoradiaBadge}
            category="Moradia"
            question={isSolo ? 'Você mora com mais alguém?' : 'Vocês moram juntos?'}
          />
          <div className="flex flex-col gap-3">
            <RadioCard
              iconSrc={iconMoradiaSim}
              label="Sim"
              active={moradia === 'Sim'}
              onClick={() => setMoradia('Sim')}
            />
            <RadioCard
              iconSrc={iconMoradiaParcialmente}
              label="Parcialmente"
              active={moradia === 'Parcialmente'}
              onClick={() => setMoradia('Parcialmente')}
            />
            <RadioCard
              iconSrc={iconMoradiaAindaNao}
              label="Ainda não"
              active={moradia === 'Ainda não'}
              onClick={() => setMoradia('Ainda não')}
            />
          </div>
        </div>

        <div className="flex flex-col gap-3 border-b border-forest-100 pb-6">
          <QuestionHeader
            iconSrc={iconPetsBadge}
            category="Pets"
            question={isSolo ? 'Você possui pets?' : 'Vocês possuem pets?'}
          />
          <div className="grid grid-cols-4 gap-2.5">
            <ChoiceTile iconSrc={iconPetsNao} label="Não" active={pets.length === 0} onClick={() => setPets([])} />
            <ChoiceTile
              iconSrc={iconPetsCachorro}
              label="Cachorro"
              active={pets.includes('dog')}
              onClick={() => togglePet('dog')}
            />
            <ChoiceTile
              iconSrc={iconPetsGato}
              label="Gato"
              active={pets.includes('cat')}
              onClick={() => togglePet('cat')}
            />
            <ChoiceTile
              iconSrc={iconPetsOutros}
              label="Outros"
              active={pets.includes('other')}
              onClick={() => togglePet('other')}
            />
          </div>
          {pets.length > 0 && (
            <div className="flex flex-col gap-2 rounded-2xl border border-forest-100 bg-forest-50 px-3.5 py-2.5">
              <p className="text-[11px] font-semibold text-forest-500">Quantos?</p>
              <Stepper value={petCount} onChange={setPetCount} />
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3 border-b border-forest-100 pb-6">
          <QuestionHeader
            iconSrc={iconFilhosBadge}
            category="Filhos"
            question={isSolo ? 'Você possui filhos?' : 'Vocês possuem filhos?'}
          />
          <div className="flex flex-col gap-3">
            <RadioCard iconSrc={iconPetsNao} label="Não" active={filhos === 'Não'} onClick={() => setFilhos('Não')} />
            <RadioCard
              iconSrc={iconFilhosSim}
              label="Sim"
              active={filhos === 'Sim'}
              accent="amber"
              onClick={() => setFilhos('Sim')}
            />
          </div>
          {filhos === 'Sim' && (
            <div className="flex flex-col gap-2.5 rounded-2xl border border-amber-500 bg-amber-50 px-3.5 py-2.5">
              <div className="flex flex-col gap-1">
                <p className="text-[11px] font-semibold text-amber-ink">Quantos filhos?</p>
                <Stepper value={filhosCount} onChange={setFilhosCount} />
              </div>
              <div className="flex flex-col gap-1.5">
                <p className="text-[11px] font-semibold text-amber-ink">Faixas etárias (selecione todas)</p>
                <div className="flex flex-wrap gap-2">
                  {AGE_RANGES.map((f) => {
                    const active = faixasEtarias.includes(f.id)
                    return (
                      <button
                        key={f.id}
                        onClick={() => toggleFaixa(f.id)}
                        aria-pressed={active}
                        className={`rounded-full border-[1.5px] px-2 py-1 text-xs whitespace-nowrap transition-colors ${
                          active
                            ? 'border-amber-700 bg-amber-500 font-semibold text-amber-ink'
                            : 'border-forest-100 bg-white text-forest-700'
                        }`}
                      >
                        {f.label}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3 border-b border-forest-100 pb-6">
          <QuestionHeader iconSrc={iconTrabalhoBadge} category="Trabalho" question="Como funciona a rotina de trabalho?" />
          <div className="grid grid-cols-4 gap-2.5">
            <ChoiceTile
              iconSrc={iconMoradiaBadge}
              label="Home office"
              active={trabalho === 'home'}
              onClick={() => setTrabalho('home')}
            />
            <ChoiceTile
              iconSrc={iconTrabalhoPresencial}
              label="Presencial"
              active={trabalho === 'presencial'}
              onClick={() => setTrabalho('presencial')}
            />
            <ChoiceTile
              iconSrc={iconTrabalhoHibrido}
              label="Híbrido"
              active={trabalho === 'hibrido'}
              onClick={() => setTrabalho('hibrido')}
            />
            <ChoiceTile
              iconSrc={iconMoradiaAindaNao}
              label="Escalas variáveis"
              active={trabalho === 'escalas'}
              onClick={() => setTrabalho('escalas')}
            />
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <QuestionHeader iconSrc={iconEquilibrioBadge} category="Equilíbrio" question="Hoje as tarefas da casa parecem…" />
          <div className="grid grid-cols-2 gap-2.5">
            <ChoiceTile
              iconSrc={iconEquilibrioBadge}
              label="Equilibradas"
              active={tarefas === 'equilibradas'}
              onClick={() => setTarefas('equilibradas')}
            />
            <ChoiceTile
              iconSrc={iconEquilibrioConcentradas}
              label="Concentradas em uma pessoa"
              active={tarefas === 'concentradas'}
              onClick={() => setTarefas('concentradas')}
            />
            <ChoiceTile
              iconSrc={iconEquilibrioDesorganizadas}
              label="Desorganizadas"
              active={tarefas === 'desorganizadas'}
              onClick={() => setTarefas('desorganizadas')}
            />
            <ChoiceTile
              iconSrc={iconEquilibrioDificeis}
              label="Difíceis de acompanhar"
              active={tarefas === 'dificeis'}
              onClick={() => setTarefas('dificeis')}
            />
          </div>
        </div>

        {tarefas === 'concentradas' && (
          <div className="flex items-center gap-3 rounded-3xl border border-amber-100 bg-amber-50 p-4">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-amber-100 text-lg">
              💛
            </span>
            <div>
              <p className="text-[13px] font-semibold text-forest-900">Notamos uma concentração de tarefas.</p>
              <p className="text-xs text-forest-700">
                Vamos te ajudar a redistribuir as responsabilidades de forma mais leve.
              </p>
            </div>
          </div>
        )}

        <div className="flex flex-col items-center gap-1 pb-8">
          <Button loading={saving} disabled={!allAnswered} onClick={handleContinue}>
            {editMode ? 'Salvar alterações' : 'Continuar'}
          </Button>
          {!editMode && (
            <button onClick={() => navigate('/dashboard')} className="pt-1 text-sm font-medium text-forest-500">
              Pular por agora
            </button>
          )}
        </div>
      </div>
    </Screen>
  )
}
