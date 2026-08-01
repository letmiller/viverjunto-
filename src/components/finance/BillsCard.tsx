import { useEffect, useState } from 'react'
import { Reorder, useDragControls } from 'framer-motion'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Modal } from '../ui/Modal'
import { ConfirmModal } from '../ui/ConfirmModal'
import { CategoryPicker } from '../ui/CategoryPicker'
import { DragGrip } from '../ui/DragGrip'
import {
  bills as billsApi,
  household as householdApi,
  accounts as accountsApi,
  ApiError,
  type Bill,
  type Member,
  type FinancialAccount,
} from '../../lib/api'
import { localDateString } from '../../lib/date'
import { formatBRL } from '../../lib/currency'
import { waLink } from '../../lib/whatsapp'
import { EXPENSE_CATEGORY_PRESETS, categoryIcon } from '../../lib/categories'
import { toast, toastError } from '../../store/toast'
import { useSession } from '../../store/session'

const RECURRENCE_OPTIONS = [
  { value: '', label: 'Não repete' },
  { value: 'monthly', label: 'Todo mês' },
  { value: 'weekly', label: 'Toda semana' },
]

interface BillStatus {
  label: string
  icon: string
  bg: string
  text: string
}

function billStatus(bill: Bill): BillStatus {
  const today = localDateString()
  if (bill.paid_amount >= bill.amount) return { label: 'Pago', icon: '✓', bg: 'bg-teal-100', text: 'text-teal-ink' }
  if (bill.paid_amount > 0) return { label: 'Parcial', icon: '↗', bg: 'bg-amber-100', text: 'text-amber-700' }
  if (bill.due_date < today) return { label: 'Atrasada', icon: '!', bg: 'bg-coral-100', text: 'text-error' }
  if (bill.due_date === today) return { label: 'Hoje', icon: '!', bg: 'bg-coral-100', text: 'text-error' }
  return { label: 'Futuro', icon: '○', bg: 'bg-forest-100', text: 'text-forest-500' }
}

function daysUntil(dueDate: string): number {
  const today = localDateString()
  return Math.round((new Date(dueDate + 'T00:00:00').getTime() - new Date(today + 'T00:00:00').getTime()) / 86400000)
}

function dueLabel(dueDate: string): string {
  const diffDays = daysUntil(dueDate)
  if (diffDays < 0) return `Venceu há ${-diffDays}d`
  if (diffDays === 0) return 'Vence hoje'
  if (diffDays === 1) return 'Vence amanhã'
  return `Vence dia ${new Date(dueDate + 'T00:00:00').getDate()}`
}

// Recurring bills auto-clone their next occurrence as soon as the current one
// is paid (so it's never forgotten), but that clone is often a month out —
// showing it right away in "Contas a pagar" reads as "you still owe this."
// Only surface a bill here once it's close (or overdue); it still exists in
// the backend and will show up on its own once it crosses this window.
const DUE_SOON_DAYS = 7
function isDueSoon(dueDate: string): boolean {
  return daysUntil(dueDate) <= DUE_SOON_DAYS
}

export function BillsCard() {
  const user = useSession((s) => s.user)
  const [bills, setBills] = useState<Bill[]>([])
  const [members, setMembers] = useState<Member[]>([])
  const [accountsList, setAccountsList] = useState<FinancialAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({
    title: '',
    amount: '',
    dueDate: localDateString(),
    recurrence: '',
    assignedTo: '',
    accountId: '',
    reminderDays: '1',
    category: EXPENSE_CATEGORY_PRESETS.find((c) => c.label === 'Contas')?.label ?? EXPENSE_CATEGORY_PRESETS[0].label,
    installmentTotal: '',
  })
  const [saving, setSaving] = useState(false)
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [payingBill, setPayingBill] = useState<Bill | null>(null)
  const [payAmount, setPayAmount] = useState('')
  const [paying, setPaying] = useState(false)
  const [actionsBill, setActionsBill] = useState<Bill | null>(null)

  function load() {
    Promise.allSettled([
      billsApi.list().then((r) => setBills(r.bills)),
      householdApi.members().then((r) => setMembers(r.members)),
      accountsApi.list().then((r) => setAccountsList(r.accounts)),
    ]).finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [])

  function openAdd() {
    setEditingId(null)
    setForm({
      title: '',
      amount: '',
      dueDate: localDateString(),
      recurrence: '',
      assignedTo: '',
      accountId: '',
      reminderDays: '1',
      category: EXPENSE_CATEGORY_PRESETS.find((c) => c.label === 'Contas')?.label ?? EXPENSE_CATEGORY_PRESETS[0].label,
      installmentTotal: '',
    })
    setShowAdd(true)
  }

  function openEdit(bill: Bill) {
    setActionsBill(null)
    setEditingId(bill.id)
    setForm({
      title: bill.title,
      amount: String(bill.amount),
      dueDate: bill.due_date,
      recurrence: bill.recurrence ?? '',
      assignedTo: bill.assigned_to ?? '',
      accountId: bill.account_id ?? '',
      reminderDays: bill.reminder_days !== null ? String(bill.reminder_days) : '1',
      category: bill.category ?? EXPENSE_CATEGORY_PRESETS.find((c) => c.label === 'Contas')?.label ?? EXPENSE_CATEGORY_PRESETS[0].label,
      installmentTotal: bill.installment_total !== null ? String(bill.installment_total) : '',
    })
    setShowAdd(true)
  }

  async function handleAdd() {
    const amount = Number(form.amount)
    if (!form.title.trim() || !(amount > 0) || !form.dueDate) return
    setSaving(true)
    try {
      const data = {
        title: form.title.trim(),
        amount,
        dueDate: form.dueDate,
        recurrence: form.recurrence || null,
        assignedTo: form.assignedTo || null,
        accountId: form.accountId || null,
        reminderDays: form.reminderDays.trim() ? Number(form.reminderDays) : null,
        category: form.category || null,
        installmentTotal: form.recurrence && form.installmentTotal.trim() ? Number(form.installmentTotal) : null,
      }
      if (editingId) {
        await billsApi.update(editingId, data)
        toast('Conta atualizada!')
      } else {
        await billsApi.create(data)
        toast('Conta adicionada!')
      }
      setShowAdd(false)
      setEditingId(null)
      load()
    } catch (err) {
      const fallback = editingId ? 'Não foi possível atualizar a conta.' : 'Não foi possível adicionar a conta.'
      toastError(err instanceof ApiError ? err.message : fallback)
    } finally {
      setSaving(false)
    }
  }

  async function handleMarkPaid(bill: Bill) {
    setActionsBill(null)
    setBills((prev) => prev.filter((b) => b.id !== bill.id))
    try {
      await billsApi.markPaid(bill.id, true)
      toast('Conta marcada como paga!')
      load()
    } catch {
      toastError('Não foi possível atualizar a conta.')
      load()
    }
  }

  function openPayPartial(bill: Bill) {
    setActionsBill(null)
    setPayingBill(bill)
    setPayAmount(bill.paid_amount > 0 ? String(bill.paid_amount) : '')
  }

  async function confirmPayPartial() {
    if (!payingBill) return
    const amount = Number(payAmount)
    if (!(amount >= 0)) return
    setPaying(true)
    try {
      await billsApi.recordPayment(payingBill.id, amount)
      toast(amount >= payingBill.amount ? 'Conta marcada como paga!' : 'Pagamento parcial registrado.')
      setPayingBill(null)
      load()
    } catch {
      toastError('Não foi possível registrar o pagamento.')
    } finally {
      setPaying(false)
    }
  }

  async function confirmRemove() {
    if (!confirmId) return
    const id = confirmId
    setConfirmId(null)
    setBills((prev) => prev.filter((b) => b.id !== id))
    try {
      await billsApi.remove(id)
      toast('Conta removida.')
    } catch {
      toastError('Não foi possível remover a conta.')
      load()
    }
  }

  const partner = members.find((m) => m.id !== user?.id)
  const unpaid = bills.filter((b) => !b.paid && isDueSoon(b.due_date))

  async function handleReorder(reordered: Bill[]) {
    const reorderedIds = new Set(reordered.map((b) => b.id))
    setBills((prev) => [...reordered, ...prev.filter((b) => !reorderedIds.has(b.id))])
    try {
      await billsApi.reorder(reordered.map((b) => b.id))
    } catch {
      toastError('Não foi possível reordenar as contas.')
      load()
    }
  }

  const header = (
    <div className="flex items-center justify-between">
      <p className="text-sm font-semibold text-forest-900">Contas a pagar</p>
      <button onClick={openAdd} className="flex min-h-[32px] items-center text-xs font-medium text-teal-700">
        + Nova conta
      </button>
    </div>
  )

  const addModal = (
    <Modal
      open={showAdd}
      onClose={() => {
        setShowAdd(false)
        setEditingId(null)
      }}
      title={editingId ? 'Editar conta' : 'Nova conta'}
    >
      <BillForm
        form={form}
        setForm={setForm}
        members={members}
        accountsList={accountsList}
        saving={saving}
        editing={!!editingId}
        onSave={handleAdd}
      />
    </Modal>
  )

  if (loading || unpaid.length === 0) {
    if (loading) return null
    return (
      <Card>
        {header}
        <p className="mt-2 text-xs text-forest-500">Nenhuma conta pendente. Toque em "+ Nova conta" pra adicionar.</p>
        {addModal}
      </Card>
    )
  }

  return (
    <Card>
      {header}

      <Reorder.Group as="div" axis="y" values={unpaid} onReorder={handleReorder} className="mt-3 flex flex-col gap-2">
        {unpaid.map((bill) => (
          <BillRow key={bill.id} bill={bill} onOpenActions={() => setActionsBill(bill)} />
        ))}
      </Reorder.Group>

      {addModal}

      <Modal open={actionsBill !== null} onClose={() => setActionsBill(null)} title={actionsBill?.title ?? 'Conta'}>
        {actionsBill && (
          <div className="flex flex-col gap-1">
            <a
              href={waLink(
                `Ei, a conta "${actionsBill.title}" de R$ ${formatBRL(actionsBill.amount)} ${dueLabel(actionsBill.due_date).toLowerCase()}!`,
                partner?.whatsapp_number,
              )}
              target="_blank"
              rel="noreferrer"
              onClick={() => setActionsBill(null)}
              className="flex min-h-[44px] items-center gap-3 rounded-xl px-2 text-sm font-medium text-forest-900 hover:bg-forest-50"
            >
              📱 Avisar no WhatsApp
            </a>
            <button
              onClick={() => openPayPartial(actionsBill)}
              className="flex min-h-[44px] items-center gap-3 rounded-xl px-2 text-left text-sm font-medium text-forest-900 hover:bg-forest-50"
            >
              💰 Registrar pagamento
            </button>
            <button
              onClick={() => handleMarkPaid(actionsBill)}
              className="flex min-h-[44px] items-center gap-3 rounded-xl px-2 text-left text-sm font-medium text-forest-900 hover:bg-forest-50"
            >
              ✅ Marcar como paga
            </button>
            <button
              onClick={() => openEdit(actionsBill)}
              className="flex min-h-[44px] items-center gap-3 rounded-xl px-2 text-left text-sm font-medium text-forest-900 hover:bg-forest-50"
            >
              ✏️ Editar
            </button>
            <button
              onClick={() => {
                setConfirmId(actionsBill.id)
                setActionsBill(null)
              }}
              className="flex min-h-[44px] items-center gap-3 rounded-xl px-2 text-left text-sm font-medium text-error hover:bg-coral-50"
            >
              🗑 Excluir conta
            </button>
          </div>
        )}
      </Modal>

      <Modal open={payingBill !== null} onClose={() => setPayingBill(null)} title="Registrar pagamento">
        <div className="flex flex-col gap-3">
          <p className="text-xs text-forest-500">
            Total da conta: R$ {payingBill ? formatBRL(payingBill.amount) : '0'}
          </p>
          <Input
            type="number"
            min="0"
            step="0.01"
            placeholder="Valor pago até agora (R$)"
            value={payAmount}
            onChange={(e) => setPayAmount(e.target.value)}
          />
          <Button loading={paying} disabled={!(Number(payAmount) >= 0)} onClick={confirmPayPartial}>
            Salvar
          </Button>
        </div>
      </Modal>

      <ConfirmModal
        open={confirmId !== null}
        title="Excluir conta"
        message="Tem certeza que quer excluir essa conta?"
        onCancel={() => setConfirmId(null)}
        onConfirm={confirmRemove}
      />
    </Card>
  )
}

function BillRow({ bill, onOpenActions }: { bill: Bill; onOpenActions: () => void }) {
  const controls = useDragControls()
  const status = billStatus(bill)
  return (
    <Reorder.Item
      as="div"
      value={bill}
      dragListener={false}
      dragControls={controls}
      style={{ touchAction: 'none' }}
      className="flex items-center gap-3 rounded-sm border border-forest-100 bg-surface p-2.5"
    >
      <DragGrip onPointerDown={(e) => controls.start(e)} />
      <span className={`flex size-8 shrink-0 items-center justify-center rounded-full text-sm ${status.bg}`}>
        {categoryIcon(bill.category ?? 'Contas')}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <p className="truncate text-xs font-medium text-forest-900">
            {bill.title}
            {bill.recurrence && (
              <span title={bill.installment_total ? 'Conta parcelada' : 'Conta recorrente'}>
                {' '}
                · 🔁{bill.installment_total ? ` ${bill.installment_number}/${bill.installment_total}` : ''}
              </span>
            )}
          </p>
          <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${status.bg} ${status.text}`}>
            {status.icon} {status.label}
          </span>
        </div>
        <p className="truncate text-xs text-forest-500">
          R$ {formatBRL(bill.amount)} · {dueLabel(bill.due_date)} ·{' '}
          {bill.assignee_name ? bill.assignee_name.split(' ')[0] : 'Juntos'}
          {bill.account_name && ` · ${bill.account_name}`}
        </p>
      </div>
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

interface BillFormState {
  title: string
  amount: string
  dueDate: string
  recurrence: string
  assignedTo: string
  accountId: string
  reminderDays: string
  category: string
  installmentTotal: string
}

function BillForm({
  form,
  setForm,
  members,
  accountsList,
  saving,
  editing,
  onSave,
}: {
  form: BillFormState
  setForm: (updater: (f: BillFormState) => BillFormState) => void
  members: Member[]
  accountsList: FinancialAccount[]
  saving: boolean
  editing: boolean
  onSave: () => void
}) {
  return (
    <div className="flex flex-col gap-3">
      <Input
        placeholder="Nome da conta (ex: Internet)"
        value={form.title}
        onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
      />
      <Input
        type="number"
        min="0.01"
        step="0.01"
        placeholder="Valor (R$)"
        value={form.amount}
        onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
      />
      <Input
        type="date"
        value={form.dueDate}
        onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))}
      />
      <div>
        <p className="mb-2 text-xs font-semibold text-forest-500">Responsável</p>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setForm((f) => ({ ...f, assignedTo: '' }))}
            className={`min-h-[32px] rounded-full border-[1.5px] px-3 py-1.5 text-xs ${
              !form.assignedTo ? 'border-teal-500 bg-teal-50 text-teal-ink' : 'border-forest-100 text-forest-700'
            }`}
          >
            Juntos
          </button>
          {members.map((m) => (
            <button
              key={m.id}
              onClick={() => setForm((f) => ({ ...f, assignedTo: m.id }))}
              className={`min-h-[32px] rounded-full border-[1.5px] px-3 py-1.5 text-xs ${
                form.assignedTo === m.id ? 'border-teal-500 bg-teal-50 text-teal-ink' : 'border-forest-100 text-forest-700'
              }`}
            >
              {m.name.split(' ')[0]}
            </button>
          ))}
        </div>
      </div>
      {accountsList.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-semibold text-forest-500">Sai de qual conta? (opcional)</p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setForm((f) => ({ ...f, accountId: '' }))}
              className={`min-h-[32px] rounded-full border-[1.5px] px-3 py-1.5 text-xs ${
                !form.accountId ? 'border-teal-500 bg-teal-50 text-teal-ink' : 'border-forest-100 text-forest-700'
              }`}
            >
              Nenhuma
            </button>
            {accountsList.map((a) => (
              <button
                key={a.id}
                onClick={() => setForm((f) => ({ ...f, accountId: a.id }))}
                className={`min-h-[32px] rounded-full border-[1.5px] px-3 py-1.5 text-xs ${
                  form.accountId === a.id ? 'border-teal-500 bg-teal-50 text-teal-ink' : 'border-forest-100 text-forest-700'
                }`}
              >
                {a.name}
              </button>
            ))}
          </div>
          <p className="mt-1.5 text-xs text-forest-500">Quando a conta for paga, o valor é descontado dessa conta.</p>
        </div>
      )}
      <div>
        <p className="mb-2 text-xs font-semibold text-forest-500">Categoria</p>
        <p className="mb-2 text-xs text-forest-500">Pra aparecer em "Onde está indo o dinheiro" quando for paga.</p>
        <CategoryPicker
          presets={EXPENSE_CATEGORY_PRESETS}
          value={form.category}
          onChange={(label) => setForm((f) => ({ ...f, category: label }))}
        />
      </div>
      <div>
        <p className="mb-2 text-xs font-semibold text-forest-500">Aviso de vencimento</p>
        <p className="mb-2 text-xs text-forest-500">Com quantos dias de antecedência avisar por email.</p>
        <input
          type="number"
          min="0"
          max="30"
          step="1"
          placeholder="1"
          value={form.reminderDays}
          onChange={(e) => setForm((f) => ({ ...f, reminderDays: e.target.value }))}
          className="min-h-[32px] w-24 rounded-lg border-[1.5px] border-forest-100 px-2 text-sm outline-none focus:border-teal-500"
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
                form.recurrence === opt.value ? 'border-teal-500 bg-teal-50 text-teal-ink' : 'border-forest-100 text-forest-700'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        {form.recurrence && (
          <div className="mt-3">
            <p className="mb-2 text-xs font-semibold text-forest-500">Número de parcelas (opcional)</p>
            <p className="mb-2 text-xs text-forest-500">
              Deixe em branco pra contas que se repetem sempre (aluguel, assinatura), ou preencha pra parcelamentos
              (ex: 12x).
            </p>
            <input
              type="number"
              min="2"
              step="1"
              placeholder="Ex: 12"
              value={form.installmentTotal}
              onChange={(e) => setForm((f) => ({ ...f, installmentTotal: e.target.value }))}
              className="min-h-[32px] w-24 rounded-lg border-[1.5px] border-forest-100 bg-surface px-2 text-sm outline-none focus:border-teal-500"
            />
          </div>
        )}
      </div>
      <Button loading={saving} disabled={!form.title.trim() || !(Number(form.amount) > 0)} onClick={onSave}>
        {editing ? 'Salvar alterações' : 'Salvar conta'}
      </Button>
    </div>
  )
}
