import { useEffect, useState } from 'react'
import { Reorder, useDragControls } from 'framer-motion'
import { useLocation, useNavigate } from 'react-router-dom'
import { Screen } from '../components/layout/Screen'
import { Header } from '../components/layout/Header'
import { AuraBackground } from '../components/ui/AuraBackground'
import { Card } from '../components/ui/Card'
import { Fab } from '../components/ui/Fab'
import { Modal } from '../components/ui/Modal'
import { ConfirmModal } from '../components/ui/ConfirmModal'
import { Input } from '../components/ui/Input'
import { Button } from '../components/ui/Button'
import { DragGrip } from '../components/ui/DragGrip'
import { BottomNav } from '../components/layout/BottomNav'
import {
  household,
  tasks as tasksApi,
  dependents as dependentsApi,
  type Task,
  type Member,
  type Dependent,
} from '../lib/api'
import { localDateString, formatLocalDate } from '../lib/date'
import { toast, toastError } from '../store/toast'

const TASK_ICONS = ['✅', '🧺', '🧽', '🐾', '💸', '🛏️', '🗑️', '🛒']
const TASK_ICON_LABELS: Record<string, string> = {
  '✅': 'Geral',
  '🧺': 'Roupa',
  '🧽': 'Limpeza',
  '🐾': 'Pet',
  '💸': 'Contas',
  '🛏️': 'Quarto',
  '🗑️': 'Lixo',
  '🛒': 'Compras',
}
const RECURRENCE_OPTIONS = [
  { value: '', label: 'Não repete' },
  { value: 'daily', label: 'Todo dia' },
  { value: 'weekly', label: 'Toda semana' },
  { value: 'biweekly', label: 'A cada 2 semanas' },
  { value: 'monthly', label: 'Todo mês' },
  { value: 'custom', label: 'Dias específicos' },
]
const WEEKDAY_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const LOAD_COLORS = ['bg-coral-700', 'bg-teal-500', 'bg-amber-700', 'bg-forest-500']

type Filter = 'todas' | 'minhas' | 'pendentes'

function last7Days() {
  const days: { date: string; label: string }[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    days.push({ date: localDateString(d), label: WEEKDAY_LABELS[d.getDay()] })
  }
  return days
}

export function HouseholdOrganizationPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [taskList, setTaskList] = useState<Task[]>([])
  const [members, setMembers] = useState<Member[]>([])
  const [dependentsList, setDependentsList] = useState<Dependent[]>([])
  const [filter, setFilter] = useState<Filter>('todas')
  const [showFilterMenu, setShowFilterMenu] = useState(false)
  const [showAdd, setShowAdd] = useState(false)
  const [loading, setLoading] = useState(true)

  const [form, setForm] = useState({
    title: '',
    icon: TASK_ICONS[0],
    assignedTo: '',
    assignedDependentId: '',
    dueDate: '',
    recurrence: '',
    recurrenceDays: [] as string[],
  })
  const [saving, setSaving] = useState(false)
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [addingDependent, setAddingDependent] = useState(false)
  const [newDependentName, setNewDependentName] = useState('')
  const [timeTrackTask, setTimeTrackTask] = useState<Task | null>(null)
  const [timeForm, setTimeForm] = useState({ start: '', end: '' })
  const [actionsTask, setActionsTask] = useState<Task | null>(null)

  async function load() {
    setLoading(true)
    const [t, m, d] = await Promise.all([
      tasksApi.list().catch(() => ({ tasks: [] })),
      household.members().catch(() => ({ members: [] })),
      dependentsApi.list().catch(() => ({ dependents: [] })),
    ])
    setTaskList(t.tasks)
    setMembers(m.members)
    setDependentsList(d.dependents)
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  useEffect(() => {
    const state = location.state as { openAdd?: string } | null
    if (state?.openAdd === 'task') {
      openAdd()
      navigate(location.pathname, { replace: true, state: null })
    }
  }, [location])

  async function applyStatus(task: Task, nextStatus: 'pending' | 'done', timeSpentMinutes?: number) {
    setTaskList((prev) => prev.map((t) => (t.id === task.id ? { ...t, status: nextStatus } : t)))
    try {
      await tasksApi.setStatus(task.id, nextStatus, timeSpentMinutes)
      if (nextStatus === 'done') load()
    } catch {
      setTaskList((prev) => prev.map((t) => (t.id === task.id ? { ...t, status: task.status } : t)))
      toastError('Não foi possível atualizar a tarefa. Tente de novo.')
    }
  }

  function toggleTask(task: Task) {
    if (task.status === 'done') {
      applyStatus(task, 'pending')
      return
    }
    setTimeTrackTask(task)
    setTimeForm({ start: '', end: '' })
  }

  function confirmTimeTrack() {
    if (!timeTrackTask) return
    const task = timeTrackTask
    let minutes: number | undefined
    if (timeForm.start && timeForm.end) {
      const [sh, sm] = timeForm.start.split(':').map(Number)
      const [eh, em] = timeForm.end.split(':').map(Number)
      const diff = eh * 60 + em - (sh * 60 + sm)
      if (diff <= 0) {
        toastError('O horário de término precisa ser depois do início.')
        return
      }
      minutes = diff
    }
    setTimeTrackTask(null)
    applyStatus(task, 'done', minutes)
  }

  async function handleReorderTasksInGroup(reorderedGroup: Task[]) {
    const idsInGroup = new Set(reorderedGroup.map((t) => t.id))
    let cursor = 0
    const merged = taskList.map((t) => (idsInGroup.has(t.id) ? reorderedGroup[cursor++] : t))
    setTaskList(merged)
    try {
      await tasksApi.reorder(reorderedGroup.map((t) => t.id))
    } catch {
      toastError('Não foi possível reordenar as tarefas.')
      load()
    }
  }

  async function confirmRemoveTask() {
    if (!confirmId) return
    const id = confirmId
    setConfirmId(null)
    setTaskList((prev) => prev.filter((t) => t.id !== id))
    try {
      await tasksApi.remove(id)
      toast('Tarefa excluída.')
    } catch {
      toastError('Não foi possível excluir a tarefa.')
      load()
    }
  }

  function openAdd() {
    setEditingId(null)
    setForm({
      title: '',
      icon: TASK_ICONS[0],
      assignedTo: '',
      assignedDependentId: '',
      dueDate: '',
      recurrence: '',
      recurrenceDays: [],
    })
    setAddingDependent(false)
    setShowAdd(true)
  }

  function openEdit(task: Task) {
    setActionsTask(null)
    setEditingId(task.id)
    setForm({
      title: task.title,
      icon: task.icon ?? TASK_ICONS[0],
      assignedTo: task.assigned_to ?? '',
      assignedDependentId: task.assigned_dependent_id ?? '',
      dueDate: task.due_date ?? '',
      recurrence: task.recurrence ?? '',
      recurrenceDays: task.recurrence_days ? task.recurrence_days.split(',') : [],
    })
    setAddingDependent(false)
    setShowAdd(true)
  }

  async function handleAddDependent() {
    const name = newDependentName.trim()
    if (!name) return
    try {
      const { id } = await dependentsApi.create({ name })
      setDependentsList((prev) => [...prev, { id, name, icon: '🧒' }])
      setForm((f) => ({ ...f, assignedTo: '', assignedDependentId: id }))
      setNewDependentName('')
      setAddingDependent(false)
    } catch {
      toastError('Não foi possível adicionar o dependente.')
    }
  }

  async function handleSaveTask() {
    if (!form.title.trim()) return
    if (form.recurrence === 'custom' && form.recurrenceDays.length === 0) {
      toastError('Escolha ao menos um dia da semana.')
      return
    }
    setSaving(true)
    try {
      const data = {
        title: form.title.trim(),
        icon: form.icon,
        assignedTo: form.assignedTo || null,
        assignedDependentId: form.assignedDependentId || null,
        dueDate: form.dueDate || null,
        recurrence: form.recurrence || null,
        recurrenceDays: form.recurrence === 'custom' ? form.recurrenceDays.join(',') : null,
      }
      if (editingId) {
        await tasksApi.update(editingId, data)
        toast('Tarefa atualizada!')
      } else {
        await tasksApi.create(data)
        toast('Tarefa adicionada!')
      }
      setForm({
        title: '',
        icon: TASK_ICONS[0],
        assignedTo: '',
        assignedDependentId: '',
        dueDate: '',
        recurrence: '',
        recurrenceDays: [],
      })
      setEditingId(null)
      setShowAdd(false)
      await load()
    } catch {
      toastError(editingId ? 'Não foi possível salvar a tarefa.' : 'Não foi possível adicionar a tarefa.')
    } finally {
      setSaving(false)
    }
  }

  const filteredTasks = taskList.filter((t) => {
    if (filter === 'pendentes') return t.status === 'pending'
    if (filter === 'minhas') return !!t.assigned_to || !!t.assigned_dependent_id
    return true
  })

  // Grouped by urgency instead of one flat list — tasks with no due date
  // default into "Hoje" so they stay visible instead of vanishing into a
  // fourth, easy-to-ignore bucket.
  const todayStr = localDateString()
  const taskGroups = [
    { label: 'Atrasadas', tasks: filteredTasks.filter((t) => t.due_date && t.due_date < todayStr) },
    {
      label: 'Hoje',
      tasks: filteredTasks.filter((t) => !t.due_date || t.due_date === todayStr),
    },
    { label: 'Próximos dias', tasks: filteredTasks.filter((t) => t.due_date && t.due_date > todayStr) },
  ].filter((g) => g.tasks.length > 0)

  const assignedTasks = taskList.filter((t) => t.assigned_to)
  const loadByMember = members
    .map((m) => ({ ...m, count: assignedTasks.filter((t) => t.assigned_to === m.id).length }))
    .filter((m) => m.count > 0)
  const loadTotal = loadByMember.reduce((s, m) => s + m.count, 0)

  // Time actually spent completing tasks this week, per person — used both
  // for the suggestion rules below and to avoid the "more tasks = more work"
  // fallacy when comparing who's doing more.
  const weekStart = last7Days()[0].date
  const timeByMember = members.map((m) => ({
    ...m,
    minutes: taskList
      .filter((t) => t.completed_by === m.id && t.time_spent_minutes && (t.completed_at?.slice(0, 10) ?? '') >= weekStart)
      .reduce((s, t) => s + (t.time_spent_minutes ?? 0), 0),
  }))
  const timeTotal = timeByMember.reduce((s, m) => s + m.minutes, 0)

  // Suggestion #1: task load lopsided toward one person (by count or by
  // actual time spent), when there's more than one member sharing tasks.
  const suggestions: { icon: string; headline: string; body: string; ctaLabel: string; onCta: () => void }[] = []
  if (loadByMember.length > 1 && loadTotal > 0) {
    const top = [...loadByMember].sort((a, b) => b.count - a.count)[0]
    const topPct = Math.round((top.count / loadTotal) * 100)
    const topByTime = timeTotal > 0 ? [...timeByMember].sort((a, b) => b.minutes - a.minutes)[0] : null
    const topTimePct = topByTime && timeTotal > 0 ? Math.round((topByTime.minutes / timeTotal) * 100) : 0
    if (topPct >= 65 || topTimePct >= 65) {
      suggestions.push({
        icon: '⚖️',
        headline: 'Tarefas desequilibradas',
        body:
          topTimePct >= 65
            ? `${topByTime!.name.split(' ')[0]} vem dedicando bem mais tempo às tarefas da casa. Que tal redistribuir?`
            : `${top.name.split(' ')[0]} está com ${topPct}% das tarefas atribuídas. Que tal redistribuir?`,
        ctaLabel: 'Ver tarefas',
        onCta: () => setFilter('minhas'),
      })
    }
  }
  // Suggestion #2: a title that keeps getting recreated by hand is a good
  // candidate for recurrence.
  const titleCounts = new Map<string, Task[]>()
  for (const t of taskList) {
    if (t.recurrence) continue
    const key = t.title.trim().toLowerCase()
    titleCounts.set(key, [...(titleCounts.get(key) ?? []), t])
  }
  for (const [, group] of titleCounts) {
    if (group.length >= 3) {
      suggestions.push({
        icon: '🔁',
        headline: 'Vira rotina?',
        body: `"${group[0].title}" já apareceu ${group.length}x. Marcar como recorrente evita ter que recriar toda vez.`,
        ctaLabel: 'Editar tarefa',
        onCta: () => openEdit(group[group.length - 1]),
      })
      break
    }
  }

  const week = last7Days()
  const completedByDay = week.map((d) => ({
    ...d,
    count: taskList.filter((t) => t.completed_at?.slice(0, 10) === d.date).length,
  }))
  const maxCompletedInDay = Math.max(...completedByDay.map((d) => d.count), 1)

  return (
    <Screen scroll className="bg-app-bg">
      <AuraBackground
        auras={[
          { color: 'teal', size: 240, top: -70, left: 180 },
          { color: 'coral', size: 180, bottom: 220, right: -60 },
        ]}
      />
      <Header title="Organização" />

      <div className="relative z-10 flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 pb-44">
        {loadByMember.length > 1 && (
          <Card>
            <p className="text-sm font-semibold text-forest-900">Carga mental da semana</p>
            <div className="mt-3 flex flex-col gap-3">
              {loadByMember.map((m, i) => {
                const pct = Math.round((m.count / loadTotal) * 100)
                const overloaded = pct >= 65
                return (
                  <div key={m.id} className="flex items-center gap-3">
                    <span className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-forest-50 text-sm font-bold text-forest-700">
                      {m.avatar_url ? (
                        <img src={m.avatar_url} alt="" className="size-full object-cover" />
                      ) : (
                        m.name[0]?.toUpperCase()
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-forest-900">{m.name.split(' ')[0]}</span>
                        <span className={overloaded ? 'font-semibold text-error' : 'text-forest-500'}>{pct}%</span>
                      </div>
                      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-forest-100">
                        <div
                          className={`h-full rounded-full ${overloaded ? 'bg-error' : LOAD_COLORS[i % LOAD_COLORS.length]}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      {overloaded && (
                        <p className="mt-1 text-xs text-error">Bem acima da média — considerem redistribuir.</p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>
        )}

        {suggestions.length > 0 && (
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-forest-900">Sugestões</p>
              <span className="rounded-full bg-forest-100 px-2.5 py-1 text-xs font-medium text-forest-500">✨ Automático</span>
            </div>
            {suggestions.map((s, i) => (
              <Card key={i} className="flex flex-row items-start gap-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-teal-50 text-lg">
                  {s.icon}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-forest-900">{s.headline}</p>
                  <p className="mt-1 text-xs text-forest-500">{s.body}</p>
                  <button onClick={s.onCta} className="mt-2 rounded-full bg-teal-50 px-3 py-1.5 text-xs font-semibold text-teal-ink">
                    {s.ctaLabel}
                  </button>
                </div>
              </Card>
            ))}
          </div>
        )}

        {taskList.some((t) => t.completed_at) && (
          <Card>
            <p className="text-sm font-semibold text-forest-900">Tarefas concluídas na semana</p>
            <div className="mt-3 grid grid-cols-7 gap-1">
              {completedByDay.map((d) => (
                <div key={d.date} className="flex flex-col items-center gap-1.5">
                  <span className="text-xs font-medium text-forest-500">{d.label}</span>
                  <div className="flex h-14 w-full items-end justify-center rounded-lg bg-forest-50">
                    <div
                      className="w-full rounded-lg bg-teal-500"
                      style={{ height: `${(d.count / maxCompletedInDay) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-forest-500">{d.count}</span>
                </div>
              ))}
            </div>
          </Card>
        )}

        <div className="relative flex items-center justify-between">
          <p className="text-sm font-semibold text-forest-900">Tarefas de hoje</p>
          <div className="relative">
            <button
              onClick={() => setShowFilterMenu((v) => !v)}
              className="flex min-h-[32px] items-center text-xs font-medium text-teal-700"
            >
              Filtrar: {filter === 'todas' ? 'Todas' : filter === 'minhas' ? 'Com responsável' : 'Pendentes'}
            </button>
            {showFilterMenu && (
              <div className="absolute right-0 top-8 z-10 flex flex-col overflow-hidden rounded-2xl border border-forest-100 bg-surface shadow-md">
                {(['todas', 'pendentes', 'minhas'] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => {
                      setFilter(f)
                      setShowFilterMenu(false)
                    }}
                    className="min-h-[32px] whitespace-nowrap px-4 py-2 text-left text-xs text-forest-700 hover:bg-forest-50"
                  >
                    {f === 'todas' ? 'Todas' : f === 'pendentes' ? 'Pendentes' : 'Com responsável'}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {loading ? (
          <p className="text-center text-sm text-forest-500">Carregando...</p>
        ) : filteredTasks.length === 0 && taskList.length > 0 ? (
          <p className="py-6 text-center text-sm text-forest-500">Nenhuma tarefa nesse filtro.</p>
        ) : filteredTasks.length === 0 ? (
          <div className="flex flex-col gap-3">
            <div className="flex flex-col items-center gap-2 rounded-3xl border-[1.5px] border-dashed border-forest-100 py-10 text-center">
              <span className="text-2xl">🧹</span>
              <p className="text-sm font-medium text-forest-700">Nenhuma tarefa ainda</p>
              <p className="text-xs text-forest-500">Toque no + para adicionar a primeira tarefa da casa.</p>
            </div>
            <div className="flex items-center gap-3 rounded-sm border-[1.5px] border-dashed border-forest-100 bg-surface p-3 opacity-40">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full border-2 border-forest-100" />
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-forest-50 text-base">
                🧺
              </span>
              <span className="flex-1 text-sm text-forest-700">Lavar roupa</span>
            </div>
            <span className="-mt-2 self-center rounded-full bg-forest-100 px-2 py-0.5 text-xs font-medium text-forest-500">
              Exemplo
            </span>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {taskGroups.map((group) => (
              <div key={group.label} className="flex flex-col gap-2.5">
                <div className="flex items-center justify-between">
                  <p className={`text-xs font-semibold ${group.label === 'Atrasadas' ? 'text-error' : 'text-forest-500'}`}>
                    {group.label}
                  </p>
                  <span className="text-xs text-forest-400">
                    {group.tasks.length} {group.tasks.length === 1 ? 'tarefa' : 'tarefas'}
                  </span>
                </div>
                <Reorder.Group
                  as="div"
                  axis="y"
                  values={group.tasks}
                  onReorder={handleReorderTasksInGroup}
                  className="flex flex-col gap-2.5"
                >
                  {group.tasks.map((task) => (
                    <TaskRow key={task.id} task={task} onToggle={() => toggleTask(task)} onOpenActions={() => setActionsTask(task)} />
                  ))}
                </Reorder.Group>
              </div>
            ))}
          </div>
        )}
      </div>

      <Fab onClick={openAdd} label="Adicionar tarefa" />

      <Modal
        open={showAdd}
        onClose={() => {
          setShowAdd(false)
          setEditingId(null)
        }}
        title={editingId ? 'Editar tarefa' : 'Nova tarefa'}
      >
        <div className="flex flex-col gap-3">
          <Input
            placeholder="Nome da tarefa"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          />
          <div className="flex flex-wrap gap-2">
            {TASK_ICONS.map((icon) => (
              <button
                key={icon}
                onClick={() => setForm((f) => ({ ...f, icon }))}
                aria-pressed={form.icon === icon}
                className={`inline-flex items-center gap-1.5 rounded-full border-[1.5px] px-3 py-2 text-[13px] ${
                  form.icon === icon
                    ? 'border-teal-500 bg-teal-50 text-teal-ink'
                    : 'border-forest-100 bg-surface text-forest-700'
                }`}
              >
                <span>{icon}</span> {TASK_ICON_LABELS[icon]}
              </button>
            ))}
          </div>
          <div>
            <p className="mb-2 text-xs font-semibold text-forest-500">Responsável</p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setForm((f) => ({ ...f, assignedTo: '', assignedDependentId: '' }))}
                className={`min-h-[32px] rounded-full border-[1.5px] px-3 py-1.5 text-xs ${
                  !form.assignedTo && !form.assignedDependentId
                    ? 'border-teal-500 bg-teal-50 text-teal-ink'
                    : 'border-forest-100 text-forest-700'
                }`}
              >
                Sem responsável
              </button>
              {members.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setForm((f) => ({ ...f, assignedTo: m.id, assignedDependentId: '' }))}
                  className={`min-h-[32px] rounded-full border-[1.5px] px-3 py-1.5 text-xs ${
                    form.assignedTo === m.id ? 'border-teal-500 bg-teal-50 text-teal-ink' : 'border-forest-100 text-forest-700'
                  }`}
                >
                  {m.name.split(' ')[0]}
                </button>
              ))}
              {dependentsList.map((d) => (
                <button
                  key={d.id}
                  onClick={() => setForm((f) => ({ ...f, assignedTo: '', assignedDependentId: d.id }))}
                  className={`min-h-[32px] rounded-full border-[1.5px] px-3 py-1.5 text-xs ${
                    form.assignedDependentId === d.id
                      ? 'border-teal-500 bg-teal-50 text-teal-ink'
                      : 'border-forest-100 text-forest-700'
                  }`}
                >
                  {d.icon} {d.name}
                </button>
              ))}
              {!addingDependent && (
                <button
                  onClick={() => setAddingDependent(true)}
                  className="inline-flex min-h-[32px] items-center gap-1.5 rounded-full border-[1.5px] border-dashed border-forest-300 px-3 py-1.5 text-xs text-forest-500"
                >
                  + Dependente
                </button>
              )}
            </div>
            {addingDependent && (
              <div className="mt-2 flex gap-2">
                <input
                  autoFocus
                  value={newDependentName}
                  onChange={(e) => setNewDependentName(e.target.value)}
                  placeholder="Nome do dependente (ex: Sofia)"
                  className="min-h-[32px] flex-1 rounded-xl border-[1.5px] border-forest-100 px-3 text-sm outline-none focus:border-teal-500"
                />
                <button
                  onClick={handleAddDependent}
                  disabled={!newDependentName.trim()}
                  className="rounded-xl bg-teal-500 px-3 text-sm font-semibold text-white disabled:opacity-50"
                >
                  Ok
                </button>
                <button
                  onClick={() => {
                    setAddingDependent(false)
                    setNewDependentName('')
                  }}
                  aria-label="Cancelar"
                  className="flex size-8 shrink-0 items-center justify-center rounded-full bg-forest-50 text-forest-500"
                >
                  ✕
                </button>
              </div>
            )}
          </div>
          <div>
            <p className="mb-2 text-xs font-semibold text-forest-500">Vencimento (opcional)</p>
            <input
              type="date"
              value={form.dueDate}
              onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))}
              className="min-h-[32px] w-full rounded-xl border-[1.5px] border-forest-100 px-3 text-sm outline-none focus:border-teal-500"
            />
          </div>
          <div>
            <p className="mb-2 text-xs font-semibold text-forest-500">Repetir</p>
            <div className="flex flex-wrap gap-2">
              {RECURRENCE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setForm((f) => ({ ...f, recurrence: opt.value }))}
                  className={`min-h-[32px] rounded-full border-[1.5px] px-3 py-1.5 text-xs ${
                    form.recurrence === opt.value
                      ? 'border-teal-500 bg-teal-50 text-teal-ink'
                      : 'border-forest-100 text-forest-700'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            {form.recurrence === 'custom' && (
              <div className="mt-2 flex flex-wrap gap-2">
                {WEEKDAY_LABELS.map((label, i) => {
                  const value = String(i)
                  const selected = form.recurrenceDays.includes(value)
                  return (
                    <button
                      key={value}
                      onClick={() =>
                        setForm((f) => ({
                          ...f,
                          recurrenceDays: selected
                            ? f.recurrenceDays.filter((d) => d !== value)
                            : [...f.recurrenceDays, value],
                        }))
                      }
                      className={`flex size-9 items-center justify-center rounded-full border-[1.5px] text-xs ${
                        selected ? 'border-teal-500 bg-teal-50 text-teal-ink' : 'border-forest-100 text-forest-700'
                      }`}
                    >
                      {label}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
          <Button loading={saving} disabled={!form.title.trim()} onClick={handleSaveTask}>
            {editingId ? 'Salvar alterações' : 'Adicionar tarefa'}
          </Button>
        </div>
      </Modal>

      <Modal open={actionsTask !== null} onClose={() => setActionsTask(null)} title={actionsTask?.title ?? 'Tarefa'}>
        {actionsTask && (
          <div className="flex flex-col gap-1">
            <button
              onClick={() => openEdit(actionsTask)}
              className="flex min-h-[44px] items-center gap-3 rounded-xl px-2 text-left text-sm font-medium text-forest-900 hover:bg-forest-50"
            >
              ✏️ Editar
            </button>
            <button
              onClick={() => {
                setConfirmId(actionsTask.id)
                setActionsTask(null)
              }}
              className="flex min-h-[44px] items-center gap-3 rounded-xl px-2 text-left text-sm font-medium text-error hover:bg-coral-50"
            >
              🗑 Excluir tarefa
            </button>
          </div>
        )}
      </Modal>

      <ConfirmModal
        open={confirmId !== null}
        title="Excluir tarefa"
        message="Tem certeza que quer excluir essa tarefa?"
        onCancel={() => setConfirmId(null)}
        onConfirm={confirmRemoveTask}
      />

      <Modal open={timeTrackTask !== null} onClose={() => setTimeTrackTask(null)} title="Quanto tempo levou?">
        <div className="flex flex-col gap-3">
          <p className="text-xs text-forest-500">
            Ajuda a entender o tempo real gasto em cada tarefa — não só a quantidade delas.
          </p>
          <div className="flex gap-3">
            <label className="flex flex-1 flex-col gap-1.5 text-xs font-medium text-forest-700">
              Início
              <input
                type="time"
                value={timeForm.start}
                onChange={(e) => setTimeForm((f) => ({ ...f, start: e.target.value }))}
                className="min-h-[32px] rounded-xl border-[1.5px] border-forest-100 px-3 text-sm outline-none focus:border-teal-500"
              />
            </label>
            <label className="flex flex-1 flex-col gap-1.5 text-xs font-medium text-forest-700">
              Fim
              <input
                type="time"
                value={timeForm.end}
                onChange={(e) => setTimeForm((f) => ({ ...f, end: e.target.value }))}
                className="min-h-[32px] rounded-xl border-[1.5px] border-forest-100 px-3 text-sm outline-none focus:border-teal-500"
              />
            </label>
          </div>
          <Button onClick={confirmTimeTrack}>Concluir tarefa</Button>
          <button
            onClick={() => {
              if (timeTrackTask) applyStatus(timeTrackTask, 'done')
              setTimeTrackTask(null)
            }}
            className="flex min-h-[32px] items-center justify-center text-center text-xs font-medium text-forest-500"
          >
            Concluir sem registrar tempo
          </button>
        </div>
      </Modal>

      <BottomNav />
    </Screen>
  )
}

function TaskRow({
  task,
  onToggle,
  onOpenActions,
}: {
  task: Task
  onToggle: () => void
  onOpenActions: () => void
}) {
  const controls = useDragControls()
  return (
    <Reorder.Item
      as="div"
      value={task}
      dragListener={false}
      dragControls={controls}
      style={{ touchAction: 'none' }}
      className="flex items-center gap-3 rounded-sm border-[1.5px] border-forest-100 bg-surface p-3 shadow-xs"
    >
      <DragGrip onPointerDown={(e) => controls.start(e)} />
      <button onClick={onToggle} className="flex flex-1 items-center gap-3 text-left">
        <span
          className={`flex size-6 shrink-0 items-center justify-center rounded-full border-2 text-xs ${
            task.status === 'done' ? 'border-teal-500 bg-teal-500 text-white' : 'border-forest-100'
          }`}
        >
          {task.status === 'done' ? '✓' : ''}
        </span>
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-forest-50 text-base">
          {task.icon}
        </span>
        <span className="min-w-0 flex-1">
          <span
            className={`block truncate text-sm font-medium ${
              task.status === 'done' ? 'text-forest-500 line-through' : 'text-forest-900'
            }`}
          >
            {task.title}
          </span>
          <span className="flex items-center gap-1.5 truncate text-xs text-forest-500">
            {task.assignee_name ? task.assignee_name.split(' ')[0] : 'Sem responsável'}
            {task.due_date && <span className="shrink-0">· {formatLocalDate(task.due_date)}</span>}
            {task.recurrence && (
              <span className="shrink-0" title="Tarefa recorrente">
                🔁
              </span>
            )}
          </span>
        </span>
      </button>
      <button
        onClick={onOpenActions}
        aria-label="Mais opções"
        className="flex size-8 shrink-0 items-center justify-center rounded-full text-forest-500 hover:bg-forest-50"
      >
        ⋮
      </button>
    </Reorder.Item>
  )
}
