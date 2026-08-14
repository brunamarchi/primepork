import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import AppShell from '../../components/layout/AppShell'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import { inputClass } from '../../components/ui/Field'
import { SkeletonList } from '../../components/ui/Skeleton'
import EmptyState from '../../components/ui/EmptyState'
import ErrorBanner from '../../components/ui/ErrorBanner'
import { IconChevronDown } from '../../components/icons'
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

const SALES_PERIOD_PRESETS = [{ key: 'todos', label: 'Todo período' }, ...PERIOD_PRESETS]

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
  const [period, setPeriod] = useState('todos')
  const [custom, setCustom] = useState(null)
  const { data: orders, isLoading, error } = useOrders()

  const range = useMemo(() => (period === 'todos' ? null : rangeForPreset(period, custom)), [period, custom])

  const filteredOrders = orders?.filter((order) => {
    if (!matchesFilter(order, filter)) return false
    if (range && (order.order_date < range.from || order.order_date > range.to)) return false
    return true
  })

  return (
    <AppShell
      title="Vendas"
      action={
        <Button to="/vendas/nova" className="!min-h-[36px] !px-3 text-xs">
          + Venda
        </Button>
      }
    >
      <div className="relative mb-3 lg:max-w-xs">
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

      <div className="mb-4 flex gap-2 overflow-x-auto">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`min-h-[36px] whitespace-nowrap rounded-card border px-3 text-sm font-medium transition-all duration-150 ease-out active:scale-[0.97] ${
              filter === f.key ? 'border-primary bg-primary text-white' : 'border-hairline bg-surface text-muted'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {isLoading && <SkeletonList />}
      <ErrorBanner message={error?.message} />

      {filteredOrders && filteredOrders.length === 0 && (
        <EmptyState
          title="Nenhuma venda encontrada"
          description="Lance a primeira venda para um cliente."
          action={<Button to="/vendas/nova">Nova venda</Button>}
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
