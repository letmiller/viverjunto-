import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Screen } from '../components/layout/Screen'
import { Header } from '../components/layout/Header'
import { AuraBackground } from '../components/ui/AuraBackground'
import { Button } from '../components/ui/Button'
import { RadioCard, QuestionHeader, type QuestionAccent } from '../components/ui/RadioCard'
import { QuestionProgress } from '../components/ui/QuestionProgress'
import { household } from '../lib/api'
import { useSession } from '../store/session'
import iconOrganizacao from '../assets/config-financeira/cf-organizacao.webp'
import iconDividas from '../assets/config-financeira/cf-dividas.webp'
import iconReserva from '../assets/config-financeira/cf-reserva.webp'
import iconEmprestimos from '../assets/config-financeira/cf-emprestimos.webp'
import iconFinanciamentos from '../assets/config-financeira/cf-financiamentos.webp'
import iconContasAtrasadas from '../assets/config-financeira/cf-contas-atrasadas.webp'
import iconOutros from '../assets/config-financeira/cf-outros.webp'
import iconReduzirGastos from '../assets/config-financeira/cf-reduzir-gastos.webp'
import iconGuardarDinheiro from '../assets/config-financeira/cf-guardar-dinheiro.webp'
import iconOrganizarContas from '../assets/config-financeira/cf-organizar-contas.webp'
import iconPlanejarMetas from '../assets/config-financeira/cf-planejar-metas.webp'
import iconEquilibrarOrcamento from '../assets/config-financeira/cf-equilibrar-orcamento.webp'
import iconLeaf from '../assets/config-financeira/cf-leaf.webp'

function buildQuestions(isSolo: boolean) {
  return [
    {
      iconSrc: iconOrganizacao,
      category: 'Organização',
      accent: 'teal' as QuestionAccent,
      question: isSolo ? 'Você costuma organizar os gastos hoje?' : 'Vocês costumam organizar os gastos hoje?',
      options: ['Sim', 'Mais ou menos', 'Ainda não'],
    },
    {
      iconSrc: iconDividas,
      category: 'Dívidas',
      accent: 'coral' as QuestionAccent,
      question: isSolo ? 'Atualmente você possui dívidas?' : 'Atualmente vocês possuem dívidas?',
      options: ['Não', 'Sim, poucas', 'Sim, estamos tentando organizar'],
    },
    {
      iconSrc: iconReserva,
      category: 'Reserva',
      accent: 'coral' as QuestionAccent,
      question: isSolo ? 'Você possui reserva de emergência?' : 'Vocês possuem reserva de emergência?',
      options: ['Sim', 'Estamos começando', 'Ainda não'],
    },
  ]
}

const DEBT_TYPE_OPTIONS = [
  { id: 'cartao', label: 'Cartão', icon: iconDividas },
  { id: 'emprestimos', label: 'Empréstimos', icon: iconEmprestimos },
  { id: 'financiamentos', label: 'Financiamentos', icon: iconFinanciamentos },
  { id: 'contas-atrasadas', label: 'Contas atrasadas', icon: iconContasAtrasadas },
  { id: 'outros', label: 'Outros', icon: iconOutros },
]

const PRIORITY_OPTIONS = [
  { id: 'reduzir-gastos', label: 'Reduzir gastos', icon: iconReduzirGastos },
  { id: 'quitar-dividas', label: 'Quitar dívidas', icon: iconDividas },
  { id: 'guardar-dinheiro', label: 'Guardar dinheiro', icon: iconGuardarDinheiro },
  { id: 'organizar-contas', label: 'Organizar contas', icon: iconOrganizarContas },
  { id: 'planejar-metas', label: 'Planejar metas', icon: iconPlanejarMetas },
  { id: 'equilibrar-orcamento', label: 'Equilibrar orçamento', icon: iconEquilibrarOrcamento },
]

export function FinancialConfigPage() {
  const navigate = useNavigate()
  const isSolo = useSession((s) => s.user?.usageType) === 'solo'
  const QUESTIONS = buildQuestions(isSolo)
  const [answers, setAnswers] = useState<Record<number, string>>({})
  const [debtTypes, setDebtTypes] = useState<string[]>([])
  const [priority, setPriority] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const allAnswered = QUESTIONS.every((_, i) => answers[i])
  const hasDebts = answers[1] && answers[1] !== 'Não'

  function toggleDebtType(id: string) {
    setDebtTypes((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  async function handleContinue() {
    setSaving(true)
    try {
      await household.putFinancialSettings({
        organization: answers[0],
        debts: answers[1],
        emergencyFund: answers[2],
        debtTypes,
        priority: priority ?? undefined,
      })
      navigate('/config-rotina')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Screen className="bg-white">
      <AuraBackground
        auras={[
          { color: 'teal', size: 270, top: -80, left: 200 },
          { color: 'coral', size: 220, bottom: -60, left: -70 },
          { color: 'amber', size: 150, top: 520, right: -60 },
        ]}
      />
      <Header showBack />

      <div className="relative z-10 flex flex-col gap-6 px-4 pt-6">
        <div>
          <h1 className="text-[24px] font-bold leading-[1.28] text-forest-900">
            Vamos entender um pouco
            <br />
            da rotina financeira {isSolo ? 'sua' : 'de vocês'}.
          </h1>
          <p className="mt-2 text-sm leading-[1.5] text-forest-700">
            Isso ajuda o app a criar uma experiência mais útil e personalizada.
          </p>
        </div>

        <QuestionProgress answered={Object.keys(answers).length} total={QUESTIONS.length} />

        {QUESTIONS.map((q, i) => (
          <div key={q.question} className="flex flex-col gap-3 border-b border-forest-100 pb-6 last:border-none">
            <QuestionHeader iconSrc={q.iconSrc} category={q.category} question={q.question} accent={q.accent} />
            <div className="flex flex-col gap-3">
              {q.options.map((opt) => (
                <RadioCard
                  key={opt}
                  label={opt}
                  active={answers[i] === opt}
                  accent={q.accent}
                  onClick={() => setAnswers((prev) => ({ ...prev, [i]: opt }))}
                />
              ))}
            </div>

            {i === 1 && hasDebts && (
              <div className="flex flex-col gap-2 rounded-2xl border-2 border-coral-300 bg-coral-100 p-4">
                <p className="text-sm font-semibold text-coral-ink">Quais tipos?</p>
                <div className="flex flex-wrap gap-2">
                  {DEBT_TYPE_OPTIONS.map((opt) => {
                    const active = debtTypes.includes(opt.id)
                    return (
                      <button
                        key={opt.id}
                        onClick={() => toggleDebtType(opt.id)}
                        aria-pressed={active}
                        className={`flex min-w-[150px] flex-1 items-center gap-2 rounded-xl border-[1.5px] bg-surface px-2 py-1 text-left transition-colors ${
                          active ? 'border-coral-700 shadow-[0px_2px_4px_0px_rgba(255,138,122,0.1)]' : 'border-forest-100'
                        }`}
                      >
                        <img src={opt.icon} alt="" className="size-8 shrink-0" />
                        <span
                          className={`text-xs leading-tight ${active ? 'font-semibold text-forest-900' : 'text-forest-500'}`}
                        >
                          {opt.label}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        ))}

        <div className="flex flex-col gap-4">
          <div>
            <p className="text-xs font-semibold text-forest-500">Prioridade</p>
            <p className="text-[16px] font-semibold text-forest-900">O que seria mais importante hoje?</p>
          </div>
          <div className="grid grid-cols-3 gap-3.5">
            {PRIORITY_OPTIONS.map((opt) => {
              const active = priority === opt.id
              return (
                <button
                  key={opt.id}
                  onClick={() => setPriority(active ? null : opt.id)}
                  aria-pressed={active}
                  className={`flex flex-col items-center justify-between gap-1 rounded-2xl border-[1.5px] py-2 text-center transition-colors ${
                    active
                      ? 'border-2 border-coral-700 bg-coral-100 shadow-[0px_2px_5px_0px_rgba(255,138,122,0.12)]'
                      : 'border-forest-100 bg-surface'
                  }`}
                >
                  <img src={opt.icon} alt="" className="size-8" />
                  <span
                    className={`text-xs leading-tight ${active ? 'font-semibold text-forest-900' : 'text-forest-700'}`}
                  >
                    {opt.label}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        <div className="relative flex items-center gap-3 rounded-3xl border border-teal-100 bg-teal-50 p-4">
          <span className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-teal-100">
            <img src={iconLeaf} alt="" className="size-full object-cover" />
          </span>
          <div>
            <p className="text-[13px] font-semibold text-forest-900">Tudo bem começar aos poucos.</p>
            <p className="text-xs text-forest-700">O importante é criar clareza{isSolo ? '' : ' juntos'}.</p>
          </div>
        </div>

        <div className="flex flex-col items-center gap-1 pb-8">
          <Button loading={saving} disabled={!allAnswered} onClick={handleContinue}>
            Continuar
          </Button>
          <button onClick={() => navigate('/config-rotina')} className="pt-1 text-sm font-medium text-forest-500">
            Pular por agora
          </button>
        </div>
      </div>
    </Screen>
  )
}
