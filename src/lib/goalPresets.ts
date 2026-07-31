import iconOrganizarContas from '../assets/goals/g-organizar-contas.webp'
import iconOrganizacaoCasa from '../assets/goals/g-organizacao-casa.webp'
import iconEsquecimentos from '../assets/goals/g-esquecimentos.webp'
import iconDividirTarefas from '../assets/goals/g-dividir-tarefas.webp'
import iconAnsiedadeFinanceira from '../assets/goals/g-ansiedade-financeira.webp'
import iconSonhos from '../assets/goals/g-sonhos.webp'
import iconDividas from '../assets/goals/g-dividas.webp'
import iconCompras from '../assets/goals/g-compras.webp'
import iconReserva from '../assets/goals/g-reserva.webp'
import iconRotina from '../assets/goals/g-rotina.webp'
import iconGastos from '../assets/goals/g-gastos.webp'
import iconGuardarDinheiro from '../assets/goals/g-guardar-dinheiro.webp'

export type GoalAccent = 'teal' | 'coral' | 'amber'

export interface GoalPreset {
  id: string
  title: string
  icon: string
  emoji: string
  accent: GoalAccent
}

export const GOAL_PRESETS: GoalPreset[] = [
  { id: 'organizar-contas', title: 'Organizar contas', icon: iconOrganizarContas, emoji: '📋', accent: 'teal' },
  { id: 'organizacao-casa', title: 'Organização da casa', icon: iconOrganizacaoCasa, emoji: '🏠', accent: 'teal' },
  { id: 'esquecimentos', title: 'Reduzir esquecimentos', icon: iconEsquecimentos, emoji: '💡', accent: 'teal' },
  { id: 'dividir-tarefas', title: 'Dividir tarefas', icon: iconDividirTarefas, emoji: '⚖️', accent: 'teal' },
  {
    id: 'ansiedade-financeira',
    title: 'Reduzir ansiedade financeira',
    icon: iconAnsiedadeFinanceira,
    emoji: '🧘',
    accent: 'teal',
  },
  { id: 'sonhos', title: 'Planejar sonhos', icon: iconSonhos, emoji: '✨', accent: 'teal' },
  { id: 'dividas', title: 'Sair das dívidas', icon: iconDividas, emoji: '📉', accent: 'coral' },
  { id: 'compras', title: 'Planejar compras', icon: iconCompras, emoji: '🛒', accent: 'teal' },
  { id: 'reserva', title: 'Criar reserva', icon: iconReserva, emoji: '🛡️', accent: 'amber' },
  { id: 'rotina', title: 'Equilibrar rotina', icon: iconRotina, emoji: '⚖️', accent: 'teal' },
  { id: 'gastos', title: 'Controlar gastos', icon: iconGastos, emoji: '💸', accent: 'coral' },
  { id: 'guardar-dinheiro', title: 'Guardar dinheiro', icon: iconGuardarDinheiro, emoji: '💰', accent: 'amber' },
]

export const GOAL_ACCENT_CLASSES: Record<GoalAccent, string> = {
  teal: 'border-teal-500 shadow-[0px_3px_5px_0px_rgba(107,166,160,0.14)]',
  coral: 'border-coral-700 shadow-[0px_3px_5px_0px_rgba(255,138,122,0.14)]',
  amber: 'border-amber-700 shadow-[0px_2px_3px_0px_rgba(46,58,55,0.04)]',
}
