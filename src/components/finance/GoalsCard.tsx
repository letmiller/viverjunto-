import { useEffect, useState } from 'react'
import { Reorder, useDragControls } from 'framer-motion'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Modal } from '../ui/Modal'
import { ConfirmModal } from '../ui/ConfirmModal'
import { DragGrip } from '../ui/DragGrip'
import { goals as goalsApi, household as householdApi, type Goal, type Member } from '../../lib/api'
import { formatBRL } from '../../lib/currency'
import { toast, toastError } from '../../store/toast'
import { GOAL_PRESETS, GOAL_ACCENT_CLASSES } from '../../lib/goalPresets'

const GOAL_TONES = ['bg-teal-500', 'bg-coral-700', 'bg-amber-700', 'bg-forest-500']

export function GoalsCard() {
  const [goals, setGoals] = useState<Goal[]>([])
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [addForm, setAddForm] = useState({ title: '', icon: GOAL_PRESETS[0].emoji, targetAmount: '', assignedTo: '' })
  const [saving, setSaving] = useState(false)
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null)
  const [editDraft, setEditDraft] = useState({ target: '', saved: '', assignedTo: '' })
  const [savingEdit, setSavingEdit] = useState(false)
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [quickAddGoal, setQuickAddGoal] = useState<Goal | null>(null)
  const [quickAmount, setQuickAmount] = useState('')
  const [savingQuick, setSavingQuick] = useState(false)
  const [withdrawGoal, setWithdrawGoal] = useState<Goal | null>(null)
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [savingWithdraw, setSavingWithdraw] = useState(false)
  const [actionsGoal, setActionsGoal] = useState<Goal | null>(null)

  function load() {
    Promise.allSettled([
      goalsApi.list().then((r) => setGoals(r.goals)),
      householdApi.members().then((r) => setMembers(r.members)),
    ]).finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [])

  function openAdd() {
    setAddForm({ title: '', icon: GOAL_PRESETS[0].emoji, targetAmount: '', assignedTo: '' })
    setShowAdd(true)
  }

  async function handleAdd() {
    if (!addForm.title.trim()) return
    setSaving(true)
    try {
      await goalsApi.createOne({
        title: addForm.title.trim(),
        icon: addForm.icon,
        targetAmount: addForm.targetAmount.trim() ? Number(addForm.targetAmount) : null,
        assignedTo: addForm.assignedTo || null,
      })
      setShowAdd(false)
      load()
      toast('Plano criado!')
    } catch {
      toastError('Não foi possível criar o plano.')
    } finally {
      setSaving(false)
    }
  }

  function openEdit(goal: Goal) {
    setEditingGoal(goal)
    setEditDraft({
      target: goal.target_amount ? String(goal.target_amount) : '',
      saved: String(goal.saved_amount),
      assignedTo: goal.assigned_to ?? '',
    })
  }

  async function handleSaveEdit() {
    if (!editingGoal) return
    setSavingEdit(true)
    try {
      await goalsApi.update(editingGoal.id, {
        targetAmount: editDraft.target.trim() ? Number(editDraft.target) : null,
        savedAmount: Number(editDraft.saved) || 0,
        assignedTo: editDraft.assignedTo || null,
      })
      setEditingGoal(null)
      load()
      toast('Progresso atualizado!')
    } catch {
      toastError('Não foi possível atualizar o plano.')
    } finally {
      setSavingEdit(false)
    }
  }

  async function handleQuickAdd() {
    if (!quickAddGoal) return
    const amount = Number(quickAmount)
    if (!(amount > 0)) return
    setSavingQuick(true)
    try {
      await goalsApi.update(quickAddGoal.id, { savedAmount: quickAddGoal.saved_amount + amount })
      setQuickAddGoal(null)
      setQuickAmount('')
      load()
      toast('Valor adicionado ao plano!')
    } catch {
      toastError('Não foi possível adicionar o valor.')
    } finally {
      setSavingQuick(false)
    }
  }

  async function handleWithdraw() {
    if (!withdrawGoal) return
    const amount = Number(withdrawAmount)
    if (!(amount > 0)) return
    setSavingWithdraw(true)
    try {
      await goalsApi.update(withdrawGoal.id, { savedAmount: Math.max(0, withdrawGoal.saved_amount - amount) })
      setWithdrawGoal(null)
      setWithdrawAmount('')
      load()
      toast('Valor retirado do plano!')
    } catch {
      toastError('Não foi possível retirar o valor.')
    } finally {
      setSavingWithdraw(false)
    }
  }

  async function handleReorder(reordered: Goal[]) {
    setGoals(reordered)
    try {
      await goalsApi.reorder(reordered.map((g) => g.id))
    } catch {
      toastError('Não foi possível reordenar os planos.')
      load()
    }
  }

  async function confirmRemove() {
    if (!confirmId) return
    const id = confirmId
    setConfirmId(null)
    setEditingGoal(null)
    setGoals((prev) => prev.filter((g) => g.id !== id))
    try {
      await goalsApi.remove(id)
      toast('Plano removido.')
    } catch {
      toastError('Não foi possível remover o plano.')
      load()
    }
  }

  if (loading) return null

  return (
    <Card>
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-forest-900">Planos e metas</p>
        <button onClick={openAdd} className="flex min-h-[32px] items-center text-xs font-medium text-teal-700">
          + Novo plano
        </button>
      </div>

      {goals.length === 0 ? (
        <p className="mt-2 text-xs text-forest-500">
          Nenhum plano ainda. Crie um pra reserva de emergência, viagem ou outro objetivo.
        </p>
      ) : (
        <Reorder.Group as="div" axis="y" values={goals} onReorder={handleReorder} className="mt-3 flex flex-col gap-2.5">
          {goals.map((g, i) => (
            <GoalRow
              key={g.id}
              goal={g}
              tone={GOAL_TONES[i % GOAL_TONES.length]}
              onOpenEdit={() => openEdit(g)}
              onOpenActions={() => setActionsGoal(g)}
            />
          ))}
        </Reorder.Group>
      )}

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Novo plano">
        <div className="flex flex-col gap-3">
          <Input
            placeholder="Nome do plano (ex: Reserva de emergência)"
            value={addForm.title}
            onChange={(e) => setAddForm((f) => ({ ...f, title: e.target.value }))}
          />
          <div>
            <p className="mb-2 text-xs font-semibold text-forest-500">Ícone</p>
            <div className="flex flex-wrap gap-2">
              {GOAL_PRESETS.map((preset) => {
                const active = addForm.icon === preset.emoji
                return (
                  <button
                    key={preset.id}
                    onClick={() => setAddForm((f) => ({ ...f, icon: preset.emoji }))}
                    aria-pressed={active}
                    className={`flex shrink-0 items-center gap-2 rounded-full border-[1.5px] bg-white py-2 pl-2 pr-4 text-[13px] transition-colors ${
                      active
                        ? GOAL_ACCENT_CLASSES[preset.accent]
                        : 'border-forest-100 shadow-[0px_2px_3px_0px_rgba(46,58,55,0.04)]'
                    } ${active ? 'font-bold text-forest-900' : 'font-normal text-forest-700'}`}
                  >
                    <img src={preset.icon} alt="" className="size-8 shrink-0" />
                    {preset.title}
                  </button>
                )
              })}
            </div>
          </div>
          <div>
            <p className="mb-2 text-xs font-semibold text-forest-500">De quem é esse plano?</p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setAddForm((f) => ({ ...f, assignedTo: '' }))}
                className={`min-h-[32px] rounded-full border-[1.5px] px-3 py-1.5 text-xs ${
                  !addForm.assignedTo ? 'border-teal-500 bg-teal-50 text-teal-ink' : 'border-forest-100 text-forest-700'
                }`}
              >
                Juntos
              </button>
              {members.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setAddForm((f) => ({ ...f, assignedTo: m.id }))}
                  className={`min-h-[32px] rounded-full border-[1.5px] px-3 py-1.5 text-xs ${
                    addForm.assignedTo === m.id ? 'border-teal-500 bg-teal-50 text-teal-ink' : 'border-forest-100 text-forest-700'
                  }`}
                >
                  {m.name.split(' ')[0]}
                </button>
              ))}
            </div>
          </div>
          <Input
            type="number"
            min="0"
            placeholder="Meta de valor (R$) — opcional"
            value={addForm.targetAmount}
            onChange={(e) => setAddForm((f) => ({ ...f, targetAmount: e.target.value }))}
          />
          <Button loading={saving} disabled={!addForm.title.trim()} onClick={handleAdd}>
            Criar plano
          </Button>
        </div>
      </Modal>

      <Modal open={editingGoal !== null} onClose={() => setEditingGoal(null)} title={editingGoal?.title ?? 'Plano'}>
        <div className="flex flex-col gap-3">
          <div>
            <p className="mb-2 text-xs font-semibold text-forest-500">De quem é esse plano?</p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setEditDraft((d) => ({ ...d, assignedTo: '' }))}
                className={`min-h-[32px] rounded-full border-[1.5px] px-3 py-1.5 text-xs ${
                  !editDraft.assignedTo ? 'border-teal-500 bg-teal-50 text-teal-ink' : 'border-forest-100 text-forest-700'
                }`}
              >
                Juntos
              </button>
              {members.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setEditDraft((d) => ({ ...d, assignedTo: m.id }))}
                  className={`min-h-[32px] rounded-full border-[1.5px] px-3 py-1.5 text-xs ${
                    editDraft.assignedTo === m.id ? 'border-teal-500 bg-teal-50 text-teal-ink' : 'border-forest-100 text-forest-700'
                  }`}
                >
                  {m.name.split(' ')[0]}
                </button>
              ))}
            </div>
          </div>
          <label className="flex flex-col gap-1.5 text-xs font-medium text-forest-700">
            Valor da meta (R$)
            <input
              type="number"
              min="0"
              value={editDraft.target}
              onChange={(e) => setEditDraft((d) => ({ ...d, target: e.target.value }))}
              className="min-h-[32px] rounded-xl border-[1.5px] border-forest-100 px-3 text-sm outline-none focus:border-teal-500"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-xs font-medium text-forest-700">
            Quanto já guardaram (R$)
            <input
              type="number"
              min="0"
              value={editDraft.saved}
              onChange={(e) => setEditDraft((d) => ({ ...d, saved: e.target.value }))}
              className="min-h-[32px] rounded-xl border-[1.5px] border-forest-100 px-3 text-sm outline-none focus:border-teal-500"
            />
          </label>
          <Button loading={savingEdit} onClick={handleSaveEdit}>
            Salvar
          </Button>
          {editingGoal && (
            <button
              onClick={() => setConfirmId(editingGoal.id)}
              className="flex min-h-[32px] items-center justify-center text-center text-sm font-medium text-error"
            >
              Excluir plano
            </button>
          )}
        </div>
      </Modal>

      <Modal open={quickAddGoal !== null} onClose={() => setQuickAddGoal(null)} title="Guardar para o plano">
        <div className="flex flex-col gap-3">
          <p className="text-xs text-forest-500">
            {quickAddGoal?.title} · já guardado: R$ {quickAddGoal ? formatBRL(quickAddGoal.saved_amount) : '0'}
          </p>
          <Input
            type="number"
            min="0.01"
            step="0.01"
            placeholder="Valor a adicionar (R$)"
            value={quickAmount}
            onChange={(e) => setQuickAmount(e.target.value)}
          />
          <Button loading={savingQuick} disabled={!(Number(quickAmount) > 0)} onClick={handleQuickAdd}>
            Adicionar
          </Button>
        </div>
      </Modal>

      <Modal open={actionsGoal !== null} onClose={() => setActionsGoal(null)} title={actionsGoal?.title ?? 'Plano'}>
        {actionsGoal && (
          <div className="flex flex-col gap-1">
            <button
              onClick={() => openEdit(actionsGoal)}
              className="flex min-h-[44px] items-center gap-3 rounded-xl px-2 text-left text-sm font-medium text-forest-900 hover:bg-forest-50"
            >
              ✏️ Editar
            </button>
            <button
              onClick={() => {
                setQuickAddGoal(actionsGoal)
                setQuickAmount('')
                setActionsGoal(null)
              }}
              className="flex min-h-[44px] items-center gap-3 rounded-xl px-2 text-left text-sm font-medium text-forest-900 hover:bg-forest-50"
            >
              💰 Guardar dinheiro
            </button>
            {actionsGoal.saved_amount > 0 && (
              <button
                onClick={() => {
                  setWithdrawGoal(actionsGoal)
                  setWithdrawAmount('')
                  setActionsGoal(null)
                }}
                className="flex min-h-[44px] items-center gap-3 rounded-xl px-2 text-left text-sm font-medium text-forest-900 hover:bg-forest-50"
              >
                📤 Retirar dinheiro
              </button>
            )}
            <button
              onClick={() => {
                setConfirmId(actionsGoal.id)
                setActionsGoal(null)
              }}
              className="flex min-h-[44px] items-center gap-3 rounded-xl px-2 text-left text-sm font-medium text-error hover:bg-coral-50"
            >
              🗑 Excluir plano
            </button>
          </div>
        )}
      </Modal>

      <Modal open={withdrawGoal !== null} onClose={() => setWithdrawGoal(null)} title="Retirar dinheiro do plano">
        <div className="flex flex-col gap-3">
          <p className="text-xs text-forest-500">
            {withdrawGoal?.title} · guardado: R$ {withdrawGoal ? formatBRL(withdrawGoal.saved_amount) : '0'}
          </p>
          <Input
            type="number"
            min="0.01"
            step="0.01"
            max={withdrawGoal?.saved_amount}
            placeholder="Valor a retirar (R$)"
            value={withdrawAmount}
            onChange={(e) => setWithdrawAmount(e.target.value)}
          />
          <Button
            loading={savingWithdraw}
            disabled={!(Number(withdrawAmount) > 0) || (withdrawGoal ? Number(withdrawAmount) > withdrawGoal.saved_amount : false)}
            onClick={handleWithdraw}
          >
            Retirar
          </Button>
        </div>
      </Modal>

      <ConfirmModal
        open={confirmId !== null}
        title="Excluir plano"
        message="Tem certeza que quer excluir esse plano?"
        onCancel={() => setConfirmId(null)}
        onConfirm={confirmRemove}
      />
    </Card>
  )
}

function GoalRow({
  goal,
  tone,
  onOpenEdit,
  onOpenActions,
}: {
  goal: Goal
  tone: string
  onOpenEdit: () => void
  onOpenActions: () => void
}) {
  const controls = useDragControls()
  const pct = goal.target_amount ? Math.min((goal.saved_amount / goal.target_amount) * 100, 100) : null
  return (
    <Reorder.Item
      as="div"
      value={goal}
      dragListener={false}
      dragControls={controls}
      style={{ touchAction: 'none' }}
      className="flex items-stretch gap-2 overflow-hidden rounded-sm border-[1.5px] border-forest-100 bg-surface"
    >
      <span className={`w-1 shrink-0 ${tone}`} />
      <div className="flex min-w-0 flex-1 flex-col gap-1.5 py-2.5 pr-2.5">
        <div className="flex items-center justify-between gap-2">
          <DragGrip onPointerDown={(e) => controls.start(e)} />
          <button onClick={onOpenEdit} className="flex min-w-0 flex-1 items-center gap-1.5 text-left">
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-forest-900">
              {goal.icon} {goal.title}
            </span>
          </button>
          <div className="flex shrink-0 items-center gap-1">
            <button
              onClick={onOpenActions}
              aria-label="Mais opções"
              className="flex size-8 shrink-0 items-center justify-center rounded-full text-forest-500 hover:bg-forest-50"
            >
              ⋮
            </button>
          </div>
        </div>
        <button onClick={onOpenEdit} className="flex flex-col gap-1.5 text-left">
          {pct !== null ? (
            <>
              <div className="h-1.5 overflow-hidden rounded-full bg-forest-100">
                <div className={`h-full rounded-full ${tone}`} style={{ width: `${pct}%` }} />
              </div>
              <span className="text-xs text-forest-500">
                R$ {formatBRL(goal.saved_amount)} de R$ {formatBRL(goal.target_amount!)} · faltam R${' '}
                {formatBRL(Math.max(0, goal.target_amount! - goal.saved_amount))}
              </span>
            </>
          ) : (
            <span className="text-xs text-teal-700">Toque para definir uma meta de valor →</span>
          )}
        </button>
      </div>
    </Reorder.Item>
  )
}
