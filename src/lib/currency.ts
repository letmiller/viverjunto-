export function formatBRL(amount: number): string {
  return amount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
