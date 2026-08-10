import { useMemo, useState } from 'react'
import AppShell from '../components/layout/AppShell'
import Card from '../components/ui/Card'
import Spinner from '../components/ui/Spinner'
import ErrorBanner from '../components/ui/ErrorBanner'
import Button from '../components/ui/Button'
import { inputClass } from '../components/ui/Field'
import { useAuth } from '../hooks/useAuth'
import { useDashboardMetrics } from '../hooks/useDashboardMetrics'
import { useClientRiskSummary } from '../hooks/useClientPurchaseStats'
import { PERIOD_PRESETS, rangeForPreset } from '../lib/dateRanges'

function formatMoney(value) {
  return Number(value ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function formatKg(value) {
  return `${Number(value ?? 0).toFixed(1)} kg`
}

export default function Dashboard() {
  const { signOut } = useAuth()
  const [preset, setPreset] = useState('mes')
  const [custom, setCustom] = useState(null)
  const range = useMemo(() => rangeForPreset(preset, custom), [preset, custom])
  const { data, isLoading, error } = useDashboardMetrics(range.from, range.to)
  const { data: riskCounts } = useClientRiskSummary()

  const hasShortfall = Number(data?.raw_material_needed_kg ?? 0) > 0
  const isLowStock = Boolean(data?.is_low_stock)
  const daysRemaining = data?.days_of_stock_remaining != null ? Math.round(data.days_of_stock_remaining) : null
  const isRunningOutSoon = daysRemaining != null && daysRemaining <= 7 && !hasShortfall
  const alertLevel = hasShortfall || isLowStock ? 'danger' : isRunningOutSoon ? 'warning' : 'ok'

  const avgTicket = data && data.orders_count_period > 0 ? Number(data.revenue_period) / Number(data.orders_count_period) : null
  const lossPct = data?.avg_yield_ratio != null ? (1 - Number(data.avg_yield_ratio)) * 100 : null

  return (
    <AppShell
      title="Painel"
      action={
        <Button variant="ghost" className="!min-h-0 !px-2 text-xs" onClick={signOut}>
          Sair
        </Button>
      }
    >
      <ErrorBanner message={error?.message} />
      {isLoading && <Spinner />}

      {data && (
        <div className="flex flex-col gap-4">
          <Card
            className={
              alertLevel === 'danger'
                ? 'border-danger bg-danger/10'
                : alertLevel === 'warning'
                  ? 'border-warning bg-warning/10'
                  : 'border-success bg-success/10'
            }
          >
            <p className="text-sm font-semibold text-ink">
              {alertLevel === 'ok' ? 'Estoque saudável' : 'Atenção ao estoque'}
            </p>
            <div className="mt-1 flex flex-col gap-1 text-sm text-ink">
              <p>
                Estoque atual: <strong>{formatKg(data.stock_weight_kg)}</strong>
                {isLowStock && <span className="text-danger"> · abaixo do mínimo configurado ({formatKg(data.low_stock_threshold_kg)})</span>}
              </p>
              <p>
                Pedidos pendentes: <strong>{formatKg(data.pending_demand_kg)}</strong> ({data.pending_orders_count} pedido
                {data.pending_orders_count === 1 ? '' : 's'})
              </p>
              {daysRemaining != null && (
                <p>
                  No ritmo atual de vendas, o estoque dura <strong>~{daysRemaining} dia{daysRemaining === 1 ? '' : 's'}</strong>.
                </p>
              )}
            </div>
            {hasShortfall && (
              <p className="mt-2 text-base font-bold text-danger">
                Comprar ≈ {Number(data.raw_material_needed_kg).toFixed(1)} kg de matéria-prima
              </p>
            )}
            <Button to="/estoque/configuracoes" variant="ghost" className="!mt-2 !min-h-0 !px-0 text-xs">
              Ajustar limite de estoque baixo
            </Button>
          </Card>

          <div>
            <div className="mb-3 flex gap-2 overflow-x-auto">
              {PERIOD_PRESETS.map((p) => (
                <button
                  key={p.key}
                  onClick={() => setPreset(p.key)}
                  className={`min-h-[36px] whitespace-nowrap rounded-card border px-3 text-sm font-medium ${
                    preset === p.key ? 'border-primary bg-primary text-white' : 'border-hairline bg-surface text-muted'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {preset === 'personalizado' && (
              <div className="mb-3 grid grid-cols-2 gap-3">
                <input
                  type="date"
                  className={inputClass}
                  value={custom?.from ?? range.from}
                  onChange={(e) => setCustom({ from: e.target.value, to: custom?.to ?? range.to })}
                />
                <input
                  type="date"
                  className={inputClass}
                  value={custom?.to ?? range.to}
                  onChange={(e) => setCustom({ from: custom?.from ?? range.from, to: e.target.value })}
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <Card>
                <p className="text-sm text-muted">Pedidos no período</p>
                <p className="text-2xl font-bold text-ink">{data.orders_count_period}</p>
              </Card>
              <Card>
                <p className="text-sm text-muted">Receita no período</p>
                <p className="text-2xl font-bold text-ink">{formatMoney(data.revenue_period)}</p>
              </Card>
              <Card>
                <p className="text-sm text-muted">Ticket médio</p>
                <p className="text-2xl font-bold text-ink">{avgTicket != null ? formatMoney(avgTicket) : '—'}</p>
              </Card>
              <Card>
                <p className="text-sm text-muted">Perda de produção</p>
                <p className="text-2xl font-bold text-ink">{lossPct != null ? `${lossPct.toFixed(1)}%` : '—'}</p>
              </Card>
            </div>
          </div>

          <div>
            <p className="mb-2 text-sm font-semibold text-ink">Financeiro</p>
            <Card className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-sm text-muted">A receber</p>
                <p className="text-xl font-bold text-ink">{formatMoney(data.receivable_total)}</p>
                <p className="text-xs text-muted">
                  {data.receivable_count} pedido{data.receivable_count === 1 ? '' : 's'}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted">Atrasado</p>
                <p className={`text-xl font-bold ${Number(data.overdue_total) > 0 ? 'text-danger' : 'text-ink'}`}>
                  {formatMoney(data.overdue_total)}
                </p>
                <p className="text-xs text-muted">
                  {data.overdue_count} pedido{data.overdue_count === 1 ? '' : 's'}
                </p>
              </div>
            </Card>
          </div>

          {riskCounts && (
            <div>
              <p className="mb-2 text-sm font-semibold text-ink">Clientes</p>
              <Card className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-sm text-muted">Em risco (atrasados)</p>
                  <p className={`text-xl font-bold ${riskCounts.red > 0 ? 'text-danger' : 'text-ink'}`}>{riskCounts.red}</p>
                </div>
                <div>
                  <p className="text-sm text-muted">Recompra próxima</p>
                  <p className="text-xl font-bold text-warning">{riskCounts.yellow}</p>
                </div>
              </Card>
              <Button to="/mapa" variant="ghost" className="!mt-1 !min-h-0 !px-0 text-xs">
                Ver no mapa
              </Button>
            </div>
          )}
        </div>
      )}
    </AppShell>
  )
}
