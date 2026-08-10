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

const QUICK_LINKS = [
  { to: '/estoque', label: 'Estoque', icon: IconBox },
  { to: '/clientes', label: 'Clientes', icon: IconUsers },
  { to: '/mapa', label: 'Mapa', icon: IconMap },
]

function IconPlus() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M12 5v14M5 12h14" strokeLinecap="round" />
    </svg>
  )
}

function IconBox() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 8l-9-5-9 5 9 5 9-5z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M3 8v8l9 5 9-5V8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 13v8" strokeLinecap="round" />
    </svg>
  )
}

function IconUsers() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="9" cy="8" r="3.2" />
      <path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6" strokeLinecap="round" />
      <path d="M16 4.6c1.6.5 2.8 2 2.8 3.7 0 1.7-1.2 3.2-2.8 3.7" strokeLinecap="round" />
      <path d="M15 14c2.9.5 4.8 2.5 4.8 6" strokeLinecap="round" />
    </svg>
  )
}

function IconMap() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M9 4L3 6.5v13L9 17l6 2.5 6-2.5v-13L15 6.5 9 4z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9 4v13M15 6.5v13" strokeLinecap="round" />
    </svg>
  )
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

  const alertPillClass =
    alertLevel === 'danger'
      ? 'bg-danger/15 text-danger'
      : alertLevel === 'warning'
        ? 'bg-warning/15 text-warning'
        : 'bg-success/15 text-success'

  return (
    <AppShell>
      <ErrorBanner message={error?.message} />
      {isLoading && <Spinner />}

      {data && (
        <div className="flex flex-col gap-4">
          <div className="hero-gradient rounded-[28px] p-5 text-white shadow-[0_12px_32px_rgba(10,21,48,0.28)]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-sm font-bold">PP</span>
                <div>
                  <p className="text-sm font-semibold leading-tight">Prime Pork</p>
                  <p className="text-xs text-white/60">Painel</p>
                </div>
              </div>
              <button onClick={signOut} className="text-xs font-medium text-white/70 active:text-white">
                Sair
              </button>
            </div>

            <div className="mt-5">
              <p className="text-xs text-white/60">Receita no período</p>
              <p className="text-3xl font-bold tracking-tight">{formatMoney(data.revenue_period)}</p>
              <span className={`mt-2 inline-block rounded-full px-2.5 py-1 text-xs font-semibold ${alertPillClass}`}>
                {alertLevel === 'ok' ? 'Estoque saudável' : 'Atenção ao estoque'} · {formatKg(data.stock_weight_kg)}
              </span>
            </div>

            <div className="mt-5 flex gap-3">
              <Button to="/estoque/nova" variant="pill" className="flex-1">
                <IconPlus /> Nova compra
              </Button>
              <Button to="/vendas/nova" variant="pill" className="flex-1">
                <IconPlus /> Nova venda
              </Button>
            </div>
          </div>

          <Card>
            <div className="flex flex-col gap-1 text-sm text-ink">
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

          <div className="grid grid-cols-3 gap-3">
            {QUICK_LINKS.map(({ to, label, icon: Icon }) => (
              <Button key={to} to={to} variant="secondary" className="!min-h-0 flex-col gap-2 !rounded-card py-4 text-xs">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-bg text-primary">
                  <Icon />
                </span>
                {label}
              </Button>
            ))}
          </div>

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

            <div className="grid grid-cols-3 gap-2">
              <Card className="!p-3">
                <p className="text-xs text-muted">Pedidos</p>
                <p className="whitespace-nowrap text-lg font-bold text-ink">{data.orders_count_period}</p>
              </Card>
              <Card className="!p-3">
                <p className="text-xs text-muted">Ticket médio</p>
                <p className="whitespace-nowrap text-base font-bold text-ink">{avgTicket != null ? formatMoney(avgTicket) : '—'}</p>
              </Card>
              <Card className="!p-3">
                <p className="text-xs text-muted">Perda</p>
                <p className="whitespace-nowrap text-lg font-bold text-ink">{lossPct != null ? `${lossPct.toFixed(1)}%` : '—'}</p>
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
