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
  const today = new Date().toISOString().slice(0, 10)
  const { data: metrics } = useDashboardMetrics(today, today)

  const lossPct =
    stock && Number(stock.total_raw_weight_kg) > 0
      ? (Number(stock.total_loss_kg) / Number(stock.total_raw_weight_kg)) * 100
      : null

  const stockWeight = stock ? Number(stock.stock_weight_kg) : 0
  const hasShortfall = Number(metrics?.raw_material_needed_kg ?? 0) > 0
  const isLowStock = Boolean(metrics?.is_low_stock)
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
          <div className="mb-4 flex flex-col gap-3">
            <Card className={`!border-transparent !text-white ${STOCK_STATUS[stockStatus].cardClass}`}>
              <div className="flex items-center justify-between">
                <p className="text-sm text-white/80">Estoque disponível</p>
                <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs font-semibold">{STOCK_STATUS[stockStatus].label}</span>
              </div>
              <p className="text-3xl font-bold">{Number(stock.stock_weight_kg).toFixed(1)} kg</p>
              <p className="text-sm text-white/80">{Number(stock.stock_quantity).toFixed(0)} unidades</p>
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

      <div className="flex flex-col gap-2">
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
    </AppShell>
  )
}
