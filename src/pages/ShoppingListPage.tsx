import { useEffect, useState } from 'react'
import { Reorder, useDragControls } from 'framer-motion'
import { useLocation, useNavigate } from 'react-router-dom'
import { Screen } from '../components/layout/Screen'
import { Header } from '../components/layout/Header'
import { AuraBackground } from '../components/ui/AuraBackground'
import { Card } from '../components/ui/Card'
import { Fab } from '../components/ui/Fab'
import { MiniStatTile } from '../components/ui/MiniStatTile'
import { Modal } from '../components/ui/Modal'
import { ConfirmModal } from '../components/ui/ConfirmModal'
import { Input } from '../components/ui/Input'
import { Button } from '../components/ui/Button'
import { CategoryPicker, type CategoryOption } from '../components/ui/CategoryPicker'
import { DragGrip } from '../components/ui/DragGrip'
import { BottomNav } from '../components/layout/BottomNav'
import { ApiError, shopping, transactions, type ShoppingItem } from '../lib/api'
import { toast, toastError } from '../store/toast'
import { localDateString } from '../lib/date'

const CATEGORY_PRESETS: CategoryOption[] = [
  { id: 'mercearia', icon: '🛒', label: 'Mercearia' },
  { id: 'limpeza', icon: '🧴', label: 'Limpeza' },
  { id: 'higiene', icon: '🧼', label: 'Higiene' },
  { id: 'bebidas', icon: '🥤', label: 'Bebidas' },
  { id: 'pet', icon: '🐾', label: 'Pet' },
  { id: 'outros', icon: '🏷️', label: 'Outros' },
]

const RECURRENCE_OPTIONS = [
  { value: '', label: 'Não repete' },
  { value: 'weekly', label: 'Toda semana' },
  { value: 'monthly', label: 'Todo mês' },
]

function categoryIcon(label: string | null) {
  return CATEGORY_PRESETS.find((c) => c.label === label)?.icon ?? '🏷️'
}

export function ShoppingListPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [items, setItems] = useState<ShoppingItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showSettings, setShowSettings] = useState(false)
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ name: '', category: CATEGORY_PRESETS[0].label, quantity: '', price: '', recurrence: '' })
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [actionsItem, setActionsItem] = useState<ShoppingItem | null>(null)
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [confirmClear, setConfirmClear] = useState(false)
  const [confirmRegister, setConfirmRegister] = useState(false)
  const [registering, setRegistering] = useState(false)
  const [frequencyHint, setFrequencyHint] = useState<{ avgDays: number | null; lastPurchasedDaysAgo: number | null } | null>(
    null,
  )
  const [nextTripDate, setNextTripDate] = useState<string | null>(null)
  const [tripDateDraft, setTripDateDraft] = useState('')
  const [savingTripDate, setSavingTripDate] = useState(false)

  async function load() {
    setLoading(true)
    const { items: list, nextTripDate: trip } = await shopping.list().catch(() => ({ items: [], nextTripDate: null }))
    setItems(list)
    setNextTripDate(trip)
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  useEffect(() => {
    const state = location.state as { openAdd?: string } | null
    if (state?.openAdd === 'shopping') {
      openAdd()
      navigate(location.pathname, { replace: true, state: null })
    }
  }, [location])

  useEffect(() => {
    if (!showAdd || !form.name.trim()) {
      setFrequencyHint(null)
      return
    }
    const handle = setTimeout(() => {
      shopping
        .frequency(form.name.trim())
        .then(setFrequencyHint)
        .catch(() => setFrequencyHint(null))
    }, 400)
    return () => clearTimeout(handle)
  }, [form.name, showAdd])

  function openAdd(category?: string) {
    setEditingId(null)
    setForm({ name: '', category: category ?? CATEGORY_PRESETS[0].label, quantity: '', price: '', recurrence: '' })
    setShowAdd(true)
  }

  function openEdit(item: ShoppingItem) {
    setActionsItem(null)
    setEditingId(item.id)
    setForm({
      name: item.name,
      category: item.category ?? CATEGORY_PRESETS[0].label,
      quantity: item.quantity ?? '',
      price: item.price != null ? String(item.price) : '',
      recurrence: item.recurrence ?? '',
    })
    setShowAdd(true)
  }

  async function confirmRemoveItem() {
    if (!confirmId) return
    const id = confirmId
    setConfirmId(null)
    setItems((prev) => prev.filter((i) => i.id !== id))
    try {
      await shopping.remove(id)
      toast('Item excluído.')
    } catch {
      toastError('Não foi possível excluir o item.')
      load()
    }
  }

  async function handleReorderInCategory(reorderedGroup: ShoppingItem[]) {
    const idsInGroup = new Set(reorderedGroup.map((i) => i.id))
    let cursor = 0
    const merged = items.map((i) => (idsInGroup.has(i.id) ? reorderedGroup[cursor++] : i))
    setItems(merged)
    try {
      await shopping.reorder(reorderedGroup.map((i) => i.id))
    } catch {
      toastError('Não foi possível reordenar os itens.')
      load()
    }
  }

  async function toggle(item: ShoppingItem) {
    const nextChecked = item.checked ? 0 : 1
    const updated = items.map((i) => (i.id === item.id ? { ...i, checked: nextChecked } : i))
    setItems(updated)
    try {
      await shopping.setChecked(item.id, !item.checked)
      // Checking a recurring item respawns a fresh copy server-side —
      // reload to pick it up instead of leaving it invisible until next visit.
      if (nextChecked && item.recurrence) load()
      // Last item of the trip just got checked — offer to close out the
      // purchase as a single expense instead of making the user hunt for the button.
      else if (nextChecked && updated.length > 0 && updated.every((i) => i.checked)) {
        setConfirmRegister(true)
      }
    } catch {
      setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, checked: item.checked } : i)))
      toastError('Não foi possível atualizar o item.')
    }
  }

  async function handleAdd() {
    if (!form.name.trim()) return
    setSaving(true)
    try {
      const data = {
        name: form.name.trim(),
        category: form.category,
        quantity: form.quantity.trim() || undefined,
        price: form.price ? Number(form.price) : undefined,
        recurrence: form.recurrence || null,
      }
      if (editingId) {
        await shopping.update(editingId, data)
        toast('Item atualizado!')
      } else {
        await shopping.create(data)
        toast('Item adicionado!')
      }
      setShowAdd(false)
      setEditingId(null)
      await load()
    } catch (err) {
      toastError(err instanceof ApiError ? err.message : 'Não foi possível salvar o item.')
    } finally {
      setSaving(false)
    }
  }

  async function handleClearChecked() {
    setShowSettings(false)
    setConfirmClear(true)
  }

  async function handleSaveTripDate() {
    setSavingTripDate(true)
    try {
      await shopping.setTripDate(tripDateDraft || null)
      setNextTripDate(tripDateDraft || null)
      toast('Próxima ida atualizada!')
    } catch {
      toastError('Não foi possível salvar a data.')
    } finally {
      setSavingTripDate(false)
    }
  }

  function tripDateLabel(date: string | null): string {
    if (!date) return '—'
    const d = new Date(date + 'T00:00:00')
    const diffDays = Math.round((d.getTime() - new Date(localDateString() + 'T00:00:00').getTime()) / 86400000)
    if (diffDays === 0) return 'Hoje'
    if (diffDays === 1) return 'Amanhã'
    if (diffDays > 1 && diffDays <= 6) {
      const label = d.toLocaleDateString('pt-BR', { weekday: 'long' })
      return label.charAt(0).toUpperCase() + label.slice(1)
    }
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
  }

  async function confirmClearChecked() {
    setConfirmClear(false)
    try {
      await shopping.clearChecked()
      await load()
      toast('Itens comprados removidos.')
    } catch {
      toastError('Não foi possível limpar os itens comprados.')
    }
  }

  async function confirmRegisterExpense() {
    setConfirmRegister(false)
    setRegistering(true)
    try {
      await transactions.create({
        category: 'Mercado',
        description: 'Lista de compras',
        amount: checkedTotal,
        type: 'expense',
        date: localDateString(),
      })
      await shopping.clearChecked()
      await load()
      toast('Gasto registrado em Finanças!')
    } catch {
      toastError('Não foi possível registrar o gasto.')
    } finally {
      setRegistering(false)
    }
  }

  const checkedCount = items.filter((i) => i.checked).length
  const estimatedTotal = items.filter((i) => !i.checked).reduce((sum, i) => sum + (i.price ?? 0), 0)
  const checkedTotal = items.filter((i) => i.checked).reduce((sum, i) => sum + (i.price ?? 0), 0)

  const grouped = items.reduce<Record<string, ShoppingItem[]>>((acc, item) => {
    const key = item.category ?? 'Outros'
    acc[key] = acc[key] ?? []
    acc[key].push(item)
    return acc
  }, {})

  return (
    <Screen scroll className="bg-app-bg">
      <AuraBackground
        auras={[
          { color: 'amber', size: 220, top: -70, right: -60 },
          { color: 'teal', size: 180, bottom: 220, left: -60 },
        ]}
      />
      <Header
        title="Lista de Compras"
        onSettings={() => {
          setTripDateDraft(nextTripDate ?? '')
          setShowSettings(true)
        }}
      />

      <div className="relative z-10 flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 pb-44">
        {items.length > 0 && (
          <div className="flex gap-2">
            <MiniStatTile icon="💰" title="Orçamento est." value={`R$ ${estimatedTotal.toFixed(0)}`} tone="teal" layout="center" />
            <MiniStatTile
              icon="📦"
              title="Faltam"
              value={`${items.length - checkedCount} ${items.length - checkedCount === 1 ? 'item' : 'itens'}`}
              tone="coral"
              layout="center"
            />
            <MiniStatTile icon="📅" title="Próxima ida" value={tripDateLabel(nextTripDate)} tone="amber" layout="center" />
            <MiniStatTile icon="✓" title="Gastos" value={`R$ ${checkedTotal.toFixed(0)}`} tone="forest" layout="center" />
          </div>
        )}

        {items.length > 0 && (
          <Card>
            <div className="flex items-center justify-between text-xs text-forest-500">
              <span>Itens marcados</span>
              <span className="font-medium text-forest-700">
                {checkedCount} de {items.length}
              </span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-forest-100">
              <div
                className="h-full rounded-full bg-teal-500 transition-all"
                style={{ width: `${(checkedCount / items.length) * 100}%` }}
              />
            </div>
            {checkedTotal > 0 && (
              <button
                onClick={() => setConfirmRegister(true)}
                className="mt-3 flex min-h-[32px] w-full items-center justify-center gap-1.5 rounded-full bg-ink text-xs font-medium text-white"
              >
                💰 Registrar R$ {checkedTotal.toFixed(0)} como gasto em Finanças
              </button>
            )}
          </Card>
        )}

        {loading ? (
          <p className="text-center text-sm text-forest-500">Carregando...</p>
        ) : items.length === 0 ? (
          <div className="flex flex-col gap-3">
            <div className="flex flex-col items-center gap-2 rounded-3xl border-[1.5px] border-dashed border-forest-100 py-10 text-center">
              <span className="text-2xl">🛒</span>
              <p className="text-sm font-medium text-forest-700">Sua lista está vazia</p>
              <p className="text-xs text-forest-500">Toque no + para adicionar o primeiro item.</p>
            </div>
            <div className="flex flex-col gap-2 opacity-40">
              <p className="flex items-center gap-2 text-sm font-semibold text-forest-900">🛒 Mercearia</p>
              <div className="flex items-center gap-3 rounded-sm border-[1.5px] border-dashed border-forest-100 bg-surface p-3">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full border-2 border-forest-100 text-xs" />
                <span className="flex-1 text-sm text-forest-700">Arroz</span>
                <span className="text-xs text-forest-500">R$ 22</span>
              </div>
              <span className="self-center rounded-full bg-forest-100 px-2 py-0.5 text-xs font-medium text-forest-500">
                Exemplo
              </span>
            </div>
          </div>
        ) : (
          Object.entries(grouped).map(([category, catItems]) => (
            <div key={category} className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <p className="flex items-center gap-2 text-sm font-semibold text-forest-900">
                  <span>{categoryIcon(category)}</span> {category}
                </p>
                <button
                  onClick={() => openAdd(category)}
                  aria-label={`Adicionar em ${category}`}
                  className="flex size-8 items-center justify-center rounded-full bg-forest-100 text-sm text-forest-700"
                >
                  +
                </button>
              </div>
              <Reorder.Group
                as="div"
                axis="y"
                values={catItems}
                onReorder={handleReorderInCategory}
                className="flex flex-col gap-2"
              >
                {catItems.map((item) => (
                  <ShoppingItemRow key={item.id} item={item} onToggle={() => toggle(item)} onOpenActions={() => setActionsItem(item)} />
                ))}
              </Reorder.Group>
            </div>
          ))
        )}

        {items.length > 0 && (
          <div className="flex items-center justify-between rounded-2xl border-[1.5px] border-forest-100 bg-surface px-4 py-3">
            <span className="text-sm font-medium text-forest-700">Total da lista</span>
            <span className="text-sm font-semibold text-forest-900">R$ {(estimatedTotal + checkedTotal).toFixed(2)}</span>
          </div>
        )}
      </div>

      <Fab onClick={() => openAdd()} label="Adicionar item" />

      <Modal
        open={showAdd}
        onClose={() => {
          setShowAdd(false)
          setEditingId(null)
        }}
        title={editingId ? 'Editar item' : 'Novo item'}
      >
        <div className="flex flex-col gap-3">
          <Input
            placeholder="Nome do item"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          />
          {frequencyHint && (frequencyHint.avgDays || frequencyHint.lastPurchasedDaysAgo !== null) && (
            <p className="-mt-1 text-xs text-forest-500">
              {frequencyHint.avgDays
                ? `🔁 Você costuma comprar isso a cada ~${frequencyHint.avgDays} dias`
                : `🔁 Última vez há ${frequencyHint.lastPurchasedDaysAgo} dias`}
            </p>
          )}
          <Input
            placeholder="Quantidade (ex: 2x, 500g) — opcional"
            value={form.quantity}
            onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))}
          />
          <Input
            type="number"
            min="0"
            step="0.01"
            placeholder="Preço estimado (opcional)"
            value={form.price}
            onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
          />
          <CategoryPicker
            presets={CATEGORY_PRESETS}
            value={form.category}
            onChange={(label) => setForm((f) => ({ ...f, category: label }))}
          />
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
          </div>
          <Button loading={saving} disabled={!form.name.trim()} onClick={handleAdd}>
            {editingId ? 'Salvar alterações' : 'Adicionar item'}
          </Button>
        </div>
      </Modal>

      <Modal open={actionsItem !== null} onClose={() => setActionsItem(null)} title={actionsItem?.name ?? 'Item'}>
        {actionsItem && (
          <div className="flex flex-col gap-2">
            <button
              onClick={() => openEdit(actionsItem)}
              className="rounded-2xl border-[1.5px] border-forest-100 bg-surface p-3 text-left text-sm font-medium text-forest-900"
            >
              ✏️ Editar
            </button>
            <button
              onClick={() => {
                setConfirmId(actionsItem.id)
                setActionsItem(null)
              }}
              className="rounded-2xl border-[1.5px] border-forest-100 bg-surface p-3 text-left text-sm font-medium text-error"
            >
              🗑 Excluir item
            </button>
          </div>
        )}
      </Modal>

      <Modal open={showSettings} onClose={() => setShowSettings(false)} title="Configurações da lista">
        <div className="flex flex-col gap-4">
          <div>
            <p className="mb-2 text-xs font-semibold text-forest-500">Próxima ida ao mercado</p>
            <div className="flex gap-2">
              <input
                type="date"
                value={tripDateDraft}
                onChange={(e) => setTripDateDraft(e.target.value)}
                className="min-h-[40px] flex-1 rounded-xl border-[1.5px] border-forest-100 px-3 text-sm outline-none focus:border-teal-500"
              />
              <Button fullWidth={false} loading={savingTripDate} onClick={handleSaveTripDate} className="px-4 py-2">
                Salvar
              </Button>
            </div>
          </div>
          <button
            onClick={handleClearChecked}
            className="rounded-2xl border-[1.5px] border-forest-100 bg-surface p-3 text-left text-sm font-medium text-forest-900"
          >
            🧹 Limpar itens já comprados
          </button>
        </div>
      </Modal>

      <ConfirmModal
        open={confirmId !== null}
        title="Excluir item"
        message="Tem certeza que quer excluir esse item da lista?"
        onCancel={() => setConfirmId(null)}
        onConfirm={confirmRemoveItem}
      />

      <ConfirmModal
        open={confirmClear}
        title="Limpar itens comprados"
        message="Isso vai remover da lista todos os itens já marcados como comprados. Continuar?"
        confirmLabel="Limpar"
        onCancel={() => setConfirmClear(false)}
        onConfirm={confirmClearChecked}
      />

      <ConfirmModal
        open={confirmRegister}
        title="Compra concluída!"
        message={`Isso registra R$ ${checkedTotal.toFixed(0)} como gasto na categoria "Mercado" em Finanças e limpa os itens comprados da lista.`}
        confirmLabel={registering ? 'Registrando...' : 'Registrar gasto'}
        onCancel={() => setConfirmRegister(false)}
        onConfirm={confirmRegisterExpense}
      />

      <BottomNav />
    </Screen>
  )
}

function ShoppingItemRow({
  item,
  onToggle,
  onOpenActions,
}: {
  item: ShoppingItem
  onToggle: () => void
  onOpenActions: () => void
}) {
  const controls = useDragControls()
  return (
    <Reorder.Item
      as="div"
      value={item}
      dragListener={false}
      dragControls={controls}
      style={{ touchAction: 'none' }}
      className="flex items-center gap-3 rounded-sm border-[1.5px] border-forest-100 bg-surface p-3 shadow-xs"
    >
      <DragGrip onPointerDown={(e) => controls.start(e)} />
      <button onClick={onToggle} className="flex flex-1 items-center gap-3 text-left">
        <span
          className={`flex size-6 shrink-0 items-center justify-center rounded-full border-2 text-xs ${
            item.checked ? 'border-teal-500 bg-teal-500 text-white' : 'border-forest-100'
          }`}
        >
          {item.checked ? '✓' : ''}
        </span>
        <span className="flex-1">
          <span className={`block text-sm ${item.checked ? 'text-forest-500 line-through' : 'text-forest-900'}`}>
            {item.name}
            {item.quantity && <span className="text-forest-500"> · {item.quantity}</span>}
            {item.recurrence && <span title="Item recorrente"> · 🔁</span>}
          </span>
          {item.added_by_name && (
            <span className="text-xs text-forest-400">adicionado por {item.added_by_name.split(' ')[0]}</span>
          )}
        </span>
        {item.price != null && <span className="text-xs text-forest-500">R$ {item.price}</span>}
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
