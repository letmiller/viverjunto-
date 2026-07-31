import { lazy, Suspense, useEffect, useState } from 'react'
import { Reorder, useDragControls } from 'framer-motion'
import { useLocation, useNavigate } from 'react-router-dom'
import { Screen } from '../components/layout/Screen'
import { Header } from '../components/layout/Header'
import { AuraBackground } from '../components/ui/AuraBackground'
import { Card } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { Button } from '../components/ui/Button'
import { Fab } from '../components/ui/Fab'
import { Modal } from '../components/ui/Modal'
import { ConfirmModal } from '../components/ui/ConfirmModal'
import { CategoryPicker, type CategoryOption } from '../components/ui/CategoryPicker'
import { DragGrip } from '../components/ui/DragGrip'
import { BottomNav } from '../components/layout/BottomNav'
import { BillsCard } from '../components/finance/BillsCard'
import { GoalsCard } from '../components/finance/GoalsCard'
import { formatBRL } from '../lib/currency'
import {
  analytics,
  transactions,
  budgets as budgetsApi,
  accounts as accountsApi,
  settlements as settlementsApi,
  bills as billsApi,
  household,
  type WeeklyAnalytics,
  type MonthlyAnalytics,
  type Transaction,
  type Budget,
  type MonthComparison,
  type FinancialSettings,
  type FinancialAccount,
  type Settlement,
  type Member,
  type Bill,
} from '../lib/api'
import { localDateString, formatLocalDate } from '../lib/date'
import { EXPENSE_CATEGORY_PRESETS, INCOME_CATEGORY_PRESETS, categoryIcon } from '../lib/categories'
import { toast, toastError } from '../store/toast'
import { useSession } from '../store/session'

const AnalyticsChart = lazy(() => import('../components/finance/AnalyticsChart'))

const WEEKDAY_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const CATEGORY_COLORS = ['bg-teal-500', 'bg-coral-700', 'bg-amber-700', 'bg-forest-500', 'bg-teal-700', 'bg-coral-500']
const CATEGORY_ICON_BG = ['bg-teal-50', 'bg-coral-100', 'bg-amber-100', 'bg-forest-50', 'bg-teal-100', 'bg-coral-50']
const PAYMENT_METHODS = [
  { value: 'dinheiro', label: 'Dinheiro' },
  { value: 'debito', label: 'Débito' },
  { value: 'credito', label: 'Crédito' },
  { value: 'pix', label: 'Pix' },
]
const RECURRENCE_OPTIONS = [
  { value: '', label: 'Não repete' },
  { value: 'weekly', label: 'Toda semana' },
  { value: 'monthly', label: 'Todo mês' },
]
const ACCOUNT_TYPES = [
  { value: 'corrente', label: 'Conta corrente' },
  { value: 'poupanca', label: 'Poupança' },
  { value: 'carteira', label: 'Carteira' },
  { value: 'credito', label: 'Cartão de crédito' },
]

function categoryIconFor(label: string) {
  return (
    EXPENSE_CATEGORY_PRESETS.find((c) => c.label === label)?.icon ??
    INCOME_CATEGORY_PRESETS.find((c) => c.label === label)?.icon ??
    '🏷️'
  )
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

export function SharedFinancesPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const currentUser = useSession((s) => s.user)
  const [tab, setTab] = useState<'semana' | 'mes'>('semana')
  const [weekly, setWeekly] = useState<WeeklyAnalytics | null>(null)
  const [monthly, setMonthly] = useState<MonthlyAnalytics | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    category: EXPENSE_CATEGORY_PRESETS[0].label,
    amount: '',
    type: 'expense' as 'income' | 'expense',
    date: localDateString(),
    description: '',
    paymentMethod: '',
    recurrence: '',
    accountId: '',
    paidBy: '',
  })
  const [accountsList, setAccountsList] = useState<FinancialAccount[]>([])
  const [addingAccount, setAddingAccount] = useState(false)
  const [newAccountName, setNewAccountName] = useState('')
  const [newAccountType, setNewAccountType] = useState(ACCOUNT_TYPES[0].value)
  const [newAccountBalance, setNewAccountBalance] = useState('')
  const [savingAccount, setSavingAccount] = useState(false)
  const [showAccountModal, setShowAccountModal] = useState(false)
  const [confirmAccountId, setConfirmAccountId] = useState<string | null>(null)
  const [actionsAccount, setActionsAccount] = useState<FinancialAccount | null>(null)
  const [editingAccount, setEditingAccount] = useState<FinancialAccount | null>(null)
  const [editAccountDraft, setEditAccountDraft] = useState({ name: '', type: ACCOUNT_TYPES[0].value, balance: '' })
  const [savingAccountEdit, setSavingAccountEdit] = useState(false)
  const [members, setMembers] = useState<Member[]>([])
  const [contributionDraft, setContributionDraft] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [recent, setRecent] = useState<Transaction[]>([])
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [budgetList, setBudgetList] = useState<Budget[]>([])
  const [comparison, setComparison] = useState<MonthComparison | null>(null)
  const [showBudgets, setShowBudgets] = useState(false)
  const [budgetDraft, setBudgetDraft] = useState<Record<string, string>>({})
  const [incomeTargetDraft, setIncomeTargetDraft] = useState('')
  const [savingBudgets, setSavingBudgets] = useState(false)
  const [budgetItemsDraft, setBudgetItemsDraft] = useState<Record<string, { label: string; value: string }[]>>({})
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null)
  const [newItemLabel, setNewItemLabel] = useState('')
  const [newItemValue, setNewItemValue] = useState('')
  const [customBudgetCategories, setCustomBudgetCategories] = useState<string[]>([])
  const [addingBudgetCategory, setAddingBudgetCategory] = useState(false)
  const [newBudgetCategoryName, setNewBudgetCategoryName] = useState('')
  const [loading, setLoading] = useState(true)
  const [categoryFilter, setCategoryFilter] = useState('')
  const [personFilter, setPersonFilter] = useState('')
  const [financialSettings, setFinancialSettings] = useState<FinancialSettings | null>(null)
  const [settledRecords, setSettledRecords] = useState<Settlement[]>([])
  const [settlingId, setSettlingId] = useState<string | null>(null)
  const [billsList, setBillsList] = useState<Bill[]>([])

  async function load() {
    const [w, m, t, b, c, fs, ac, st, mem, bl] = await Promise.all([
      analytics.weekly().catch(() => null),
      analytics.monthly().catch(() => null),
      transactions.list().catch(() => ({ transactions: [] })),
      budgetsApi.list().catch(() => ({ budgets: [] })),
      analytics.comparison().catch(() => null),
      household.getFinancialSettings().catch(() => ({ settings: null })),
      accountsApi.list().catch(() => ({ accounts: [] })),
      settlementsApi.list().catch(() => ({ settlements: [] })),
      household.members().catch(() => ({ members: [] })),
      billsApi.list().catch(() => ({ bills: [] })),
    ])
    setWeekly(w)
    setMonthly(m)
    setRecent(t.transactions)
    setBudgetList(b.budgets)
    setComparison(c)
    setFinancialSettings(fs.settings)
    setAccountsList(ac.accounts)
    setSettledRecords(st.settlements)
    setMembers(mem.members)
    setBillsList(bl.bills)
  }

  async function confirmRemoveTransaction() {
    if (!confirmId) return
    const id = confirmId
    setConfirmId(null)
    setRecent((prev) => prev.filter((t) => t.id !== id))
    try {
      await transactions.remove(id)
      toast('Lançamento excluído.')
      load()
    } catch {
      toastError('Não foi possível excluir o lançamento.')
      load()
    }
  }

  useEffect(() => {
    load().finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    const state = location.state as { openAdd?: string } | null
    if (state?.openAdd === 'transaction') {
      openForm()
      navigate(location.pathname, { replace: true, state: null })
    }
  }, [location])

  const skeleton = last7Days()
  const weekChartData = skeleton.map(({ date, label }) => {
    const found = weekly?.days.find((d) => d.date === date)
    return { label, entradas: found?.entradas ?? 0, saidas: found?.saidas ?? 0 }
  })
  const monthChartData = (monthly?.weeks ?? []).map((w, i) => ({
    label: `Sem ${i + 1}`,
    entradas: w.entradas,
    saidas: w.saidas,
  }))

  const chartData = tab === 'semana' ? weekChartData : monthChartData
  const categories = (tab === 'semana' ? weekly?.categories : monthly?.categories) ?? []
  const totalEntradas = chartData.reduce((s, d) => s + d.entradas, 0)
  const totalSaidas = chartData.reduce((s, d) => s + d.saidas, 0)
  const maxCategoryTotal = Math.max(...categories.map((c) => c.total), 1)
  const categoryTotal = categories.reduce((s, c) => s + c.total, 0)
  // A category with a budget set but no spend logged yet this period would
  // otherwise vanish from "Para onde foi o dinheiro" entirely (that list is
  // derived purely from transactions) — the limit you just configured would
  // look like it never saved. Show it too, at R$ 0 gasto so far.
  const budgetedNoSpendCategories = budgetList
    .filter((b) => !categories.some((c) => c.category === b.category))
    .map((b) => ({ category: b.category, total: 0 }))
  const displayCategories = [...categories, ...budgetedNoSpendCategories]
  const hasAnyData = totalEntradas > 0 || totalSaidas > 0

  // "Entradas - Contas" for the current calendar month: how much of what
  // came in is already spoken for by bills due this month (paid or not —
  // both already commit that money), and what's left over or short.
  const currentYearMonth = localDateString().slice(0, 7)
  const monthEntradas = monthly?.weeks.reduce((s, w) => s + w.entradas, 0) ?? 0
  const monthContas = billsList.filter((b) => b.due_date.slice(0, 7) === currentYearMonth).reduce((s, b) => s + b.amount, 0)
  const monthBalance = monthEntradas - monthContas

  const recentCategories = [...new Set(recent.map((t) => t.category))]
  const recentPeople = [...new Map(recent.map((t) => [t.created_by, t.created_by_name])).entries()]
  const filteredRecent = recent
    .filter((t) => !categoryFilter || t.category === categoryFilter)
    .filter((t) => !personFilter || t.created_by === personFilter)
    .slice(0, 15)

  const periodStart = tab === 'semana' ? skeleton[0].date : (() => {
    const d = new Date()
    d.setDate(d.getDate() - 29)
    return localDateString(d)
  })()
  const periodTransactions = recent.filter((t) => t.date >= periodStart)
  const perPerson = recentPeople
    .map(([id, name]) => ({
      id,
      name,
      entradas: periodTransactions
        .filter((t) => t.created_by === id && t.type === 'income')
        .reduce((s, t) => s + t.amount, 0),
      saidas: periodTransactions
        .filter((t) => t.created_by === id && t.type === 'expense')
        .reduce((s, t) => s + t.amount, 0),
    }))
    .filter((p) => p.entradas > 0 || p.saidas > 0)

  // Settle-up: shared expenses are split proportionally to each person's
  // monthly contribution target when every person in perPerson has one set
  // (household.setContributionTarget) — e.g. R$3000 vs R$2000 targets means
  // 60/40, not 50/50. Falls back to an equal split when targets aren't
  // fully configured, which is also the original behavior. Whoever paid
  // more than their fair share is owed the difference by whoever paid less.
  // Amounts already recorded as settled within this period are netted out
  // so a paid debt stops showing as owed.
  const settledInPeriod = settledRecords.filter((s) => s.settled_at >= periodStart)
  const totalSaidasPeriod = perPerson.reduce((s, p) => s + p.saidas, 0)
  const contributionTargetById = new Map(members.map((m) => [m.id, m.monthly_contribution_target]))
  const hasAllTargets =
    perPerson.length > 0 && perPerson.every((p) => (contributionTargetById.get(p.id) ?? 0) > 0)
  const totalTarget = hasAllTargets
    ? perPerson.reduce((s, p) => s + (contributionTargetById.get(p.id) ?? 0), 0)
    : 0
  const fairShareFor = (personId: string) =>
    hasAllTargets
      ? totalSaidasPeriod * ((contributionTargetById.get(personId) ?? 0) / totalTarget)
      : perPerson.length > 0
        ? totalSaidasPeriod / perPerson.length
        : 0
  const settlements = (() => {
    const creditors = perPerson
      .map((p) => ({ id: p.id, name: p.name, balance: p.saidas - fairShareFor(p.id) }))
      .filter((p) => p.balance > 0.01)
      .sort((a, b) => b.balance - a.balance)
    const debtors = perPerson
      .map((p) => ({ id: p.id, name: p.name, balance: fairShareFor(p.id) - p.saidas }))
      .filter((p) => p.balance > 0.01)
      .sort((a, b) => b.balance - a.balance)
    const result: { fromId: string; from: string; toId: string; to: string; amount: number }[] = []
    let i = 0
    let j = 0
    while (i < debtors.length && j < creditors.length) {
      const amount = Math.min(debtors[i].balance, creditors[j].balance)
      result.push({ fromId: debtors[i].id, from: debtors[i].name, toId: creditors[j].id, to: creditors[j].name, amount })
      debtors[i].balance -= amount
      creditors[j].balance -= amount
      if (debtors[i].balance < 0.01) i++
      if (creditors[j].balance < 0.01) j++
    }
    for (const s of settledInPeriod) {
      const line = result.find((r) => r.fromId === s.from_user_id && r.toId === s.to_user_id)
      if (line) line.amount = Math.max(0, line.amount - s.amount)
    }
    return result.filter((r) => r.amount > 0.01)
  })()

  // "Combinados da casa" — simple rule-based read on financial balance.
  // Works for any number of contributors: the spread between whoever paid
  // the most and whoever paid the least is what decides "balanced" vs not
  // — for exactly 2 people that spread is the same as the old direct diff.
  const combinados = (() => {
    if (perPerson.length < 2 || totalSaidasPeriod === 0) return []
    const sorted = [...perPerson].sort((a, b) => b.saidas - a.saidas)
    const higher = sorted[0]
    const lower = sorted[sorted.length - 1]
    const spread = higher.saidas - lower.saidas
    const spreadPct = spread / totalSaidasPeriod
    const periodLabel = tab === 'semana' ? 'nesta semana' : 'neste mês'
    if (spreadPct < 0.15) {
      return [
        {
          icon: '🎯',
          tone: 'teal' as const,
          headline: 'Vocês estão bem equilibrados!',
          body: `A diferença de gastos entre quem mais e quem menos gastou é de apenas R$ ${formatBRL(spread)}. Ótimo!`,
          person: 'Juntos',
          time: 'Balanço atual',
        },
      ]
    }
    const higherPct = Math.round((higher.saidas / totalSaidasPeriod) * 100)
    return [
      {
        icon: '⚖️',
        tone: 'amber' as const,
        headline: `${higher.name.split(' ')[0]} assumiu mais gastos ${periodLabel}`,
        body: `${periodLabel === 'nesta semana' ? 'Nesta semana' : 'Neste mês'}, ${higher.name.split(' ')[0]} cobriu ${higherPct}% das despesas da casa.`,
        person: higher.name.split(' ')[0],
        time: periodLabel === 'nesta semana' ? 'Esta semana' : 'Este mês',
      },
    ]
  })()

  // Custom categories (typed via "+ Nova") aren't stored anywhere of their
  // own — they just live as free text on whatever transactions used them.
  // Deriving the picker's options from transaction history means a custom
  // category the household already used shows up again next time, instead
  // of vanishing the moment the form closes.
  function presetsFor(type: 'income' | 'expense'): CategoryOption[] {
    const base = type === 'income' ? INCOME_CATEGORY_PRESETS : EXPENSE_CATEGORY_PRESETS
    const baseLabels = new Set(base.map((p) => p.label.toLowerCase()))
    const seen = new Set<string>()
    const custom: CategoryOption[] = []
    for (const t of recent) {
      if (t.type !== type) continue
      const key = t.category.toLowerCase()
      if (baseLabels.has(key) || seen.has(key)) continue
      seen.add(key)
      custom.push({ id: `custom-${t.category}`, icon: '🏷️', label: t.category })
    }
    return [...base, ...custom]
  }

  function openForm(type: 'income' | 'expense' = 'expense') {
    const presets = type === 'income' ? INCOME_CATEGORY_PRESETS : EXPENSE_CATEGORY_PRESETS
    setForm({
      category: presets[0].label,
      amount: '',
      type,
      date: localDateString(),
      description: '',
      paymentMethod: '',
      recurrence: '',
      accountId: '',
      paidBy: currentUser?.id || '',
    })
    setAddingAccount(false)
    setShowForm(true)
  }

  async function handleAddAccount() {
    const name = newAccountName.trim()
    if (!name) return
    setSavingAccount(true)
    try {
      const { id } = await accountsApi.create({ name, type: newAccountType })
      const balance = Number(newAccountBalance)
      if (newAccountBalance.trim() && balance !== 0) {
        await accountsApi.update(id, { balance })
      }
      setForm((f) => ({ ...f, accountId: id }))
      setNewAccountName('')
      setNewAccountBalance('')
      setAddingAccount(false)
      setShowAccountModal(false)
      await load()
    } catch {
      toastError('Não foi possível criar a conta.')
    } finally {
      setSavingAccount(false)
    }
  }

  function openEditAccount(account: FinancialAccount) {
    setActionsAccount(null)
    setEditingAccount(account)
    setEditAccountDraft({ name: account.name, type: account.type, balance: String(account.balance) })
  }

  async function handleSaveAccountEdit() {
    if (!editingAccount) return
    const name = editAccountDraft.name.trim()
    if (!name) return
    setSavingAccountEdit(true)
    try {
      await accountsApi.update(editingAccount.id, {
        name,
        type: editAccountDraft.type,
        balance: Number(editAccountDraft.balance) || 0,
      })
      setEditingAccount(null)
      await load()
      toast('Conta atualizada!')
    } catch {
      toastError('Não foi possível atualizar a conta.')
    } finally {
      setSavingAccountEdit(false)
    }
  }

  async function handleReorderAccounts(reordered: FinancialAccount[]) {
    setAccountsList(reordered)
    try {
      await accountsApi.reorder(reordered.map((a) => a.id))
    } catch {
      toastError('Não foi possível reordenar as contas.')
      load()
    }
  }

  async function confirmRemoveAccount() {
    if (!confirmAccountId) return
    const id = confirmAccountId
    setConfirmAccountId(null)
    setAccountsList((prev) => prev.filter((a) => a.id !== id))
    if (form.accountId === id) setForm((f) => ({ ...f, accountId: '' }))
    try {
      await accountsApi.remove(id)
      toast('Conta removida.')
      load()
    } catch {
      toastError('Não foi possível remover a conta.')
      load()
    }
  }

  async function handleMarkSettled(toUserId: string, amount: number) {
    setSettlingId(toUserId)
    try {
      await settlementsApi.create({ toUserId, amount })
      toast('Marcado como quitado!')
      await load()
    } catch {
      toastError('Não foi possível marcar como quitado.')
    } finally {
      setSettlingId(null)
    }
  }

  function switchType(type: 'income' | 'expense') {
    const presets = type === 'income' ? INCOME_CATEGORY_PRESETS : EXPENSE_CATEGORY_PRESETS
    setForm((f) => ({ ...f, type, category: presets[0].label }))
  }

  async function handleAdd() {
    const amount = Number(form.amount)
    if (!form.category.trim() || !form.amount || !(amount > 0)) return
    setSaving(true)
    try {
      await transactions.create({
        category: form.category.trim(),
        amount,
        type: form.type,
        date: form.date || localDateString(),
        description: form.description.trim() || undefined,
        paymentMethod: form.paymentMethod || undefined,
        recurrence: form.recurrence || undefined,
        accountId: form.accountId || undefined,
        paidBy: form.paidBy || undefined,
      })
      setShowForm(false)
      await load()
      toast('Lançamento salvo!')
    } catch {
      toastError('Não foi possível salvar o lançamento.')
    } finally {
      setSaving(false)
    }
  }

  function handleShareSummary() {
    const period = tab === 'semana' ? 'desta semana' : 'deste mês'
    const lines = [
      `📊 Resumo financeiro ${period} — Viver Junto`,
      `Entradas: R$ ${formatBRL(totalEntradas)}`,
      `Saídas: R$ ${formatBRL(totalSaidas)}`,
      `Saldo: R$ ${formatBRL(totalEntradas - totalSaidas)}`,
    ]
    if (categories.length > 0) {
      lines.push('', 'Principais categorias:')
      categories.slice(0, 3).forEach((c) => lines.push(`• ${c.category}: R$ ${formatBRL(c.total)}`))
    }
    const text = encodeURIComponent(lines.join('\n'))
    window.open(`https://wa.me/?text=${text}`, '_blank')
  }

  function openBudgets() {
    const presetLabelsLower = new Set(EXPENSE_CATEGORY_PRESETS.map((p) => p.label.toLowerCase()))
    // Any budget already set for a category outside the presets (added via
    // "+ Nova categoria" in a previous visit, or via a custom transaction
    // category) needs its own editable row too, not just the presets.
    const customLabels = [...new Set(budgetList.map((b) => b.category))].filter(
      (c) => !presetLabelsLower.has(c.toLowerCase()),
    )
    setCustomBudgetCategories(customLabels)
    setAddingBudgetCategory(false)
    setNewBudgetCategoryName('')

    const draft: Record<string, string> = {}
    for (const label of [...EXPENSE_CATEGORY_PRESETS.map((p) => p.label), ...customLabels]) {
      const existing = budgetList.find((b) => b.category === label)
      draft[label] = existing ? String(existing.monthly_limit) : ''
    }
    setBudgetDraft(draft)
    setBudgetItemsDraft({})
    setExpandedCategory(null)
    setIncomeTargetDraft(financialSettings?.monthly_income ? String(financialSettings.monthly_income) : '')
    const contribDraft: Record<string, string> = {}
    for (const m of members) {
      contribDraft[m.id] = m.monthly_contribution_target ? String(m.monthly_contribution_target) : ''
    }
    setContributionDraft(contribDraft)
    setShowBudgets(true)
  }

  function addBudgetCategory() {
    const label = newBudgetCategoryName.trim().replace(/\s+/g, ' ')
    if (!label) return
    const known = [...EXPENSE_CATEGORY_PRESETS.map((p) => p.label), ...customBudgetCategories]
    if (!known.some((c) => c.toLowerCase() === label.toLowerCase())) {
      setCustomBudgetCategories((prev) => [...prev, label])
      setBudgetDraft((d) => ({ ...d, [label]: '' }))
    }
    setNewBudgetCategoryName('')
    setAddingBudgetCategory(false)
    setExpandedCategory(label)
  }

  function addBudgetItem(category: string) {
    const value = Number(newItemValue)
    if (!newItemLabel.trim() || !(value > 0)) return
    const newItems = [...(budgetItemsDraft[category] ?? []), { label: newItemLabel.trim(), value: newItemValue }]
    setBudgetItemsDraft((d) => ({ ...d, [category]: newItems }))
    setBudgetDraft((d) => ({ ...d, [category]: String(newItems.reduce((s, i) => s + (Number(i.value) || 0), 0)) }))
    setNewItemLabel('')
    setNewItemValue('')
  }

  function removeBudgetItem(category: string, index: number) {
    const newItems = (budgetItemsDraft[category] ?? []).filter((_, i) => i !== index)
    setBudgetItemsDraft((d) => ({ ...d, [category]: newItems }))
    if (newItems.length > 0) {
      setBudgetDraft((d) => ({ ...d, [category]: String(newItems.reduce((s, i) => s + (Number(i.value) || 0), 0)) }))
    }
  }

  async function handleSaveBudgets() {
    setSavingBudgets(true)
    try {
      const entries = Object.entries(budgetDraft)
      await Promise.all([
        ...entries.map(([category, value]) => {
          const amount = Number(value)
          if (value.trim() && amount > 0) return budgetsApi.set(category, amount)
          return budgetsApi.remove(category).catch(() => {})
        }),
        ...members.map((m) => {
          const raw = contributionDraft[m.id] ?? ''
          const amount = Number(raw)
          const current = m.monthly_contribution_target
          const next = raw.trim() && amount > 0 ? amount : null
          if (next === current) return Promise.resolve()
          return household.setContributionTarget(m.id, next)
        }),
        (() => {
          const income = Number(incomeTargetDraft)
          const data: { monthlyIncome?: number } = {}
          if (incomeTargetDraft.trim() && income > 0) data.monthlyIncome = income
          if (Object.keys(data).length === 0) return Promise.resolve()
          return household.putFinancialSettings(data)
        })(),
      ])
      setShowBudgets(false)
      await load()
      toast('Orçamentos atualizados!')
    } catch {
      toastError('Não foi possível salvar os orçamentos.')
    } finally {
      setSavingBudgets(false)
    }
  }

  const monthDeltaPct =
    comparison && comparison.previous.saidas > 0
      ? Math.round(((comparison.current.saidas - comparison.previous.saidas) / comparison.previous.saidas) * 100)
      : null

  if (loading) {
    return (
      <Screen scroll className="bg-app-bg">
        <Header title="Finanças" />
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
          { color: 'teal', size: 260, top: -80, right: -60 },
          { color: 'coral', size: 200, bottom: 200, left: -80 },
        ]}
      />
      <Header title="Finanças" />

      <div className="relative z-10 flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 pb-44">
        <Card className="bg-ink text-white">
          <p className="text-xs text-ink-muted">
            Movimentado {tab === 'semana' ? 'nos últimos 7 dias' : 'nos últimos 30 dias'}
          </p>
          <p className="mt-1 text-2xl font-bold">R$ {formatBRL(totalEntradas - totalSaidas)}</p>
          <div className="mt-4 grid grid-cols-2 gap-2 text-center text-xs">
            <div>
              <p className="text-ink-muted">Entradas</p>
              <p className="font-semibold text-teal-300">R$ {formatBRL(totalEntradas)}</p>
            </div>
            <div>
              <p className="text-ink-muted">Saídas</p>
              <p className="font-semibold text-coral-300">R$ {formatBRL(totalSaidas)}</p>
            </div>
          </div>
          {hasAnyData && (
            <button
              onClick={handleShareSummary}
              className="mt-4 flex min-h-[32px] w-full items-center justify-center gap-1.5 rounded-full bg-white/10 text-xs font-medium"
            >
              💬 Compartilhar resumo no WhatsApp
            </button>
          )}
        </Card>

        <div className="flex gap-2 rounded-full bg-forest-100 p-1">
          {(['semana', 'mes'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 rounded-full py-2 text-xs font-semibold capitalize transition-colors ${
                tab === t ? 'bg-surface text-forest-900 shadow-xs' : 'text-forest-500'
              }`}
            >
              {t === 'semana' ? 'Esta semana' : 'Este mês'}
            </button>
          ))}
        </div>

        {tab === 'mes' && monthDeltaPct !== null && (
          <div
            className={`flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-medium ${
              monthDeltaPct > 0 ? 'bg-coral-100 text-coral-ink' : 'bg-teal-100 text-teal-ink'
            }`}
          >
            <span>{monthDeltaPct > 0 ? '▲' : '▼'}</span>
            <span>
              {Math.abs(monthDeltaPct)}% {monthDeltaPct > 0 ? 'a mais' : 'a menos'} em gastos vs. mês passado
            </span>
          </div>
        )}

        <Card>
          <p className="text-sm font-semibold text-forest-900">
            {tab === 'semana' ? 'Análise da semana' : 'Análise do mês'}
          </p>
          {!hasAnyData ? (
            <p className="mt-4 text-center text-xs text-forest-500">
              Nenhum lançamento {tab === 'semana' ? 'nesta semana' : 'neste mês'} ainda. Toque no + para começar.
            </p>
          ) : (
            <>
              <Suspense
                fallback={
                  <div className="mt-3 flex h-[160px] items-center justify-center">
                    <span className="size-5 animate-spin rounded-full border-2 border-forest-100 border-t-teal-500" />
                  </div>
                }
              >
                <AnalyticsChart data={chartData} />
              </Suspense>
              <div className="mt-2 flex justify-center gap-4 text-xs text-forest-500">
                <span className="inline-flex items-center gap-1">
                  <span className="size-2 rounded-full bg-teal-500" /> Entradas
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="size-2 rounded-full bg-coral-700" /> Saídas
                </span>
              </div>
            </>
          )}
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-forest-900">Para onde foi o dinheiro</p>
            <button
              onClick={openBudgets}
              className="flex min-h-[32px] items-center gap-1 rounded-full border-[1.5px] border-teal-500 bg-teal-50 px-3 py-1.5 text-xs font-medium text-teal-ink"
            >
              🎯 Configurar
            </button>
          </div>
          {displayCategories.length > 0 ? (
            <>
              <p className="mt-1 text-xs text-forest-500">
                {tab === 'semana' ? 'Esta semana' : 'Este mês'} · todas categorias
              </p>
              <div className="mt-3 flex flex-col gap-3">
                {displayCategories.map((c, i) => {
                  const budget = budgetList.find((b) => b.category === c.category)
                  const overBudget = budget ? c.total > budget.monthly_limit : false
                  const pctOfTotal = categoryTotal > 0 ? Math.round((c.total / categoryTotal) * 100) : 0
                  return (
                    <div key={c.category} className="flex items-start gap-3">
                      <span
                        className={`flex size-9 shrink-0 items-center justify-center rounded-full text-base ${CATEGORY_ICON_BG[i % CATEGORY_ICON_BG.length]}`}
                      >
                        {categoryIcon(c.category)}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-forest-900">{c.category}</span>
                          <span className={`font-medium ${overBudget ? 'text-error' : 'text-forest-700'}`}>{pctOfTotal}%</span>
                        </div>
                        <div className="mt-1 flex items-center gap-2">
                          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-forest-100">
                            <div
                              className={`h-full rounded-full ${overBudget ? 'bg-error' : CATEGORY_COLORS[i % CATEGORY_COLORS.length]}`}
                              style={{
                                width: `${Math.min((c.total / (budget?.monthly_limit ?? maxCategoryTotal)) * 100, 100)}%`,
                              }}
                            />
                          </div>
                          <span className={`shrink-0 text-xs ${overBudget ? 'font-semibold text-error' : 'text-forest-500'}`}>
                            R$ {formatBRL(c.total)}
                            {budget && ` / ${formatBRL(budget.monthly_limit)}`}
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          ) : (
            <p className="mt-2 text-xs text-forest-500">
              Assim que houver gastos categorizados, eles aparecem aqui. Toque em "Configurar" pra definir metas por
              categoria.
            </p>
          )}
        </Card>

        <Card>
          <p className="text-sm font-semibold text-forest-900">Meta mensal</p>
          <p className="mt-1 text-xs text-forest-500">Entradas do mês menos as contas do mês</p>
          <div className="mt-3 flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-forest-700">Entradas</span>
              <span className="font-medium text-forest-900">R$ {formatBRL(monthEntradas)}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-forest-700">Contas</span>
              <span className="font-medium text-forest-900">R$ {formatBRL(monthContas)}</span>
            </div>
            <div className="mt-1 flex items-center justify-between border-t border-forest-100 pt-1.5 text-xs">
              <span className="font-semibold text-forest-900">{monthBalance >= 0 ? 'Sobra' : 'Falta'}</span>
              <span className={`font-semibold ${monthBalance >= 0 ? 'text-teal-ink' : 'text-error'}`}>
                R$ {formatBRL(Math.abs(monthBalance))}
              </span>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-forest-900">Contas e carteiras</p>
            <button
              onClick={() => {
                setNewAccountName('')
                setNewAccountType(ACCOUNT_TYPES[0].value)
                setShowAccountModal(true)
              }}
              className="flex min-h-[32px] items-center text-xs font-medium text-teal-700"
            >
              + Nova conta
            </button>
          </div>
          {accountsList.length === 0 ? (
            <p className="mt-2 text-xs text-forest-500">
              Nenhuma conta cadastrada. Crie uma pra organizar os lançamentos por conta/carteira.
            </p>
          ) : (
            <Reorder.Group
              as="div"
              axis="y"
              values={accountsList}
              onReorder={handleReorderAccounts}
              className="mt-3 flex flex-col gap-2"
            >
              {accountsList.map((a) => (
                <AccountRow key={a.id} account={a} onOpenActions={() => setActionsAccount(a)} />
              ))}
            </Reorder.Group>
          )}
        </Card>

        <BillsCard />

        <GoalsCard />

        {combinados.length > 0 && (
          <div className="flex flex-col gap-2">
            <p className="text-sm font-semibold text-forest-900">Combinados da casa</p>
            <p className="-mt-1 text-xs text-forest-500">Como está o equilíbrio financeiro</p>
            {combinados.map((c, i) => (
              <div
                key={i}
                className={`rounded-2xl border-l-[3px] p-3 ${
                  c.tone === 'teal' ? 'border-teal-500 bg-teal-50' : 'border-amber-500 bg-amber-50'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-2 text-xs font-semibold text-ink">
                    <span className="text-lg">{c.icon}</span> {c.headline}
                  </span>
                  <span
                    className={`shrink-0 rounded-full border bg-surface px-2.5 py-1 text-xs font-medium ${
                      c.tone === 'teal' ? 'border-teal-500 text-teal-700' : 'border-amber-500 text-amber-700'
                    }`}
                  >
                    {c.person}
                  </span>
                </div>
                <p className="mt-1.5 text-xs leading-relaxed text-ink">{c.body}</p>
                <p className="mt-1 text-xs text-ink/70">{c.time}</p>
              </div>
            ))}
          </div>
        )}

        {perPerson.length > 1 && (
          <Card>
            <p className="text-sm font-semibold text-forest-900">
              Por pessoa {tab === 'semana' ? 'nesta semana' : 'neste mês'}
            </p>
            <div className="mt-3 flex flex-col gap-3">
              {perPerson.map((p) => {
                const target = contributionTargetById.get(p.id)
                return (
                  <div key={p.id} className="flex items-center justify-between text-xs">
                    <span className="font-medium text-forest-700">
                      {p.name.split(' ')[0]}
                      {target ? <span className="ml-1.5 text-forest-500">· meta R$ {formatBRL(target)}</span> : null}
                    </span>
                    <span className="flex gap-3">
                      <span className="text-teal-700">+ R$ {formatBRL(p.entradas)}</span>
                      <span className="text-coral-700">- R$ {formatBRL(p.saidas)}</span>
                    </span>
                  </div>
                )
              })}
            </div>
          </Card>
        )}

        {settlements.length > 0 && (
          <Card>
            <p className="text-sm font-semibold text-forest-900">Acerto de contas</p>
            <p className="mt-1 text-xs text-forest-500">
              Considerando os gastos divididos igualmente {tab === 'semana' ? 'nesta semana' : 'neste mês'}.
            </p>
            <div className="mt-3 flex flex-col gap-2">
              {settlements.map((s, i) => {
                const message = `Ei, fechando as contas ${tab === 'semana' ? 'da semana' : 'do mês'}: você me deve R$ ${formatBRL(s.amount)} 💸`
                const isMyDebt = s.fromId === currentUser?.id
                return (
                  <div key={i} className="flex items-center justify-between gap-2 rounded-sm border border-forest-100 p-2.5">
                    <p className="text-xs text-forest-700">
                      <span className="font-semibold text-forest-900">{s.from.split(' ')[0]}</span> deve{' '}
                      <span className="font-semibold text-coral-700">R$ {formatBRL(s.amount)}</span> para{' '}
                      <span className="font-semibold text-forest-900">{s.to.split(' ')[0]}</span>
                    </p>
                    <div className="flex shrink-0 items-center gap-1.5">
                      {isMyDebt && (
                        <button
                          onClick={() => handleMarkSettled(s.toId, s.amount)}
                          disabled={settlingId === s.toId}
                          aria-label="Marcar como quitado"
                          className="flex size-8 items-center justify-center rounded-full text-forest-300 hover:bg-forest-50 hover:text-teal-700"
                        >
                          ✅
                        </button>
                      )}
                      <a
                        href={`https://wa.me/?text=${encodeURIComponent(message)}`}
                        target="_blank"
                        rel="noreferrer"
                        aria-label="Avisar no WhatsApp"
                        className="flex size-8 items-center justify-center rounded-full text-forest-300 hover:bg-forest-50 hover:text-teal-700"
                      >
                        📱
                      </a>
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>
        )}

        {recent.length > 0 && (
          <Card>
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-forest-900">Últimos lançamentos</p>
              {filteredRecent.length !== recent.length && (
                <button
                  onClick={() => {
                    setCategoryFilter('')
                    setPersonFilter('')
                  }}
                  className="text-xs font-medium text-teal-700"
                >
                  Limpar filtros
                </button>
              )}
            </div>

            {(recentCategories.length > 1 || recentPeople.length > 1) && (
              <div className="mt-2 flex flex-wrap gap-2">
                {recentCategories.length > 1 && (
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="min-h-[32px] min-w-0 flex-1 rounded-full border-[1.5px] border-forest-100 bg-surface px-3 text-xs text-forest-700 outline-none focus:border-teal-500"
                  >
                    <option value="">Todas as categorias</option>
                    {recentCategories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                )}
                {recentPeople.length > 1 && (
                  <select
                    value={personFilter}
                    onChange={(e) => setPersonFilter(e.target.value)}
                    className="min-h-[32px] min-w-0 flex-1 rounded-full border-[1.5px] border-forest-100 bg-surface px-3 text-xs text-forest-700 outline-none focus:border-teal-500"
                  >
                    <option value="">Todas as pessoas</option>
                    {recentPeople.map(([id, name]) => (
                      <option key={id} value={id}>
                        {name.split(' ')[0]}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )}

            <div className="mt-3 flex flex-col gap-2">
              {filteredRecent.length === 0 ? (
                <p className="py-2 text-center text-xs text-forest-500">Nenhum lançamento com esse filtro.</p>
              ) : (
                filteredRecent.map((t) => (
                  <div key={t.id} className="flex items-center gap-3 rounded-sm border border-forest-100 p-2.5">
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-forest-50 text-sm">
                      {categoryIconFor(t.category)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-medium text-forest-900">
                        {t.category}
                        {t.description ? ` · ${t.description}` : ''}
                      </p>
                      <p className="text-xs text-forest-500">
                        {formatLocalDate(t.date)} · {t.created_by_name.split(' ')[0]}
                        {t.account_name && ` · ${t.account_name}`}
                        {t.recurrence && <span title="Lançamento recorrente"> · 🔁</span>}
                      </p>
                    </div>
                    <span className={`text-xs font-semibold ${t.type === 'income' ? 'text-teal-700' : 'text-coral-700'}`}>
                      {t.type === 'income' ? '+' : '-'} R$ {formatBRL(t.amount)}
                    </span>
                    <button
                      onClick={() => setConfirmId(t.id)}
                      aria-label="Excluir lançamento"
                      className="flex size-8 shrink-0 items-center justify-center rounded-full text-forest-300 hover:bg-forest-50 hover:text-error"
                    >
                      🗑
                    </button>
                  </div>
                ))
              )}
            </div>
          </Card>
        )}
      </div>

      <Fab onClick={() => openForm()} label="Novo lançamento" />

      <Modal open={showForm} onClose={() => setShowForm(false)} title="Novo lançamento">
        <div className="flex flex-col gap-3">
          <div className="flex gap-2 rounded-full bg-forest-100 p-1">
            {(['expense', 'income'] as const).map((t) => (
              <button
                key={t}
                onClick={() => switchType(t)}
                className={`flex-1 rounded-full py-2 text-xs font-semibold transition-colors ${
                  form.type === t
                    ? t === 'income'
                      ? 'bg-teal-100 text-[#387069] shadow-xs'
                      : 'bg-coral-100 text-[#c75445] shadow-xs'
                    : 'text-forest-500'
                }`}
              >
                {t === 'expense' ? 'Saída' : 'Entrada'}
              </button>
            ))}
          </div>
          <CategoryPicker
            presets={presetsFor(form.type)}
            value={form.category}
            onChange={(label) => setForm((f) => ({ ...f, category: label }))}
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
            max={localDateString()}
            value={form.date}
            onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
          />
          <Input
            placeholder="Descrição (opcional)"
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          />
          {members.length >= 2 && (
            <div>
              <p className="mb-2 text-xs font-semibold text-forest-500">Quem pagou?</p>
              <div className="flex flex-wrap gap-2">
                {members.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setForm((f) => ({ ...f, paidBy: m.id }))}
                    className={`min-h-[32px] rounded-full border-[1.5px] px-3 py-1.5 text-xs ${
                      form.paidBy === m.id
                        ? 'border-teal-500 bg-teal-50 text-teal-ink'
                        : 'border-forest-100 text-forest-700'
                    }`}
                  >
                    {m.id === currentUser?.id ? 'Você' : m.name}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div>
            <p className="mb-2 text-xs font-semibold text-forest-500">Forma de pagamento (opcional)</p>
            <div className="flex flex-wrap gap-2">
              {PAYMENT_METHODS.map((pm) => (
                <button
                  key={pm.value}
                  onClick={() =>
                    setForm((f) => ({ ...f, paymentMethod: f.paymentMethod === pm.value ? '' : pm.value }))
                  }
                  className={`min-h-[32px] rounded-full border-[1.5px] px-3 py-1.5 text-xs ${
                    form.paymentMethod === pm.value
                      ? 'border-teal-500 bg-teal-50 text-teal-ink'
                      : 'border-forest-100 text-forest-700'
                  }`}
                >
                  {pm.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-2 text-xs font-semibold text-forest-500">Conta/carteira (opcional)</p>
            <div className="flex flex-wrap gap-2">
              {accountsList.map((a) => (
                <button
                  key={a.id}
                  onClick={() => setForm((f) => ({ ...f, accountId: f.accountId === a.id ? '' : a.id }))}
                  className={`min-h-[32px] rounded-full border-[1.5px] px-3 py-1.5 text-xs ${
                    form.accountId === a.id ? 'border-teal-500 bg-teal-50 text-teal-ink' : 'border-forest-100 text-forest-700'
                  }`}
                >
                  {a.name}
                </button>
              ))}
              {!addingAccount && (
                <button
                  onClick={() => setAddingAccount(true)}
                  className="inline-flex min-h-[32px] items-center gap-1.5 rounded-full border-[1.5px] border-dashed border-forest-300 px-3 py-1.5 text-xs text-forest-500"
                >
                  + Nova
                </button>
              )}
            </div>
            {addingAccount && (
              <div className="mt-2 flex gap-2">
                <input
                  autoFocus
                  value={newAccountName}
                  onChange={(e) => setNewAccountName(e.target.value)}
                  placeholder="Nome da conta"
                  className="min-h-[32px] flex-1 rounded-xl border-[1.5px] border-forest-100 px-3 text-sm outline-none focus:border-teal-500"
                />
                <button
                  onClick={handleAddAccount}
                  disabled={!newAccountName.trim() || savingAccount}
                  className="rounded-xl bg-teal-500 px-3 text-sm font-semibold text-white disabled:opacity-50"
                >
                  Ok
                </button>
              </div>
            )}
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
          </div>
          <Button loading={saving} disabled={!(Number(form.amount) > 0)} onClick={handleAdd}>
            Salvar lançamento
          </Button>
        </div>
      </Modal>

      <Modal open={showAccountModal} onClose={() => setShowAccountModal(false)} title="Nova conta">
        <div className="flex flex-col gap-3">
          <Input
            placeholder="Nome da conta (ex: Nubank)"
            value={newAccountName}
            onChange={(e) => setNewAccountName(e.target.value)}
          />
          <div>
            <p className="mb-2 text-xs font-semibold text-forest-500">Tipo</p>
            <div className="flex flex-wrap gap-2">
              {ACCOUNT_TYPES.map((t) => (
                <button
                  key={t.value}
                  onClick={() => setNewAccountType(t.value)}
                  className={`min-h-[32px] rounded-full border-[1.5px] px-3 py-1.5 text-xs ${
                    newAccountType === t.value ? 'border-teal-500 bg-teal-50 text-teal-ink' : 'border-forest-100 text-forest-700'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
          <Input
            type="number"
            step="0.01"
            placeholder="Saldo inicial (R$) — opcional"
            value={newAccountBalance}
            onChange={(e) => setNewAccountBalance(e.target.value)}
          />
          <Button loading={savingAccount} disabled={!newAccountName.trim()} onClick={handleAddAccount}>
            Criar conta
          </Button>
        </div>
      </Modal>

      <Modal open={actionsAccount !== null} onClose={() => setActionsAccount(null)} title={actionsAccount?.name ?? 'Conta'}>
        {actionsAccount && (
          <div className="flex flex-col gap-1">
            <button
              onClick={() => openEditAccount(actionsAccount)}
              className="flex min-h-[44px] items-center gap-3 rounded-xl px-2 text-left text-sm font-medium text-forest-900 hover:bg-forest-50"
            >
              ✏️ Editar
            </button>
            <button
              onClick={() => {
                setConfirmAccountId(actionsAccount.id)
                setActionsAccount(null)
              }}
              className="flex min-h-[44px] items-center gap-3 rounded-xl px-2 text-left text-sm font-medium text-error hover:bg-coral-50"
            >
              🗑 Excluir conta
            </button>
          </div>
        )}
      </Modal>

      <Modal open={editingAccount !== null} onClose={() => setEditingAccount(null)} title="Editar conta">
        <div className="flex flex-col gap-3">
          <Input
            placeholder="Nome da conta"
            value={editAccountDraft.name}
            onChange={(e) => setEditAccountDraft((d) => ({ ...d, name: e.target.value }))}
          />
          <div>
            <p className="mb-2 text-xs font-semibold text-forest-500">Tipo</p>
            <div className="flex flex-wrap gap-2">
              {ACCOUNT_TYPES.map((t) => (
                <button
                  key={t.value}
                  onClick={() => setEditAccountDraft((d) => ({ ...d, type: t.value }))}
                  className={`min-h-[32px] rounded-full border-[1.5px] px-3 py-1.5 text-xs ${
                    editAccountDraft.type === t.value ? 'border-teal-500 bg-teal-50 text-teal-ink' : 'border-forest-100 text-forest-700'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
          <label className="flex flex-col gap-1.5 text-xs font-medium text-forest-700">
            Saldo atual (R$)
            <input
              type="number"
              step="0.01"
              value={editAccountDraft.balance}
              onChange={(e) => setEditAccountDraft((d) => ({ ...d, balance: e.target.value }))}
              className="min-h-[32px] rounded-xl border-[1.5px] border-forest-100 px-3 text-sm outline-none focus:border-teal-500"
            />
          </label>
          <Button loading={savingAccountEdit} disabled={!editAccountDraft.name.trim()} onClick={handleSaveAccountEdit}>
            Salvar alterações
          </Button>
        </div>
      </Modal>

      <Modal open={showBudgets} onClose={() => setShowBudgets(false)} title="Orçamentos mensais">
        <div className="flex flex-col gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-forest-500">Meta de entrada mensal</p>
            <p className="mt-1 text-xs text-forest-500">Quanto vocês esperam receber por mês. Deixe em branco para não acompanhar.</p>
            <input
              type="number"
              min="0"
              step="1"
              placeholder="R$"
              value={incomeTargetDraft}
              onChange={(e) => setIncomeTargetDraft(e.target.value)}
              className="mt-2 min-h-[32px] w-full rounded-lg border-[1.5px] border-forest-100 px-2 text-sm outline-none focus:border-teal-500"
            />
          </div>

          {members.length > 1 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-forest-500">Contribuição mensal por pessoa</p>
              <p className="mt-1 text-xs text-forest-500">
                Quanto cada um pode contribuir por mês. Se todo mundo definir um valor, o Acerto de contas passa a
                dividir os gastos nessa proporção em vez de igualmente.
              </p>
              <div className="mt-2 flex flex-col gap-2">
                {members.map((m) => (
                  <div key={m.id} className="flex items-center gap-3">
                    <span className="w-32 shrink-0 text-sm text-forest-700">{m.name.split(' ')[0]}</span>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      placeholder="R$"
                      value={contributionDraft[m.id] ?? ''}
                      onChange={(e) => setContributionDraft((d) => ({ ...d, [m.id]: e.target.value }))}
                      className="min-h-[32px] min-w-0 flex-1 rounded-lg border-[1.5px] border-forest-100 px-2 text-sm outline-none focus:border-teal-500"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-forest-500">Limites por categoria de gasto</p>
            <p className="mt-1 text-xs text-forest-500">
              Defina um limite mensal por categoria. Não sabe de cor? Toque em 🧮 e some os valores que você lembra.
            </p>
          </div>
          {[
            ...EXPENSE_CATEGORY_PRESETS,
            ...customBudgetCategories.map((label) => ({ id: label, icon: '🏷️', label })),
          ].map((preset) => {
            const items = budgetItemsDraft[preset.label] ?? []
            const isExpanded = expandedCategory === preset.label
            return (
              <div key={preset.id} className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <span className="w-28 shrink-0 text-sm text-forest-700">
                    {preset.icon} {preset.label}
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    placeholder="R$"
                    value={budgetDraft[preset.label] ?? ''}
                    onChange={(e) => setBudgetDraft((d) => ({ ...d, [preset.label]: e.target.value }))}
                    className="min-h-[32px] min-w-0 flex-1 rounded-lg border-[1.5px] border-forest-100 px-2 text-sm outline-none focus:border-teal-500"
                  />
                  <button
                    onClick={() => setExpandedCategory(isExpanded ? null : preset.label)}
                    aria-label="Somar itens"
                    className={`flex size-8 shrink-0 items-center justify-center rounded-lg text-sm ${
                      isExpanded ? 'bg-teal-100 text-teal-ink' : 'bg-forest-50 text-forest-500'
                    }`}
                  >
                    🧮
                  </button>
                </div>
                {isExpanded && (
                  <div className="flex flex-col gap-1.5 rounded-xl bg-forest-50 p-2.5">
                    {items.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-xs">
                        <span className="min-w-0 flex-1 truncate text-forest-700">{item.label}</span>
                        <span className="shrink-0 text-forest-500">R$ {item.value}</span>
                        <button
                          onClick={() => removeBudgetItem(preset.label, idx)}
                          aria-label="Remover item"
                          className="shrink-0 text-forest-500"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                    <div className="flex items-center gap-1.5">
                      <input
                        placeholder="Item (ex: Aluguel)"
                        value={newItemLabel}
                        onChange={(e) => setNewItemLabel(e.target.value)}
                        className="min-h-[32px] min-w-0 flex-1 rounded-lg border-[1.5px] border-forest-100 bg-surface px-2 text-xs outline-none focus:border-teal-500"
                      />
                      <input
                        type="number"
                        min="0"
                        step="1"
                        placeholder="R$"
                        value={newItemValue}
                        onChange={(e) => setNewItemValue(e.target.value)}
                        className="min-h-[32px] w-20 shrink-0 rounded-lg border-[1.5px] border-forest-100 bg-surface px-2 text-xs outline-none focus:border-teal-500"
                      />
                      <button
                        onClick={() => addBudgetItem(preset.label)}
                        disabled={!newItemLabel.trim() || !(Number(newItemValue) > 0)}
                        className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-teal-500 text-sm font-bold text-white disabled:opacity-50"
                      >
                        +
                      </button>
                    </div>
                    {items.length > 0 && (
                      <p className="text-xs text-forest-500">
                        Soma: R$ {formatBRL(items.reduce((s, i) => s + (Number(i.value) || 0), 0))}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )
          })}

          {addingBudgetCategory ? (
            <div className="flex items-center gap-1.5">
              <input
                autoFocus
                placeholder="Nome da categoria (ex: Educação)"
                value={newBudgetCategoryName}
                onChange={(e) => setNewBudgetCategoryName(e.target.value)}
                className="min-h-[32px] min-w-0 flex-1 rounded-lg border-[1.5px] border-forest-100 px-2 text-sm outline-none focus:border-teal-500"
              />
              <button
                onClick={addBudgetCategory}
                disabled={!newBudgetCategoryName.trim()}
                className="rounded-lg bg-teal-500 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                Ok
              </button>
            </div>
          ) : (
            <button
              onClick={() => setAddingBudgetCategory(true)}
              className="flex min-h-[32px] w-fit items-center gap-1.5 rounded-full border-[1.5px] border-dashed border-forest-300 px-3 py-2 text-xs text-forest-500"
            >
              + Nova categoria
            </button>
          )}

          <Button loading={savingBudgets} onClick={handleSaveBudgets}>
            Salvar orçamentos
          </Button>
        </div>
      </Modal>

      <ConfirmModal
        open={confirmId !== null}
        title="Excluir lançamento"
        message="Tem certeza que quer excluir esse lançamento? Essa ação não pode ser desfeita."
        onCancel={() => setConfirmId(null)}
        onConfirm={confirmRemoveTransaction}
      />

      <ConfirmModal
        open={confirmAccountId !== null}
        title="Excluir conta"
        message="Os lançamentos feitos nessa conta continuam salvos, só deixam de estar vinculados a ela."
        onCancel={() => setConfirmAccountId(null)}
        onConfirm={confirmRemoveAccount}
      />

      <BottomNav />
    </Screen>
  )
}

function AccountRow({ account, onOpenActions }: { account: FinancialAccount; onOpenActions: () => void }) {
  const controls = useDragControls()
  return (
    <Reorder.Item
      as="div"
      value={account}
      dragListener={false}
      dragControls={controls}
      style={{ touchAction: 'none' }}
      className="flex items-center gap-3 rounded-sm border border-forest-100 bg-surface p-2.5"
    >
      <DragGrip onPointerDown={(e) => controls.start(e)} />
      <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-forest-50 text-sm">🏦</span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-medium text-forest-900">{account.name}</p>
        <p className="text-xs text-forest-500">
          {ACCOUNT_TYPES.find((t) => t.value === account.type)?.label ?? account.type}
        </p>
      </div>
      <span className={`text-xs font-semibold ${account.balance < 0 ? 'text-error' : 'text-forest-900'}`}>
        R$ {formatBRL(account.balance)}
      </span>
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
