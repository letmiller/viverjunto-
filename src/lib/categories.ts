import type { CategoryOption } from '../components/ui/CategoryPicker'

// Shared between SharedFinancesPage (transactions) and BillsCard (bills) so
// a bill's category and a manual transaction's category are the same
// vocabulary — that's what lets "onde está indo o dinheiro" aggregate both.
export const EXPENSE_CATEGORY_PRESETS: CategoryOption[] = [
  { id: 'moradia', icon: '🏠', label: 'Moradia' },
  { id: 'alimentacao', icon: '🍽️', label: 'Alimentação' },
  { id: 'transporte', icon: '🚗', label: 'Transporte' },
  { id: 'lazer', icon: '🎉', label: 'Lazer' },
  { id: 'saude', icon: '💊', label: 'Saúde' },
  { id: 'contas', icon: '💳', label: 'Contas' },
]

export const INCOME_CATEGORY_PRESETS: CategoryOption[] = [
  { id: 'salario', icon: '💼', label: 'Salário' },
  { id: 'freelance', icon: '💻', label: 'Freelance' },
  { id: 'reembolso', icon: '🔄', label: 'Reembolso' },
  { id: 'presente', icon: '🎁', label: 'Presente' },
  { id: 'rendimento', icon: '📈', label: 'Rendimento' },
  { id: 'outros', icon: '🏷️', label: 'Outros' },
]

export function categoryIcon(label: string): string {
  return [...EXPENSE_CATEGORY_PRESETS, ...INCOME_CATEGORY_PRESETS].find((c) => c.label === label)?.icon ?? '🏷️'
}
