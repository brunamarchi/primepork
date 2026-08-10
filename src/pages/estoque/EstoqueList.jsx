import { Link } from 'react-router-dom'
import AppShell from '../../components/layout/AppShell'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import Spinner from '../../components/ui/Spinner'
import EmptyState from '../../components/ui/EmptyState'
import ErrorBanner from '../../components/ui/ErrorBanner'
import { useStockSummary } from '../../hooks/useStockSummary'
import { usePurchases } from '../../hooks/usePurchases'

function formatDate(iso) {
  return new Date(iso + 'T00:00:00').toLocaleDateString('pt-BR')
}

export default function EstoqueList() {
  const { data: stock, isLoading: loadingStock, error: stockError } = useStockSummary()
  const { data: purchases, isLoading: loadingPurchases, error: purchasesError } = usePurchases()

  const lossPct =
    stock && Number(stock.total_raw_weight_kg) > 0
      ? (Number(stock.total_loss_kg) / Number(stock.total_raw_weight_kg)) * 100
      : null

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
        <Spinner />
      ) : (
        stock && (
          <div className="mb-4 flex flex-col gap-3">
            <Card className="bg-primary text-white">
              <p className="text-sm text-white/80">Estoque disponível</p>
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
      {loadingPurchases && <Spinner />}

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
            <Link key={p.id} to={`/estoque/${p.id}`}>
              <Card>
                <div className="flex items-center justify-between">
                  <p className="font-medium text-ink">{formatDate(p.purchase_date)}</p>
                  <p className="text-sm text-muted">{Number(p.raw_weight_kg).toFixed(1)} kg matéria-prima</p>
                </div>
                <p className="text-sm text-muted">
                  Rendeu {Number(p.yield_weight_kg).toFixed(1)} kg ({Number(p.yield_quantity).toFixed(0)} un.) · perda{' '}
                  {loss.toFixed(1)} kg ({pct.toFixed(1)}%)
                </p>
              </Card>
            </Link>
          )
        })}
      </div>
    </AppShell>
  )
}
