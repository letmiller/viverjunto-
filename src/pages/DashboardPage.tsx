import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Screen } from '../components/layout/Screen'
import { AuraBackground } from '../components/ui/AuraBackground'
import { Card } from '../components/ui/Card'
import { Fab } from '../components/ui/Fab'
import { Modal } from '../components/ui/Modal'
import { BottomNav } from '../components/layout/BottomNav'
import { MoodCalendarModal } from '../components/home/MoodCalendarModal'
import heartIcon from '../assets/dashboard/heart.svg'
import chevronIcon from '../assets/dashboard/chevron.svg'
import tileContas from '../assets/dashboard/tile-contas.png'
import tileTarefas from '../assets/dashboard/tile-tarefas.png'
import tileMetas from '../assets/dashboard/tile-metas.png'
import categoryCasa from '../assets/dashboard/category-casa.png'
import categoryFinancas from '../assets/dashboard/category-financas.png'
import categoryTarefas from '../assets/dashboard/category-tarefas.png'
import { formatBRL } from '../lib/currency'
import { useSession } from '../store/session'
import { useActivityStore } from '../store/activity'
import {
  tasks as tasksApi,
  shopping,
  mood as moodApi,
  household,
  transactions,
  activity as activityApi,
  bills as billsApi,
  goals as goalsApi,
  accounts as accountsApi,
  type Task,
  type ShoppingItem,
  type Checkin,
  type Member,
  type ActivityEntry,
  type Transaction,
  type Bill,
  type Goal,
  type FinancialAccount,
} from '../lib/api'
import { localDateString, timeAgo } from '../lib/date'
import { toast, toastError } from '../store/toast'

const LOAD_COLORS = ['bg-coral-700', 'bg-teal-500', 'bg-amber-700', 'bg-forest-500']
const EQUILIBRIO_TONES = [
  { card: 'bg-coral-50', bar: 'bg-coral-500', text: 'text-coral-700' },
  { card: 'bg-teal-50', bar: 'bg-teal-500', text: 'text-teal-ink' },
  { card: 'bg-amber-50', bar: 'bg-amber-700', text: 'text-amber-ink' },
  { card: 'bg-forest-50', bar: 'bg-forest-500', text: 'text-forest-700' },
]

const MOODS = [
  { value: 'calma', icon: '😌', label: 'Calma' },
  { value: 'equilibrado', icon: '⚖️', label: 'Equilibrado' },
  { value: 'corrido', icon: '🏃', label: 'Corrido' },
  { value: 'sobrecarregado', icon: '😮‍💨', label: 'Sobrecarregado' },
]
const WEEKDAY_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

const REACTION_EMOJIS = ['👍', '❤️', '🎉']

const ADD_OPTIONS = [
  { key: 'transaction', icon: '💰', label: 'Lançamento', to: '/financas' },
  { key: 'task', icon: '✅', label: 'Tarefa', to: '/organizacao' },
  { key: 'shopping', icon: '🛒', label: 'Item de compra', to: '/lista-compras' },
] as const

function todayLabel() {
  const raw = new Date().toLocaleDateString('pt-BR', { weekday: 'long' })
  return raw.charAt(0).toUpperCase() + raw.slice(1)
}

function todayLongLabel() {
  const raw = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })
  return raw.charAt(0).toUpperCase() + raw.slice(1)
}

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Bom dia'
  if (h < 18) return 'Boa tarde'
  return 'Boa noite'
}

function last7Days() {
  const days: { date: string; label: string }[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    days.push({ date: localDateString(d), label: WEEKDAY_LABELS[d.getDay()] })
  }
  return days
}

export function DashboardPage() {
  const navigate = useNavigate()
  const user = useSession((s) => s.user)
  const firstName = user?.name?.split(' ')[0] ?? 'Você'

  const [taskList, setTaskList] = useState<Task[]>([])
  const [items, setItems] = useState<ShoppingItem[]>([])
  const [checkins, setCheckins] = useState<Checkin[]>([])
  const [members, setMembers] = useState<Member[]>([])
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([])
  const [bills, setBills] = useState<Bill[]>([])
  const [goalsList, setGoalsList] = useState<Goal[]>([])
  const [accountsList, setAccountsList] = useState<FinancialAccount[]>([])
  const [feed, setFeed] = useState<ActivityEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddChooser, setShowAddChooser] = useState(false)
  const [showMoodCalendar, setShowMoodCalendar] = useState(false)
  const [showMoodPicker, setShowMoodPicker] = useState(false)
  const [showEquilibrioDetail, setShowEquilibrioDetail] = useState(false)
  const [showAllActivity, setShowAllActivity] = useState(false)
  const markActivitySeen = useActivityStore((s) => s.markSeen)

  async function setMyMood(value: string) {
    try {
      await moodApi.set(value, localDateString())
      const c = await moodApi.today(localDateString())
      setCheckins(c.checkins)
      loadFeed()
      toast('Humor atualizado.')
    } catch {
      toastError('Não foi possível salvar seu humor agora.')
    }
  }

  function loadFeed() {
    activityApi
      .list()
      .then((r) => {
        setFeed(r.activity)
        if (r.activity[0]) markActivitySeen(r.activity[0].created_at)
      })
      .catch(() => {})
  }

  useEffect(() => {
    Promise.allSettled([
      tasksApi.list().then((r) => setTaskList(r.tasks)),
      shopping.list().then((r) => setItems(r.items)),
      moodApi.today(localDateString()).then((r) => {
        setCheckins(r.checkins)
        const hasMoodToday = r.checkins.some((c) => c.user_id === user?.id)
        const promptedToday = localStorage.getItem('vj_mood_prompt_date') === localDateString()
        if (!hasMoodToday && !promptedToday) {
          localStorage.setItem('vj_mood_prompt_date', localDateString())
          setShowMoodPicker(true)
        }
      }),
      household.members().then((r) => setMembers(r.members)),
      transactions.list().then((r) => setRecentTransactions(r.transactions)),
      billsApi.list().then((r) => setBills(r.bills)),
      goalsApi.list().then((r) => setGoalsList(r.goals)),
      accountsApi.list().then((r) => setAccountsList(r.accounts)),
      activityApi.list().then((r) => {
        setFeed(r.activity)
        if (r.activity[0]) markActivitySeen(r.activity[0].created_at)
      }),
    ]).finally(() => setLoading(false))
  }, [])

  async function handleReact(activityId: string, emoji: string) {
    try {
      await activityApi.react(activityId, emoji)
      loadFeed()
    } catch {
      toastError('Não foi possível reagir agora.')
    }
  }

  const doneTasks = taskList.filter((t) => t.status === 'done').length
  const myMoodToday = checkins.find((c) => c.user_id === user?.id)?.mood
  const pendingItems = items.filter((i) => !i.checked)
  const estimatedTotal = pendingItems.reduce((sum, i) => sum + (i.price ?? 0), 0)

  const assignedTasks = taskList.filter((t) => t.assigned_to)
  const loadByMember = members
    .map((m) => ({ ...m, count: assignedTasks.filter((t) => t.assigned_to === m.id).length }))
    .filter((m) => m.count > 0)
  const loadTotal = loadByMember.reduce((s, m) => s + m.count, 0)

  // Time actually spent, not just task count — so someone who knocked out one
  // long chore doesn't read as "less productive" than someone who ticked off
  // five quick ones.
  const weekStart = last7Days()[0].date
  const timeByMember = members
    .map((m) => ({
      ...m,
      minutes: taskList
        .filter((t) => t.completed_by === m.id && t.time_spent_minutes && (t.completed_at?.slice(0, 10) ?? '') >= weekStart)
        .reduce((s, t) => s + (t.time_spent_minutes ?? 0), 0),
    }))
    .filter((m) => m.minutes > 0)
  const timeTotal = timeByMember.reduce((s, m) => s + m.minutes, 0)

  function formatMinutes(mins: number): string {
    const h = Math.floor(mins / 60)
    const m = mins % 60
    if (h === 0) return `${m}min`
    return m === 0 ? `${h}h` : `${h}h${m}min`
  }

  const today = localDateString()
  const billsDueSoon = bills.filter((b) => !b.paid && b.due_date <= today).length
  const overdueTasks = taskList.filter((t) => t.status === 'pending' && t.due_date && t.due_date <= today).length

  const last30Start = (() => {
    const d = new Date()
    d.setDate(d.getDate() - 29)
    return localDateString(d)
  })()
  const periodTransactions = recentTransactions.filter((t) => t.date >= last30Start)
  const perPersonSaidas = members.map((m) => ({
    id: m.id,
    name: m.name,
    saidas: periodTransactions.filter((t) => t.created_by === m.id && t.type === 'expense').reduce((s, t) => s + t.amount, 0),
  }))
  const totalSaidas30d = perPersonSaidas.reduce((s, p) => s + p.saidas, 0)

  // Mini-stat row: Contas / Tarefas / Metas at a glance.
  const unpaidBillsSorted = bills.filter((b) => !b.paid).sort((a, b) => a.due_date.localeCompare(b.due_date))
  const pendingTasksCount = taskList.filter((t) => t.status === 'pending').length
  const goalsWithTarget = goalsList.filter((g) => g.target_amount)
  const goalsAvgPct =
    goalsWithTarget.length > 0
      ? Math.round(
          goalsWithTarget.reduce((s, g) => s + (g.saved_amount / (g.target_amount ?? 1)) * 100, 0) / goalsWithTarget.length,
        )
      : null

  // "Casa hoje" timeline — bills and tasks merged into one chronological
  // agenda instead of two separate lists, since that's how the day actually
  // plays out.
  interface TimelineEntry {
    id: string
    icon: string
    title: string
    sub: string
    tag: string
    tagTone: 'error' | 'teal' | 'amber' | 'neutral'
    date: string
  }
  const timelineEntries: TimelineEntry[] = [
    ...unpaidBillsSorted.slice(0, 5).map((b) => ({
      id: `bill-${b.id}`,
      icon: '💳',
      title: b.title,
      sub: `R$ ${formatBRL(b.amount)} · ${b.due_date === today ? 'Vence hoje' : b.due_date < today ? 'Atrasada' : `Vence dia ${new Date(b.due_date + 'T00:00:00').getDate()}`}`,
      tag: 'Financeiro',
      tagTone: (b.due_date <= today ? 'error' : 'neutral') as TimelineEntry['tagTone'],
      date: b.due_date,
    })),
    ...taskList
      .filter((t) => t.status === 'pending')
      .slice(0, 5)
      .map((t) => ({
        id: `task-${t.id}`,
        icon: t.icon ?? '✅',
        title: t.title,
        sub: t.assignee_name ? t.assignee_name.split(' ')[0] : 'Sem responsável',
        tag: 'Tarefa',
        tagTone: (t.due_date && t.due_date <= today ? 'error' : 'amber') as TimelineEntry['tagTone'],
        date: t.due_date ?? '9999-99-99',
      })),
  ]
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 6)

  // Equilíbrio da casa — works for any number of contributors, not just
  // couples; each person's share of finances/tasks/compras is computed
  // independently of how many other people are in the household.
  const isCouple = members.length >= 2
  const shoppingWithAdder = items.filter((i) => i.added_by)
  const equilibrio = isCouple
    ? members.map((m) => {
        const financePct = totalSaidas30d > 0 ? Math.round(((perPersonSaidas.find((p) => p.id === m.id)?.saidas ?? 0) / totalSaidas30d) * 100) : 50
        const taskCount = assignedTasks.filter((t) => t.assigned_to === m.id).length
        const taskPct = loadTotal > 0 ? Math.round((taskCount / loadTotal) * 100) : 50
        const shopCount = shoppingWithAdder.filter((i) => i.added_by === m.id).length
        const shopPct = shoppingWithAdder.length > 0 ? Math.round((shopCount / shoppingWithAdder.length) * 100) : 50
        return { ...m, financePct, taskPct, shopPct }
      })
    : []
  const myEquilibrio = equilibrio.find((m) => m.id === user?.id)
  const mentalLoadPct = myEquilibrio?.taskPct ?? equilibrio[0]?.taskPct ?? 0
  const totalBalance = accountsList.reduce((s, a) => s + a.balance, 0)
  // The header's two-color split bar only makes visual sense for exactly two
  // people — 3+ members already get the tiled breakdown in the card below.
  const twoPersonEquilibrio = equilibrio.length === 2 ? equilibrio : null

  // "Healthy" = no category is lopsided by more than 20 points from an even
  // split across however many people share the household.
  const evenSharePct = members.length > 0 ? 100 / members.length : 50
  const maxDeviation = Math.max(
    0,
    ...equilibrio.flatMap((m) => [
      Math.abs(m.financePct - evenSharePct),
      Math.abs(m.taskPct - evenSharePct),
      Math.abs(m.shopPct - evenSharePct),
    ]),
  )
  const balanceHealthy = equilibrio.length === 0 || maxDeviation <= 20

  if (loading) {
    return (
      <Screen scroll className="bg-app-bg">
        <div className="flex min-h-0 flex-1 items-center justify-center">
          <span className="size-6 animate-spin rounded-full border-2 border-forest-100 border-t-teal-500" />
        </div>
      </Screen>
    )
  }

  return (
    <Screen scroll className="bg-app-bg">
      <AuraBackground
        auras={[
          { color: 'coral', size: 300, top: -120, left: 200 },
          { color: 'teal', size: 260, bottom: 40, left: -80 },
          { color: 'amber', size: 180, top: 500, right: -70 },
        ]}
      />

      <div className="relative z-10 bg-ink px-4 pb-6 pt-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-ink-muted">{todayLongLabel()}</p>
            <p className="text-lg font-bold text-white">
              {greeting()}, {firstName}
            </p>
          </div>
          <button
            onClick={() => navigate('/perfil')}
            aria-label="Ir para o perfil"
            className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white text-sm font-bold text-forest-900 shadow-xs"
          >
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt="" className="size-full object-cover" />
            ) : (
              firstName[0]?.toUpperCase()
            )}
          </button>
        </div>

        <button onClick={() => navigate('/financas')} className="mt-6 flex w-full flex-col items-center gap-1 text-center">
          <span className="text-sm font-medium text-teal-100">Conta compartilhada</span>
          <span className="text-[28px] font-bold leading-tight text-white">R$ {formatBRL(totalBalance)}</span>
        </button>

        {twoPersonEquilibrio && (
          <div className="mt-4 flex flex-col gap-1.5">
            <div className="flex h-[5px] overflow-hidden rounded-full bg-teal-100">
              <div className="h-full bg-coral-700" style={{ width: `${twoPersonEquilibrio[0].financePct}%` }} />
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-coral-300">
                {twoPersonEquilibrio[0].name.split(' ')[0]} {twoPersonEquilibrio[0].financePct}%
              </span>
              <span className="text-teal-100">
                {twoPersonEquilibrio[1].name.split(' ')[0]} {twoPersonEquilibrio[1].financePct}%
              </span>
            </div>
          </div>
        )}
      </div>

      {/* No overlap with the header — a fixed negative margin here previously
          assumed a specific header height and ended up covering real content
          (the per-person split bar) whenever the header rendered shorter.
          The header's own pb-6 (24px) is the only spacing needed. */}
      <div className="relative z-10 flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 pb-28">
        <Card>
          <p className="text-sm font-semibold text-forest-900">Visão geral</p>
          <p className="text-xs text-forest-500">O que precisa da sua atenção</p>
          <div className="mt-3 flex gap-2">
            <button
              onClick={() => navigate('/financas')}
              className="flex flex-1 flex-col gap-2 rounded-sm border-[1.5px] border-amber-500 bg-amber-100 p-2 text-left shadow-xs"
            >
              <div className="flex items-center justify-between">
                <span className="flex size-7 shrink-0 items-center justify-center overflow-hidden rounded-full bg-amber-300">
                  <img src={tileContas} alt="" className="size-full object-cover" />
                </span>
                <img src={chevronIcon} alt="" className="size-5 shrink-0" />
              </div>
              <span className="text-sm font-semibold text-amber-ink">Contas</span>
              <span className="text-sm font-bold text-forest-900/80">{billsDueSoon} em breve</span>
            </button>
            <button
              onClick={() => navigate('/organizacao')}
              className="flex flex-1 flex-col gap-2 rounded-sm border-[1.5px] border-teal-100 bg-teal-50 p-2 text-left shadow-xs"
            >
              <div className="flex items-center justify-between">
                <span className="flex size-7 shrink-0 items-center justify-center overflow-hidden rounded-full bg-teal-300">
                  <img src={tileTarefas} alt="" className="size-full object-cover" />
                </span>
                <img src={chevronIcon} alt="" className="size-5 shrink-0" />
              </div>
              <span className="text-sm font-semibold text-teal-700">Tarefas</span>
              <span className="text-sm font-bold text-forest-900/80">
                {overdueTasks > 0 ? `${overdueTasks} urgentes` : `${pendingTasksCount} pendentes`}
              </span>
            </button>
            <button
              onClick={() => navigate('/financas')}
              className="flex flex-1 flex-col gap-2 rounded-sm border-[1.5px] border-coral-300 bg-coral-100 p-2 text-left shadow-xs"
            >
              <div className="flex items-center justify-between">
                <span className="flex size-7 shrink-0 items-center justify-center overflow-hidden rounded-full bg-coral-100">
                  <img src={tileMetas} alt="" className="size-full object-cover" />
                </span>
                <img src={chevronIcon} alt="" className="size-5 shrink-0" />
              </div>
              <span className="text-sm font-semibold text-coral-ink">Metas</span>
              <span className="text-sm font-bold text-forest-900/80">{goalsAvgPct !== null ? `${goalsAvgPct}%` : '—'}</span>
            </button>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-forest-900">Hoje</p>
              <p className="text-xs text-forest-500">{todayLabel()}</p>
            </div>
            <button
              onClick={() => setShowMoodCalendar(true)}
              aria-label="Ver calendário"
              className="flex size-9 shrink-0 items-center justify-center rounded-full bg-teal-50 text-base text-teal-ink"
            >
              📅
            </button>
          </div>
          {taskList.length > 0 && (
            <>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-forest-100">
                <div
                  className="h-full rounded-full bg-teal-500 transition-all"
                  style={{ width: `${(doneTasks / taskList.length) * 100}%` }}
                />
              </div>
              <p className="mt-1 text-right text-xs text-forest-500">
                ✓ {doneTasks} de {taskList.length}
              </p>
            </>
          )}

          {feed.length > 0 && (
            <div className="mt-4 border-t border-forest-50 pt-3">
              <p className="text-xs font-semibold text-forest-500">Atividades realizadas</p>

              <div className="mt-2 flex flex-col gap-3">
                  {feed.slice(0, showAllActivity ? 8 : 3).map((entry) => {
                    const myReaction = entry.reactions.find((r) => r.user_id === user?.id)
                    return (
                      <div key={entry.id} className="flex gap-2.5 border-b border-forest-50 pb-3 last:border-none last:pb-0">
                        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-forest-50 text-sm">
                          {entry.icon ?? '💬'}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs text-forest-700">
                            <span className="font-semibold text-forest-900">{entry.user_name.split(' ')[0]}</span>{' '}
                            {entry.description}
                          </p>
                          <div className="mt-1 flex items-center gap-2">
                            <span className="text-xs text-forest-400">{timeAgo(entry.created_at)}</span>
                            {REACTION_EMOJIS.map((emoji) => {
                              const count = entry.reactions.filter((r) => r.emoji === emoji).length
                              return (
                                <button
                                  key={emoji}
                                  onClick={() => handleReact(entry.id, emoji)}
                                  aria-label={`Reagir com ${emoji}`}
                                  aria-pressed={myReaction?.emoji === emoji}
                                  className={`flex min-h-[32px] items-center gap-0.5 rounded-full px-1.5 text-xs ${
                                    myReaction?.emoji === emoji ? 'bg-teal-100' : ''
                                  }`}
                                >
                                  {emoji} {count > 0 && count}
                                </button>
                              )
                            })}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                {feed.length > 3 && (
                  <button
                    onClick={() => setShowAllActivity((v) => !v)}
                    className="flex min-h-[32px] w-full items-center justify-center text-xs font-medium text-teal-700"
                  >
                    {showAllActivity ? 'Ver menos' : 'Ver mais'}
                  </button>
                )}
              </div>
            </div>
          )}
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-forest-900">Atividade da casa</p>
            <button
              onClick={() => navigate('/organizacao')}
              className="flex min-h-[32px] items-center text-xs font-medium text-teal-700"
            >
              Ver tudo →
            </button>
          </div>
          {timelineEntries.length === 0 ? (
            <p className="mt-2 text-xs text-forest-500">Nada pendente por aqui. 🎉</p>
          ) : (
            <div className="mt-3 flex flex-col">
              {timelineEntries.map((entry, i) => (
                <div
                  key={entry.id}
                  className={`flex items-center justify-between gap-3 py-3 ${
                    i < timelineEntries.length - 1 ? 'border-b border-forest-100' : ''
                  } ${i === 0 ? 'pt-0' : ''}`}
                >
                  <div className="flex min-w-0 flex-1 items-center gap-2">
                    <span
                      className={`flex size-11 shrink-0 items-center justify-center rounded-full text-lg ${
                        entry.tagTone === 'error'
                          ? 'bg-coral-100'
                          : entry.tagTone === 'teal'
                            ? 'bg-teal-100'
                            : entry.tagTone === 'amber'
                              ? 'bg-amber-100'
                              : 'bg-forest-100'
                      }`}
                    >
                      {entry.icon}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-base font-semibold text-forest-900">{entry.title}</p>
                      <p className="truncate text-xs text-forest-500">{entry.sub}</p>
                    </div>
                  </div>
                  {entry.tagTone === 'error' ? (
                    <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-coral-100 px-3 py-1 text-xs font-semibold text-error">
                      <span className="size-1.5 shrink-0 rounded-full bg-error" /> Urgente
                    </span>
                  ) : (
                    <span
                      className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${
                        entry.tagTone === 'teal'
                          ? 'bg-teal-100 text-teal-ink'
                          : entry.tagTone === 'amber'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-forest-100 text-forest-500'
                      }`}
                    >
                      {entry.tag}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>

        {isCouple && (
          <Card>
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-forest-900">Equilíbrio da casa</p>
              <span className="text-xs font-medium text-teal-700">Ver detalhes ›</span>
            </div>
            <p className="mt-1 text-xs text-forest-500">Como as responsabilidades estão distribuídas</p>
            {twoPersonEquilibrio ? (
              <button
                onClick={() => setShowEquilibrioDetail(true)}
                className="mt-3 flex w-full items-center justify-between gap-2 text-left"
              >
                <div className="flex flex-col items-center text-center">
                  <span className="text-[28px] font-bold text-coral-ink">{twoPersonEquilibrio[0].financePct}%</span>
                  <span className="text-xs font-semibold text-forest-700">{twoPersonEquilibrio[0].name.split(' ')[0]}</span>
                </div>
                <div className="flex flex-1 items-center justify-center gap-2">
                  <span className="h-px flex-1 border-t border-dashed border-coral-300" />
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-surface shadow-sm">
                    <img src={heartIcon} alt="" className="h-6 w-8" />
                  </span>
                  <span className="h-px flex-1 border-t border-dashed border-teal-300" />
                </div>
                <div className="flex flex-col items-center text-center">
                  <span className="text-[28px] font-bold text-teal-700">{twoPersonEquilibrio[1].financePct}%</span>
                  <span className="text-xs font-semibold text-forest-700">{twoPersonEquilibrio[1].name.split(' ')[0]}</span>
                </div>
              </button>
            ) : (
              <button
                onClick={() => setShowEquilibrioDetail(true)}
                className="mt-3 flex w-full flex-wrap items-stretch gap-2 text-left"
              >
                {equilibrio.map((m, i) => {
                  const tone = EQUILIBRIO_TONES[i % EQUILIBRIO_TONES.length]
                  return (
                    <div
                      key={m.id}
                      className={`flex min-w-[45%] flex-1 flex-col gap-2 rounded-lg p-2 ${tone.card}`}
                    >
                      <div className="text-center">
                        <p className={`text-2xl font-bold ${tone.text}`}>{m.financePct}%</p>
                        <p className="text-xs font-semibold text-ink">{m.name.split(' ')[0]}</p>
                      </div>
                      <div className="flex flex-col gap-1.5">
                        {[
                          { label: 'Finanças', pct: m.financePct },
                          { label: 'Tarefas', pct: m.taskPct },
                          { label: 'Compras', pct: m.shopPct },
                        ].map((row) => (
                          <div key={row.label} className="flex flex-col gap-0.5">
                            <div className="h-1 overflow-hidden rounded-full bg-forest-100">
                              <div className={`h-full rounded-full ${tone.bar}`} style={{ width: `${row.pct}%` }} />
                            </div>
                            <span className="text-xs text-forest-500">{row.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </button>
            )}
            <div className="mt-3 flex items-center gap-2">
              <span className="shrink-0 text-xs text-forest-500">Carga mental da semana</span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-forest-100">
                <div className="h-full rounded-full bg-teal-500" style={{ width: `${mentalLoadPct}%` }} />
              </div>
              <span className="shrink-0 text-xs font-semibold text-teal-700">{mentalLoadPct}%</span>
            </div>
          </Card>
        )}

        {timeByMember.length > 1 && (
          <Card>
            <p className="text-sm font-semibold text-forest-900">Tempo dedicado à casa</p>
            <p className="mt-1 text-xs text-forest-500">
              Baseado no tempo registrado ao concluir tarefas — não só na quantidade
            </p>
            <div className="mt-3 flex h-2 overflow-hidden rounded-full bg-forest-100">
              {timeByMember.map((m, i) => (
                <div
                  key={m.id}
                  className={`h-full ${LOAD_COLORS[i % LOAD_COLORS.length]}`}
                  style={{ width: `${(m.minutes / timeTotal) * 100}%` }}
                />
              ))}
            </div>
            <div className="mt-2 flex flex-wrap justify-between gap-2 text-xs text-forest-500">
              {timeByMember.map((m) => (
                <span key={m.id}>
                  {m.name.split(' ')[0]} {formatMinutes(m.minutes)}
                </span>
              ))}
            </div>
          </Card>
        )}

        <Card>
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-forest-900">Compras da semana</p>
            <button
              onClick={() => navigate('/lista-compras')}
              className="flex min-h-[32px] items-center text-xs font-medium text-teal-700"
            >
              Ver lista →
            </button>
          </div>
          {items.length === 0 ? (
            <p className="mt-2 text-xs text-forest-500">Lista vazia por enquanto.</p>
          ) : (
            <>
              <p className="mt-3 text-sm font-semibold text-forest-900">
                {items.length - pendingItems.length} de {items.length} itens
              </p>
              <p className="mt-0.5 text-xs text-forest-500">
                Faltam {pendingItems.length} itens · ~R$ {estimatedTotal.toFixed(0)}
              </p>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-forest-100">
                <div
                  className="h-full rounded-full bg-amber-500 transition-all"
                  style={{ width: `${((items.length - pendingItems.length) / items.length) * 100}%` }}
                />
              </div>
              {pendingItems.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {pendingItems.slice(0, 3).map((i) => (
                    <span key={i.id} className="rounded-full bg-forest-100 px-2 py-1 text-xs text-forest-700">
                      {i.name}
                    </span>
                  ))}
                </div>
              )}
            </>
          )}
        </Card>

        {goalsList.length > 0 && (
          <Card>
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-forest-900">Metas compartilhadas</p>
              <button
                onClick={() => navigate('/financas')}
                className="flex min-h-[32px] items-center text-xs font-medium text-teal-700"
              >
                Ver tudo →
              </button>
            </div>
            <div className="mt-3 flex flex-col">
              {goalsList.slice(0, 3).map((g, i, arr) => {
                const pct = g.target_amount ? Math.min(Math.round((g.saved_amount / g.target_amount) * 100), 100) : 0
                const tone = EQUILIBRIO_TONES[i % EQUILIBRIO_TONES.length]
                return (
                  <button
                    key={g.id}
                    onClick={() => navigate('/financas')}
                    className={`flex items-start gap-3 py-3 text-left ${i < arr.length - 1 ? 'border-b border-forest-100' : ''} ${
                      i === 0 ? 'pt-0' : ''
                    }`}
                  >
                    <span className={`flex size-11 shrink-0 items-center justify-center rounded-full text-xl ${tone.card}`}>
                      {g.icon}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-sm font-semibold text-forest-900">{g.title}</p>
                        {g.assignee_name && (
                          <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${tone.card} ${tone.text}`}>
                            {g.assignee_name.split(' ')[0]}
                          </span>
                        )}
                      </div>
                      {g.target_amount ? (
                        <>
                          <p className="mt-0.5 text-xs text-forest-500">R$ {formatBRL(g.target_amount)}</p>
                          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-forest-100">
                            <div className={`h-full rounded-full ${tone.bar}`} style={{ width: `${pct}%` }} />
                          </div>
                          <div className="mt-1 flex items-center justify-between text-xs">
                            <span className="font-bold text-forest-900">R$ {formatBRL(g.saved_amount)}</span>
                            <span className="text-forest-500">{pct}% da meta</span>
                          </div>
                        </>
                      ) : (
                        <span className="text-xs text-forest-500">R$ {formatBRL(g.saved_amount)} guardados</span>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          </Card>
        )}

      </div>

      <Fab onClick={() => setShowAddChooser(true)} label="Adicionar" />

      <Modal open={showAddChooser} onClose={() => setShowAddChooser(false)} title="O que você quer adicionar?">
        <div className="flex flex-col gap-2">
          {ADD_OPTIONS.map((opt) => (
            <button
              key={opt.key}
              onClick={() => {
                setShowAddChooser(false)
                navigate(opt.to, { state: { openAdd: opt.key } })
              }}
              className="flex items-center gap-3 rounded-sm border-[1.5px] border-forest-100 bg-surface p-3 text-left"
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-forest-50 text-base">
                {opt.icon}
              </span>
              <span className="text-sm font-medium text-forest-900">{opt.label}</span>
            </button>
          ))}
          <button
            onClick={() => {
              setShowAddChooser(false)
              setShowMoodPicker(true)
            }}
            className="flex items-center gap-3 rounded-2xl border-[1.5px] border-forest-100 bg-surface p-3 text-left"
          >
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-forest-50 text-base">
              😊
            </span>
            <span className="text-sm font-medium text-forest-900">Humor</span>
          </button>
        </div>
      </Modal>

      <Modal open={showMoodPicker} onClose={() => setShowMoodPicker(false)} title="Como você está hoje?">
        <div className="flex flex-wrap gap-2">
          {MOODS.map((m) => (
            <button
              key={m.value}
              onClick={async () => {
                await setMyMood(m.value)
                setShowMoodPicker(false)
              }}
              className={`inline-flex min-h-[36px] items-center gap-1.5 rounded-full border-[1.5px] px-3 py-1.5 text-sm ${
                myMoodToday === m.value ? 'border-teal-500 bg-teal-50 text-teal-ink' : 'border-forest-100 bg-surface text-forest-700'
              }`}
            >
              <span>{m.icon}</span> {m.label}
            </button>
          ))}
        </div>
      </Modal>

      <MoodCalendarModal open={showMoodCalendar} onClose={() => setShowMoodCalendar(false)} feed={feed} />

      <Modal open={showEquilibrioDetail} onClose={() => setShowEquilibrioDetail(false)} title="Equilíbrio da casa">
        <div className="flex flex-col gap-4">
          <p className="-mt-2 text-xs text-forest-500">Visão geral de como as responsabilidades estão distribuídas este mês.</p>

          {twoPersonEquilibrio && (
            <>
              <Card>
                <p className={`text-center text-xs font-semibold ${balanceHealthy ? 'text-teal-ink' : 'text-amber-ink'}`}>
                  {balanceHealthy ? 'Equilíbrio saudável' : 'Vale ficar de olho'}
                </p>
                <p className="mt-0.5 text-center text-xs text-forest-500">
                  {balanceHealthy
                    ? 'A divisão das responsabilidades está equilibrada'
                    : 'A divisão está pendendo bastante para um lado'}
                </p>
                <div className="mt-3 flex items-center justify-between gap-2">
                  <div className="flex flex-col items-center text-center">
                    <span className="text-[28px] font-bold text-coral-ink">{twoPersonEquilibrio[0].financePct}%</span>
                    <span className="text-xs font-semibold text-forest-700">
                      {twoPersonEquilibrio[0].name.split(' ')[0]}
                    </span>
                  </div>
                  <div className="flex flex-1 items-center justify-center gap-2">
                    <span className="h-px flex-1 border-t border-dashed border-coral-300" />
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-app-bg text-base shadow-sm">
                      🤍
                    </span>
                    <span className="h-px flex-1 border-t border-dashed border-teal-300" />
                  </div>
                  <div className="flex flex-col items-center text-center">
                    <span className="text-[28px] font-bold text-teal-700">{twoPersonEquilibrio[1].financePct}%</span>
                    <span className="text-xs font-semibold text-forest-700">
                      {twoPersonEquilibrio[1].name.split(' ')[0]}
                    </span>
                  </div>
                </div>
              </Card>

              <Card>
                <p className="text-xs font-bold uppercase tracking-wide text-forest-500">Categorias</p>
                <div className="mt-2 flex flex-col">
                  {[
                    { icon: categoryFinancas, label: 'Finanças', left: twoPersonEquilibrio[0].financePct, right: twoPersonEquilibrio[1].financePct },
                    { icon: categoryCasa, label: 'Tarefas', left: twoPersonEquilibrio[0].taskPct, right: twoPersonEquilibrio[1].taskPct },
                    { icon: categoryTarefas, label: 'Compras', left: twoPersonEquilibrio[0].shopPct, right: twoPersonEquilibrio[1].shopPct },
                  ].map((row, i, arr) => (
                    <div
                      key={row.label}
                      className={`flex items-center gap-2 py-2 ${i < arr.length - 1 ? 'border-b border-forest-100' : ''} ${
                        i === 0 ? 'pt-0' : ''
                      }`}
                    >
                      <span className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-forest-50">
                        <img src={row.icon} alt="" className="size-full object-cover" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-forest-900">{row.label}</p>
                        <div className="mt-1 flex items-center gap-2">
                          <span className="w-8 shrink-0 text-xs font-semibold text-coral-ink">{row.left}%</span>
                          <div className="flex h-1.5 flex-1 overflow-hidden rounded-full">
                            <div className="h-full bg-coral-700" style={{ width: `${row.left}%` }} />
                            <div className="h-full bg-teal-500" style={{ width: `${row.right}%` }} />
                          </div>
                          <span className="w-8 shrink-0 text-right text-xs font-semibold text-teal-700">{row.right}%</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </>
          )}

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-forest-500">
              💰 Finanças · quem pagou nos últimos 30 dias
            </p>
            {periodTransactions.filter((t) => t.type === 'expense').length === 0 ? (
              <p className="mt-1.5 text-xs text-forest-500">Nenhum gasto lançado ainda.</p>
            ) : (
              <div className="mt-1.5 flex flex-col gap-1.5">
                {periodTransactions
                  .filter((t) => t.type === 'expense')
                  .sort((a, b) => b.date.localeCompare(a.date))
                  .map((t) => (
                    <div key={t.id} className="flex items-center justify-between text-xs">
                      <span className="min-w-0 flex-1 truncate text-forest-700">
                        {members.find((m) => m.id === t.created_by)?.name.split(' ')[0] ?? 'Alguém'} ·{' '}
                        {t.description || t.category}
                      </span>
                      <span className="shrink-0 font-medium text-forest-900">R$ {formatBRL(t.amount)}</span>
                    </div>
                  ))}
              </div>
            )}
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-forest-500">✅ Tarefas · quem ficou com cada uma</p>
            {assignedTasks.length === 0 ? (
              <p className="mt-1.5 text-xs text-forest-500">Nenhuma tarefa com responsável ainda.</p>
            ) : (
              <div className="mt-1.5 flex flex-col gap-1.5">
                {assignedTasks.map((t) => (
                  <div key={t.id} className="flex items-center justify-between text-xs">
                    <span className="min-w-0 flex-1 truncate text-forest-700">
                      {t.icon ?? '✅'} {t.title}
                    </span>
                    <span className="shrink-0 text-forest-500">
                      {members.find((m) => m.id === t.assigned_to)?.name.split(' ')[0] ?? '—'}
                      {t.status === 'done' ? ' · feita' : ''}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-forest-500">🛒 Compras · quem adicionou cada item</p>
            {shoppingWithAdder.length === 0 ? (
              <p className="mt-1.5 text-xs text-forest-500">Nenhum item com responsável ainda.</p>
            ) : (
              <div className="mt-1.5 flex flex-col gap-1.5">
                {shoppingWithAdder.map((i) => (
                  <div key={i.id} className="flex items-center justify-between text-xs">
                    <span className="min-w-0 flex-1 truncate text-forest-700">{i.name}</span>
                    <span className="shrink-0 text-forest-500">{i.added_by_name?.split(' ')[0] ?? '—'}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </Modal>

      <BottomNav />
    </Screen>
  )
}
