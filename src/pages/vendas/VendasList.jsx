import { useState } from 'react'
import { Link } from 'react-router-dom'
import AppShell from '../../components/layout/AppShell'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import Spinner from '../../components/ui/Spinner'
import EmptyState from '../../components/ui/EmptyState'
import ErrorBanner from '../../components/ui/ErrorBanner'
import { useOrders } from '../../hooks/useOrders'
import { getDisplayPaymentStatus, PAYMENT_STATUS_LABELS, PAYMENT_STATUS_CLASSES } from '../../lib/paymentStatus'

const FILTERS = [
  { key: 'todos', label: 'Todos' },
  { key: 'pendente', label: 'Pendentes' },
  { key: 'entregue', label: 'Entregues' },
]

function formatDate(iso) {
  return new Date(iso + 'T00:00:00').toLocaleDateString('pt-BR')
}

export default function VendasList() {
  const [filter, setFilter] = useState('todos')
  const { data: orders, isLoading, error } = useOrders(filter)

  return (
    <AppShell
      title="Vendas"
      action={
        <Button to="/vendas/nova" className="!min-h-[36px] !px-3 text-xs">
          + Venda
        </Button>
      }
    >
      <div className="mb-4 flex gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`min-h-[36px] flex-1 rounded-card border px-3 text-sm font-medium ${
              filter === f.key ? 'border-primary bg-primary text-white' : 'border-hairline bg-surface text-muted'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {isLoading && <Spinner />}
      <ErrorBanner message={error?.message} />

      {orders && orders.length === 0 && (
        <EmptyState
          title="Nenhuma venda encontrada"
          description="Lance a primeira venda para um cliente."
          action={<Button to="/vendas/nova">Nova venda</Button>}
        />
      )}

      <div className="flex flex-col gap-2">
        {orders?.map((order) => {
          const paymentStatus = getDisplayPaymentStatus(order)
          return (
            <Link key={order.id} to={`/vendas/${order.id}`}>
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
