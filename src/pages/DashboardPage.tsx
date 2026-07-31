import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Screen } from '../components/layout/Screen'
import { AuraBackground } from '../components/ui/AuraBackground'
import { Card } from '../components/ui/Card'
import { Fab } from '../components/ui/Fab'
import { Modal } from '../components/ui/Modal'
import { MiniStatTile } from '../components/ui/MiniStatTile'
import { BottomNav } from '../components/layout/BottomNav'
import { MoodCalendarModal } from '../components/home/MoodCalendarModal'
import { formatBRL } from '../lib/currency'
import { useSession } from '../store/session'
import { useActivityStore } from '../store/activity'
import {
  tasks as tasksApi,
  shopping,
  analytics,
  mood as moodApi,
  household,
  transactions,
  activity as activityApi,
  bills as billsApi,
  goals as goalsApi,
  type Task,
  type ShoppingItem,
  type Checkin,
  type Member,
  type ActivityEntry,
  type Transaction,
  type Bill,
  type Goal,
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
  const [balance, setBalance] = useState({ entradas: 0, saidas: 0 })
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([])
  const [bills, setBills] = useState<Bill[]>([])
  const [goalsList, setGoalsList] = useState<Goal[]>([])
  const [feed, setFeed] = useState<ActivityEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddChooser, setShowAddChooser] = useState(false)
  const [showMoodCalendar, setShowMoodCalendar] = useState(false)
  const [showMoodPicker, setShowMoodPicker] = useState(false)
  const [showEquilibrioDetail, setShowEquilibrioDetail] = useState(false)
  const [checklistDismissed, setChecklistDismissed] = useState(() => localStorage.getItem('vj_checklist_dismissed') === '1')
  const [showAllActivity, setShowAllActivity] = useState(false)
  const markActivitySeen = useActivityStore((s) => s.markSeen)

  function dismissChecklist() {
    localStorage.setItem('vj_checklist_dismissed', '1')
    setChecklistDismissed(true)
  }

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
      activityApi.list().then((r) => {
        setFeed(r.activity)
        if (r.activity[0]) markActivitySeen(r.activity[0].created_at)
      }),
      analytics.weekly().then((r) => {
        const entradas = r.days.reduce((s, d) => s + d.entradas, 0)
        const saidas = r.days.reduce((s, d) => s + d.saidas, 0)
        setBalance({ entradas, saidas })
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

  const checklist = [
    { label: 'Adicionar sua 1ª tarefa', done: taskList.length > 0, to: '/organizacao' },
    { label: 'Registrar seu 1º gasto', done: recentTransactions.length > 0, to: '/financas' },
    {
      label: 'Convidar seu par',
      done: members.length > 1 || localStorage.getItem('vj_invite_skipped') === '1',
      to: '/convidar',
    },
    { label: 'Registrar seu humor hoje', done: checkins.some((c) => c.user_id === user?.id), to: '/dashboard' },
    { label: 'Adicionar item na lista de compras', done: items.length > 0, to: '/lista-compras' },
  ]
  const checklistDone = checklist.filter((c) => c.done).length
  const showChecklist = checklistDone < checklist.length && !checklistDismissed

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
  const nextBill = unpaidBillsSorted[0]
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

      <div className="relative z-10 flex items-center justify-between px-4 pb-2 pt-6">
        <div>
          <p className="text-xs text-forest-500">Olá,</p>
          <p className="text-lg font-bold text-forest-900">{firstName} 👋</p>
        </div>
        <button
          onClick={() => navigate('/perfil')}
          aria-label="Ir para o perfil"
          className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-surface text-sm font-bold text-forest-900 shadow-xs"
        >
          {user?.avatarUrl ? (
            <img src={user.avatarUrl} alt="" className="size-full object-cover" />
          ) : (
            firstName[0]?.toUpperCase()
          )}
        </button>
      </div>

      <div className="relative z-10 flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 pb-28">
        <Card className="bg-ink text-white">
          <p className="text-xs text-ink-muted">Movimentado nos últimos 7 dias</p>
          <p className="mt-1 text-3xl font-bold">
            R$ {formatBRL(balance.entradas - balance.saidas)}
          </p>
          <button
            onClick={() => navigate('/financas')}
            className="mt-3 flex min-h-[32px] items-center rounded-full bg-white/10 px-3 text-xs"
          >
            Ver finanças →
          </button>
        </Card>

        <div className="flex gap-2">
          <MiniStatTile
            icon="📅"
            title="Contas"
            value={billsDueSoon > 0 ? `${billsDueSoon} em breve` : '0 em breve'}
            sub={nextBill ? `Próx: R$ ${formatBRL(nextBill.amount)}` : undefined}
            tone="amber"
            onClick={() => navigate('/financas')}
          />
          <MiniStatTile
            icon="✓"
            title="Tarefas"
            value={String(pendingTasksCount)}
            sub={overdueTasks > 0 ? `${overdueTasks} urgentes` : undefined}
            tone="teal"
            onClick={() => navigate('/organizacao')}
          />
          <MiniStatTile
            icon="✨"
            title="Metas"
            value={goalsAvgPct !== null ? `${goalsAvgPct}%` : '—'}
            sub="Do objetivo"
            tone="coral"
            onClick={() => navigate('/financas')}
          />
        </div>

        {showChecklist && (
          <Card>
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-forest-900">Primeiros passos</p>
              <div className="flex items-center gap-1">
                <span className="text-xs font-medium text-teal-700">
                  {checklistDone} de {checklist.length}
                </span>
                <button
                  onClick={dismissChecklist}
                  aria-label="Fazer isso depois"
                  title="Fazer depois"
                  className="flex size-8 shrink-0 items-center justify-center rounded-full text-forest-300 hover:bg-forest-50 hover:text-forest-700"
                >
                  ✕
                </button>
              </div>
            </div>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-forest-100">
              <div
                className="h-full rounded-full bg-teal-500 transition-all"
                style={{ width: `${(checklistDone / checklist.length) * 100}%` }}
              />
            </div>
            <div className="mt-3 flex flex-col gap-2">
              {checklist.map((c) => (
                <button
                  key={c.label}
                  onClick={() => navigate(c.to)}
                  disabled={c.done}
                  className="flex min-h-[32px] items-center gap-2 text-left text-xs"
                >
                  <span
                    className={`flex size-5 shrink-0 items-center justify-center rounded-full border-2 text-xs ${
                      c.done ? 'border-teal-500 bg-teal-500 text-white' : 'border-forest-100 text-forest-100'
                    }`}
                  >
                    {c.done ? '✓' : ''}
                  </span>
                  <span className={c.done ? 'text-forest-400 line-through' : 'text-forest-700'}>{c.label}</span>
                </button>
              ))}
            </div>
          </Card>
        )}

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
            <p className="text-sm font-semibold text-forest-900">Casa hoje</p>
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
            <div className="mt-3 flex flex-col gap-3">
              {timelineEntries.map((entry) => (
                <div key={entry.id} className="flex items-center justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <span
                      className={`flex size-6 shrink-0 items-center justify-center rounded-full text-sm ${
                        entry.tagTone === 'error'
                          ? 'bg-coral-50'
                          : entry.tagTone === 'teal'
                            ? 'bg-teal-50'
                            : entry.tagTone === 'amber'
                              ? 'bg-amber-50'
                              : 'bg-forest-50'
                      }`}
                    >
                      {entry.icon}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-forest-900">{entry.title}</p>
                      <p className="truncate text-xs text-forest-500">{entry.sub}</p>
                    </div>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${
                      entry.tagTone === 'error'
                        ? 'bg-coral-100 text-error'
                        : entry.tagTone === 'teal'
                          ? 'bg-teal-100 text-teal-ink'
                          : entry.tagTone === 'amber'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-forest-100 text-forest-500'
                    }`}
                  >
                    {entry.tag}
                  </span>
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
            <p className="text-sm font-semibold text-forest-900">Compras</p>
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
              <p className="mt-2 text-xs text-forest-500">
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
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-forest-900">Metas compartilhadas</p>
              <button
                onClick={() => navigate('/financas')}
                className="flex min-h-[32px] items-center text-xs font-medium text-teal-700"
              >
                Ver todas →
              </button>
            </div>
            {goalsList.slice(0, 3).map((g, i) => {
              const pct = g.target_amount ? Math.min(Math.round((g.saved_amount / g.target_amount) * 100), 100) : 0
              const tone = EQUILIBRIO_TONES[i % EQUILIBRIO_TONES.length]
              return (
                <button key={g.id} onClick={() => navigate('/financas')} className="text-left">
                  <div className="flex items-stretch gap-2 overflow-hidden rounded-sm border border-forest-100 bg-surface shadow-sm">
                    <span className={`w-1.5 shrink-0 ${tone.bar}`} />
                    <span className={`my-2 flex size-10 shrink-0 items-center justify-center rounded-full text-xl ${tone.card}`}>
                      {g.icon}
                    </span>
                    <div className="min-w-0 flex-1 py-2 pr-3">
                      <p className="truncate text-sm font-semibold text-forest-900">{g.title}</p>
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
                  </div>
                </button>
              )
            })}
          </div>
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
        <div className="flex flex-col gap-5">
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
