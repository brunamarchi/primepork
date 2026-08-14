import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import AppShell from '../components/layout/AppShell'
import Card from '../components/ui/Card'
import Spinner from '../components/ui/Spinner'
import ErrorBanner from '../components/ui/ErrorBanner'
import Button from '../components/ui/Button'
import { inputClass } from '../components/ui/Field'
import { useAuth } from '../hooks/useAuth'
import { useDashboardMetrics } from '../hooks/useDashboardMetrics'
import { useClientRiskSummary } from '../hooks/useClientPurchaseStats'
import { useOrders } from '../hooks/useOrders'
import { useStockLedger } from '../hooks/useStockLedger'
import { useDailyProductionList } from '../hooks/useDailyProduction'
import { PERIOD_PRESETS, rangeForPreset } from '../lib/dateRanges'
import { computeLedgerStock } from '../lib/stockLedger'
import { getDisplayPaymentStatus } from '../lib/paymentStatus'
import DashboardCharts from '../components/charts/DashboardCharts'

function formatMoney(value) {
  return Number(value ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function formatKg(value) {
  return `${Number(value ?? 0).toFixed(1)} kg`
}

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

function IconChevronRight({ className = '' }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className={`shrink-0 ${className}`}>
      <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function IconChevronDown({ className = '' }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className={`shrink-0 ${className}`}>
      <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function IconAlertTriangle() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 3.5 21.5 20h-19L12 3.5z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 10v4.5" strokeLinecap="round" />
      <circle cx="12" cy="17.5" r="0.9" fill="currentColor" stroke="none" />
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
  const { data: allOrders } = useOrders()
  const { data: ledger } = useStockLedger()
  const { data: production } = useDailyProductionList()

  const periodOrders = useMemo(
    () => allOrders?.filter((o) => o.order_date >= range.from && o.order_date <= range.to),
    [allOrders, range.from, range.to],
  )

  const ledgerStock = computeLedgerStock(ledger, production, allOrders)
  const stockWeightKg = ledgerStock ? ledgerStock.stockKg : Number(data?.stock_weight_kg ?? 0)
  const pendingDemandKg = Number(data?.pending_demand_kg ?? 0)
  const lowStockThresholdKg = Number(data?.low_stock_threshold_kg ?? 0)
  const avgDailySalesKg = Number(data?.avg_daily_sales_kg ?? 0)

  const shortfallKg = Math.max(pendingDemandKg - stockWeightKg, 0)
  const hasShortfall = shortfallKg > 0
  const isLowStock = stockWeightKg < lowStockThresholdKg
  const daysRemaining = avgDailySalesKg > 0 ? Math.round(stockWeightKg / avgDailySalesKg) : null
  const isRunningOutSoon = daysRemaining != null && daysRemaining <= 7 && !hasShortfall
  const alertLevel = hasShortfall || isLowStock ? 'danger' : isRunningOutSoon ? 'warning' : 'ok'

  const avgTicket = data && data.orders_count_period > 0 ? Number(data.revenue_period) / Number(data.orders_count_period) : null
  const lossPct = data?.avg_yield_ratio != null ? (1 - Number(data.avg_yield_ratio)) * 100 : null

  const { receivable, overdue } = useMemo(() => {
    const acc = { receivable: { total: 0, count: 0 }, overdue: { total: 0, count: 0 } }
    for (const o of allOrders ?? []) {
      const status = getDisplayPaymentStatus(o)
      if (status === 'previsto') {
        acc.receivable.total += Number(o.total_price)
        acc.receivable.count += 1
      } else if (status === 'atrasado') {
        acc.overdue.total += Number(o.total_price)
        acc.overdue.count += 1
      }
    }
    return acc
  }, [allOrders])

  const alertPillClass =
    alertLevel === 'danger'
      ? 'bg-danger/15 text-danger'
      : alertLevel === 'warning'
        ? 'bg-warning/15 text-warning'
        : 'bg-success/15 text-success'

  const stockStatus = stockWeightKg <= 0 ? 'danger' : hasShortfall || isLowStock ? 'warning' : 'success'
  const stockStatusIconClass = {
    danger: 'bg-danger/15 text-danger',
    warning: 'bg-warning/15 text-warning',
    success: 'bg-success/15 text-success',
  }[stockStatus]
  const stockStatusBadge = {
    danger: <span className="rounded-full bg-danger/15 px-2 py-0.5 text-xs font-semibold text-danger">negativo</span>,
    warning: <span className="rounded-full bg-warning/15 px-2 py-0.5 text-xs font-semibold text-warning">baixo</span>,
    success: null,
  }[stockStatus]

  return (
    <AppShell>
      <ErrorBanner message={error?.message} />
      {isLoading && <Spinner />}

      {data && (
        <div className="flex flex-col gap-4 lg:gap-6">
          <div className="hero-gradient rounded-[28px] p-5 text-white shadow-[0_12px_32px_rgba(10,21,48,0.28)] lg:p-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-sm font-bold lg:hidden">
                  PP
                </span>
                <div>
                  <p className="text-sm font-semibold leading-tight lg:hidden">Prime Pork</p>
                  <p className="text-xs text-white/60 lg:hidden">Painel</p>
                  <p className="hidden text-lg font-semibold lg:block">Visão geral do negócio</p>
                </div>
              </div>
              <button onClick={signOut} className="text-xs font-medium text-white/70 active:text-white lg:hidden">
                Sair
              </button>
            </div>

            <div className="lg:mt-6 lg:flex lg:items-end lg:justify-between lg:gap-8">
              <div className="mt-5 lg:mt-0">
                <p className="text-xs text-white/60 lg:text-sm">Receita no período</p>
                <p className="text-3xl font-bold tracking-tight lg:text-5xl">{formatMoney(data.revenue_period)}</p>
                <span className={`mt-2 inline-block rounded-full px-2.5 py-1 text-xs font-semibold ${alertPillClass}`}>
                  {alertLevel === 'ok' ? 'Estoque saudável' : 'Atenção ao estoque'}
                </span>
              </div>

              <div className="mt-5 flex gap-3 lg:mt-0 lg:shrink-0">
                <Button to="/estoque/nova" variant="pill" className="flex-1 lg:flex-none lg:px-6">
                  <IconPlus /> Nova compra
                </Button>
                <Button to="/vendas/nova" variant="success" className="flex-1 lg:flex-none lg:px-6">
                  <IconPlus /> Novo pedido
                </Button>
              </div>
            </div>
          </div>

          {hasShortfall && (
            <Link to="/producao/nova" className="block transition-transform duration-150 ease-out active:scale-[0.98]">
              <Card className="!border-danger/30 !bg-danger/10 flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-danger/15 text-danger">
                  <IconAlertTriangle />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-danger">Produzir mais torresmo</p>
                  <p className="text-sm text-danger/80">≈ {shortfallKg.toFixed(1)} kg necessários para atender a demanda pendente</p>
                </div>
                <IconChevronRight className="mt-2 text-danger/50" />
              </Card>
            </Link>
          )}

          <div className="lg:grid lg:grid-cols-2 lg:items-start lg:gap-4">
            <div>
              <p className="mb-2 text-sm font-semibold text-ink">Financeiro</p>
              <Card className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-sm text-muted">A receber (no prazo)</p>
                  <p className="text-xl font-bold text-ink">{formatMoney(receivable.total)}</p>
                  <p className="text-xs text-muted">
                    {receivable.count} pedido{receivable.count === 1 ? '' : 's'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted">Atrasado</p>
                  <p className={`text-xl font-bold ${overdue.total > 0 ? 'text-danger' : 'text-ink'}`}>{formatMoney(overdue.total)}</p>
                  <p className="text-xs text-muted">
                    {overdue.count} pedido{overdue.count === 1 ? '' : 's'}
                  </p>
                </div>
              </Card>
            </div>

            <Link to="/estoque" className="mt-4 block transition-transform duration-150 ease-out active:scale-[0.98] lg:mt-0">
              <p className="mb-2 text-sm font-semibold text-ink">Estoque</p>
              <Card className="flex items-center gap-3">
                <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${stockStatusIconClass}`}>
                  <IconBox />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-muted">Disponível</p>
                  <div className="flex items-baseline gap-2">
                    <p className="text-xl font-bold text-ink">{formatKg(stockWeightKg)}</p>
                    {stockStatusBadge}
                  </div>
                </div>
                <IconChevronRight className="text-muted/60" />
              </Card>
            </Link>

            <div className="mt-4 grid grid-cols-2 gap-3 lg:mt-4">
              <Card className="!p-3">
                <p className="text-xs text-muted">Pedidos pendentes</p>
                <p className="whitespace-nowrap text-lg font-bold text-ink">{formatKg(data.pending_demand_kg)}</p>
                <p className="text-xs text-muted">
                  {data.pending_orders_count} pedido{data.pending_orders_count === 1 ? '' : 's'}
                </p>
              </Card>
              <Card className="!p-3">
                <p className="text-xs text-muted">Estoque dura</p>
                <p className="whitespace-nowrap text-lg font-bold text-ink">{daysRemaining != null ? `~${daysRemaining} dia${daysRemaining === 1 ? '' : 's'}` : '—'}</p>
                <Button to="/estoque/configuracoes" variant="ghost" className="!mt-0 !min-h-0 !px-0 text-xs">
                  Ajustar limite
                </Button>
              </Card>
            </div>

            {riskCounts && (
              <div className="mt-4 lg:mt-4">
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

          <div className="lg:flex lg:items-start lg:gap-6">
            <div className="relative lg:w-56 lg:shrink-0">
              <select
                value={preset}
                onChange={(e) => setPreset(e.target.value)}
                className={`${inputClass} w-full appearance-none pr-10 font-medium`}
              >
                {PERIOD_PRESETS.map((p) => (
                  <option key={p.key} value={p.key}>
                    {p.label}
                  </option>
                ))}
              </select>
              <IconChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted" />

              {preset === 'personalizado' && (
                <div className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-1">
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
            </div>

            <div className="mt-3 grid grid-cols-3 gap-2 lg:mt-0 lg:flex-1">
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

          <DashboardCharts periodOrders={periodOrders} allOrders={allOrders} ledger={ledger} production={production} />
        </div>
      )}
    </AppShell>
  )
}
