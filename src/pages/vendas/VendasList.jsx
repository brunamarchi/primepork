import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import AppShell from '../../components/layout/AppShell'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import Modal from '../../components/ui/Modal'
import { inputClass } from '../../components/ui/Field'
import { SkeletonList } from '../../components/ui/Skeleton'
import EmptyState from '../../components/ui/EmptyState'
import ErrorBanner from '../../components/ui/ErrorBanner'
import { IconChevronDown, IconPlus, IconCheck } from '../../components/icons'
import { useOrders } from '../../hooks/useOrders'
import { getDisplayPaymentStatus, PAYMENT_STATUS_LABELS, PAYMENT_STATUS_CLASSES } from '../../lib/paymentStatus'
import { PERIOD_PRESETS, rangeForPreset } from '../../lib/dateRanges'

const FILTERS = [
  { key: 'todos', label: 'Todos' },
  { key: 'pendente', label: 'Pendentes' },
  { key: 'entregue', label: 'Entregues' },
  { key: 'pago', label: 'Pagas' },
  { key: 'aberto', label: 'Em aberto' },
  { key: 'no_prazo', label: 'No prazo' },
]

const SALES_PERIOD_PRESETS = [
  { key: 'todos', label: 'Todo período' },
  { key: '3meses', label: 'Últimos 3 meses' },
  ...PERIOD_PRESETS,
]

function formatMoney(value) {
  return Number(value ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function matchesFilter(order, filter) {
  if (filter === 'todos') return true
  if (filter === 'pendente') return order.status === 'pendente'
  if (filter === 'entregue') return order.status === 'entregue'
  const paymentStatus = getDisplayPaymentStatus(order)
  if (filter === 'pago') return paymentStatus === 'pago'
  if (filter === 'aberto') return paymentStatus !== 'pago'
  if (filter === 'no_prazo') return paymentStatus === 'previsto'
  return true
}

function formatDate(iso) {
  return new Date(iso + 'T00:00:00').toLocaleDateString('pt-BR')
}

export default function VendasList() {
  const [filter, setFilter] = useState('todos')
  const [period, setPeriod] = useState('3meses')
  const [custom, setCustom] = useState(null)
  const [filterModalOpen, setFilterModalOpen] = useState(false)
  const { data: orders, isLoading, error } = useOrders()

  const range = useMemo(() => (period === 'todos' ? null : rangeForPreset(period, custom)), [period, custom])

  const filteredOrders = orders?.filter((order) => {
    if (!matchesFilter(order, filter)) return false
    if (range && (order.order_date < range.from || order.order_date > range.to)) return false
    return true
  })

  const summary = useMemo(() => {
    if (!filteredOrders) return { total: 0, count: 0, kg: 0 }
    return filteredOrders.reduce(
      (acc, o) => {
        acc.total += Number(o.total_price)
        acc.kg += Number(o.weight_kg)
        acc.count += 1
        return acc
      },
      { total: 0, count: 0, kg: 0 },
    )
  }, [filteredOrders])

  return (
    <AppShell
      title="Vendas"
      action={
        <Button to="/vendas/nova" className="!min-h-[36px] !px-3 text-xs">
          + Pedido
        </Button>
      }
    >
      <div className="mb-4 grid grid-cols-3 gap-2">
        <Card className="!p-3">
          <p className="text-xs text-muted">Total vendido</p>
          <p className="whitespace-nowrap text-sm font-bold text-ink">{formatMoney(summary.total)}</p>
        </Card>
        <Card className="!p-3">
          <p className="text-xs text-muted">Pedidos</p>
          <p className="whitespace-nowrap text-lg font-bold text-ink">{summary.count}</p>
        </Card>
        <Card className="!p-3">
          <p className="text-xs text-muted">Quilos vendidos</p>
          <p className="whitespace-nowrap text-lg font-bold text-ink">{summary.kg.toFixed(1)} kg</p>
        </Card>
      </div>

      <div className="mb-3 flex gap-2">
        <div className="relative flex-1 lg:max-w-xs">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className={`${inputClass} w-full appearance-none pr-10 font-medium`}
          >
            {SALES_PERIOD_PRESETS.map((p) => (
              <option key={p.key} value={p.key}>
                {p.label}
              </option>
            ))}
          </select>
          <IconChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted" />
        </div>

        <button
          onClick={() => setFilterModalOpen(true)}
          className={`flex min-h-[44px] shrink-0 items-center gap-1.5 rounded-card border px-3 text-sm font-medium transition-all duration-150 ease-out active:scale-[0.97] ${
            filter !== 'todos' ? 'border-primary bg-primary text-white' : 'border-hairline bg-surface text-muted'
          }`}
        >
          <IconPlus />
          {filter !== 'todos' && <span className="whitespace-nowrap">{FILTERS.find((f) => f.key === filter)?.label}</span>}
        </button>
      </div>

      {period === 'personalizado' && (
        <div className="mb-3 grid grid-cols-2 gap-3 lg:max-w-xs">
          <input
            type="date"
            className={inputClass}
            value={custom?.from ?? range?.from ?? ''}
            onChange={(e) => setCustom({ from: e.target.value, to: custom?.to ?? range?.to ?? e.target.value })}
          />
          <input
            type="date"
            className={inputClass}
            value={custom?.to ?? range?.to ?? ''}
            onChange={(e) => setCustom({ from: custom?.from ?? range?.from ?? e.target.value, to: e.target.value })}
          />
        </div>
      )}

      <Modal open={filterModalOpen} onClose={() => setFilterModalOpen(false)} title="Filtrar por status">
        <div className="flex flex-col gap-1">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => {
                setFilter(f.key)
                setFilterModalOpen(false)
              }}
              className={`flex min-h-[48px] items-center justify-between rounded-card px-4 text-left text-sm font-medium transition-colors duration-150 ${
                filter === f.key ? 'bg-primary/10 text-primary' : 'text-ink active:bg-bg'
              }`}
            >
              {f.label}
              {filter === f.key && <IconCheck />}
            </button>
          ))}
        </div>
      </Modal>

      {isLoading && <SkeletonList />}
      <ErrorBanner message={error?.message} />

      {filteredOrders && filteredOrders.length === 0 && (
        <EmptyState
          title="Nenhuma venda encontrada"
          description="Lance o primeiro pedido para um cliente."
          action={<Button to="/vendas/nova">Novo pedido</Button>}
        />
      )}

      <div className="flex flex-col gap-2 lg:grid lg:grid-cols-2 lg:gap-3 xl:grid-cols-3">
        {filteredOrders?.map((order) => {
          const paymentStatus = getDisplayPaymentStatus(order)
          return (
            <Link
              key={order.id}
              to={`/vendas/${order.id}`}
              className="block transition-transform duration-150 ease-out active:scale-[0.98]"
            >
              <Card className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-ink">{order.client?.full_name ?? 'Cliente removido'}</p>
                  <p className="text-sm text-muted">
                    {formatDate(order.order_date)} · {order.weight_kg} kg · R$ {order.total_price}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span
                    className={`rounded-full px-2 py-1 text-xs font-medium ${
                      order.status === 'entregue' ? 'bg-success/15 text-success' : 'bg-warning/15 text-warning'
                    }`}
                  >
                    {order.status}
                  </span>
                  <span className={`rounded-full px-2 py-1 text-xs font-medium ${PAYMENT_STATUS_CLASSES[paymentStatus]}`}>
                    {PAYMENT_STATUS_LABELS[paymentStatus]}
                  </span>
                </div>
              </Card>
            </Link>
          )
        })}
      </div>
    </AppShell>
  )
}
