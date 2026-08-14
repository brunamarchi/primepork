import { Link } from 'react-router-dom'
import AppShell from '../../components/layout/AppShell'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import { SkeletonCard, SkeletonList } from '../../components/ui/Skeleton'
import EmptyState from '../../components/ui/EmptyState'
import ErrorBanner from '../../components/ui/ErrorBanner'
import { useStockSummary } from '../../hooks/useStockSummary'
import { usePurchases } from '../../hooks/usePurchases'
import { useDashboardMetrics } from '../../hooks/useDashboardMetrics'
import { useStockLedger } from '../../hooks/useStockLedger'
import { useOrders } from '../../hooks/useOrders'
import { useDailyProductionList } from '../../hooks/useDailyProduction'
import { computeLedgerStock } from '../../lib/stockLedger'

function ChevronRight() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="shrink-0 text-muted/60">
      <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function formatDate(iso) {
  return new Date(iso + 'T00:00:00').toLocaleDateString('pt-BR')
}

const STOCK_STATUS = {
  danger: { cardClass: '!bg-danger', label: 'Estoque negativo' },
  warning: { cardClass: '!bg-warning', label: 'Risco de ficar em falta' },
  success: { cardClass: '!bg-success', label: 'Estoque saudável' },
}

function lossBadgeClass(pct) {
  if (pct <= 35) return 'bg-success/15 text-success'
  if (pct <= 45) return 'bg-warning/15 text-warning'
  return 'bg-danger/15 text-danger'
}

export default function EstoqueList() {
  const { data: stock, isLoading: loadingStock, error: stockError } = useStockSummary()
  const { data: purchases, isLoading: loadingPurchases, error: purchasesError } = usePurchases()
  const { data: ledger } = useStockLedger()
  const { data: allOrders } = useOrders()
  const { data: production } = useDailyProductionList()
  const today = new Date().toISOString().slice(0, 10)
  const { data: metrics } = useDashboardMetrics(today, today)

  const lossPct =
    stock && Number(stock.total_raw_weight_kg) > 0
      ? (Number(stock.total_loss_kg) / Number(stock.total_raw_weight_kg)) * 100
      : null

  const ledgerStock = computeLedgerStock(ledger, production, allOrders)
  const stockWeight = ledgerStock ? ledgerStock.stockKg : stock ? Number(stock.stock_weight_kg) : 0
  const pendingDemandKg = Number(metrics?.pending_demand_kg ?? 0)
  const lowStockThresholdKg = Number(metrics?.low_stock_threshold_kg ?? 0)
  const hasShortfall = pendingDemandKg > stockWeight
  const isLowStock = stockWeight < lowStockThresholdKg
  const stockStatus = stockWeight <= 0 ? 'danger' : hasShortfall || isLowStock ? 'warning' : 'success'

  return (
    <AppShell
      title="Estoque"
      action={
        <div className="flex items-center gap-2">
          <Button to="/estoque/configuracoes" variant="secondary" className="!min-h-[36px] !px-3 text-xs">
            Config.
          </Button>
          <Button to="/estoque/nova" className="!min-h-[36px] !px-3 text-xs">
            + Compra
          </Button>
        </div>
      }
    >
      <ErrorBanner message={stockError?.message} />
      {loadingStock ? (
        <div className="mb-4 grid grid-cols-2 gap-3">
          <SkeletonCard className="col-span-2 h-24" />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : (
        stock && (
          <div className="mb-4 grid grid-cols-1 gap-3 lg:grid-cols-[1.3fr_1fr]">
            <Card className={`!border-transparent !text-white ${STOCK_STATUS[stockStatus].cardClass}`}>
              <div className="flex items-center justify-between">
                <p className="text-sm text-white/80">Estoque disponível</p>
                <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs font-semibold">{STOCK_STATUS[stockStatus].label}</span>
              </div>
              <p className="text-3xl font-bold">{stockWeight.toFixed(1)} kg</p>
              {ledgerStock ? (
                <p className="text-sm text-white/80">
                  Saldo de {formatDate(ledgerStock.baseDate)} ({ledgerStock.baseBalanceKg.toFixed(1)} kg)
                  {ledgerStock.entradaAfterKg > 0 && ` + ${ledgerStock.entradaAfterKg.toFixed(1)} kg produzidos`}
                  {ledgerStock.saidaAfterKg > 0 && ` − ${ledgerStock.saidaAfterKg.toFixed(1)} kg vendidos`}
                </p>
              ) : (
                stock && <p className="text-sm text-white/80">{Number(stock.stock_quantity).toFixed(0)} unidades</p>
              )}
            </Card>
            {lossPct != null && (
              <Card className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-sm text-muted">Matéria-prima total comprada</p>
                  <p className="font-semibold text-ink">{Number(stock.total_raw_weight_kg).toFixed(1)} kg</p>
                </div>
                <div>
                  <p className="text-sm text-muted">Perda de produção</p>
                  <p className="font-semibold text-danger">
                    {Number(stock.total_loss_kg).toFixed(1)} kg ({lossPct.toFixed(1)}%)
                  </p>
                </div>
              </Card>
            )}
          </div>
        )
      )}

      <p className="mb-2 text-sm font-semibold text-ink">Histórico de compras</p>
      <ErrorBanner message={purchasesError?.message} />
      {loadingPurchases && <SkeletonList />}

      {purchases && purchases.length === 0 && (
        <EmptyState
          title="Nenhuma compra registrada"
          description="Registre a primeira compra de matéria-prima."
          action={<Button to="/estoque/nova">Registrar compra</Button>}
        />
      )}

      <div className="flex flex-col gap-2 lg:grid lg:grid-cols-2 lg:gap-3 xl:grid-cols-3">
        {purchases?.map((p) => {
          const loss = Number(p.raw_weight_kg) - Number(p.yield_weight_kg)
          const pct = (loss / Number(p.raw_weight_kg)) * 100
          return (
            <Link
              key={p.id}
              to={`/estoque/${p.id}`}
              className="block transition-transform duration-150 ease-out active:scale-[0.98]"
            >
              <Card className="flex items-center gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-muted">{formatDate(p.purchase_date)}</p>
                  <p className="text-lg font-bold text-ink">Rendeu {Number(p.yield_weight_kg).toFixed(1)} kg</p>
                  <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="text-xs text-muted">{Number(p.raw_weight_kg).toFixed(1)} kg comprados</span>
                    <span className="text-xs text-muted">· {Number(p.yield_quantity).toFixed(0)} un.</span>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${lossBadgeClass(pct)}`}>
                      perda {pct.toFixed(1)}%
                    </span>
                  </div>
                </div>
                <ChevronRight />
              </Card>
            </Link>
          )
        })}
      </div>

      {ledger && ledger.length > 0 && (
        <div className="mt-6">
          <p className="mb-1 text-sm font-semibold text-ink">Histórico da planilha</p>
          <p className="mb-2 text-xs text-muted">
            Livro-razão diário importado da planilha original. Último saldo conhecido:{' '}
            <strong>{Number(ledger[0].closing_balance_kg).toFixed(2)} kg</strong> em {formatDate(ledger[0].ledger_date)}.
          </p>
          <div className="overflow-x-auto rounded-card border border-hairline bg-surface">
            <table className="w-full min-w-[480px] text-sm">
              <thead>
                <tr className="border-b border-hairline text-left text-xs text-muted">
                  <th className="px-3 py-2 font-medium">Data</th>
                  <th className="px-3 py-2 font-medium">Saldo inicial</th>
                  <th className="px-3 py-2 font-medium">Entrada</th>
                  <th className="px-3 py-2 font-medium">Saída</th>
                  <th className="px-3 py-2 font-medium">Saldo final</th>
                </tr>
              </thead>
              <tbody>
                {ledger.map((row) => (
                  <tr key={row.id} className="border-b border-hairline last:border-0">
                    <td className="whitespace-nowrap px-3 py-2 text-ink">{formatDate(row.ledger_date)}</td>
                    <td className="whitespace-nowrap px-3 py-2 text-muted">
                      {row.opening_balance_kg != null ? `${Number(row.opening_balance_kg).toFixed(2)} kg` : '—'}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 text-success">
                      {row.incoming_kg != null ? `+${Number(row.incoming_kg).toFixed(2)} kg` : '—'}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 text-danger">
                      {row.outgoing_kg != null ? `−${Number(row.outgoing_kg).toFixed(2)} kg` : '—'}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 font-semibold text-ink">
                      {row.closing_balance_kg != null ? `${Number(row.closing_balance_kg).toFixed(2)} kg` : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </AppShell>
  )
}
