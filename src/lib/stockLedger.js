/**
 * Estoque calculado com o mesmo raciocínio da planilha original: parte do
 * último saldo real conhecido (aba "Estoque") e só ajusta com o que
 * aconteceu depois — Entrada = peso de "Rolo fatiado" lançado em Produção
 * diária, Saída = peso dos pedidos já entregues. Evita reconstruir o
 * histórico inteiro a partir de compras de matéria-prima, que a planilha
 * nunca rastreou.
 */
export function computeLedgerStock(ledger, production, orders) {
  if (!ledger || ledger.length === 0) return null

  const sorted = [...ledger].sort((a, b) => a.ledger_date.localeCompare(b.ledger_date))
  const last = sorted[sorted.length - 1]
  const baseDate = last.ledger_date
  const baseBalanceKg = Number(last.closing_balance_kg)

  const entradaAfterKg = (production ?? [])
    .filter((p) => p.production_date > baseDate)
    .reduce((sum, p) => sum + Number(p.rolo_fatiado_kg ?? 0), 0)

  const saidaAfterKg = (orders ?? [])
    .filter((o) => o.status === 'entregue' && o.order_date > baseDate)
    .reduce((sum, o) => sum + Number(o.weight_kg ?? 0), 0)

  return {
    stockKg: baseBalanceKg + entradaAfterKg - saidaAfterKg,
    baseDate,
    baseBalanceKg,
    entradaAfterKg,
    saidaAfterKg,
  }
}
