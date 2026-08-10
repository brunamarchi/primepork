import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import AppShell from '../../components/layout/AppShell'
import OrderFieldsForm from '../../components/OrderFieldsForm'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Spinner from '../../components/ui/Spinner'
import ErrorBanner from '../../components/ui/ErrorBanner'
import { useOrder, useUpdateOrder, useUpdateOrderStatus } from '../../hooks/useOrders'
import { useToast } from '../../hooks/useToast'
import { getDisplayPaymentStatus, PAYMENT_STATUS_LABELS, PAYMENT_STATUS_CLASSES } from '../../lib/paymentStatus'

function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso + 'T00:00:00').toLocaleDateString('pt-BR')
}

export default function PedidoDetalhe() {
  const { id } = useParams()
  const [editing, setEditing] = useState(false)
  const { data: order, isLoading } = useOrder(id)
  const updateStatus = useUpdateOrderStatus()
  const updateOrder = useUpdateOrder()
  const showToast = useToast()

  if (isLoading || !order) {
    return (
      <AppShell title="Pedido">
        <Spinner />
      </AppShell>
    )
  }

  if (editing) {
    return (
      <AppShell title="Editar pedido">
        <div className="lg:max-w-xl">
          <OrderFieldsForm
            initialValues={order}
            submitLabel="Salvar alterações"
            submitting={updateOrder.isPending}
            error={updateOrder.error?.message}
            onSubmit={async (fields) => {
              await updateOrder.mutateAsync({ id, fields })
              showToast('Pedido atualizado com sucesso.')
              setEditing(false)
            }}
          />
        </div>
      </AppShell>
    )
  }

  const paymentStatus = getDisplayPaymentStatus(order)

  return (
    <AppShell
      title="Detalhe do pedido"
      action={
        <Button variant="secondary" className="!min-h-[36px] !px-3 text-xs" onClick={() => setEditing(true)}>
          Editar
        </Button>
      }
    >
      <div className="flex flex-col gap-4 lg:max-w-xl">
        <Card>
          <p className="text-sm text-muted">Cliente</p>
          <Link to={`/clientes/${order.client_id}`} className="font-semibold text-primary">
            {order.client?.full_name ?? 'Cliente removido'}
          </Link>
        </Card>

        <Card className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-sm text-muted">Data</p>
            <p className="font-medium text-ink">{formatDate(order.order_date)}</p>
          </div>
          <div>
            <p className="text-sm text-muted">Status da entrega</p>
            <span
              className={`inline-block rounded-full px-2 py-1 text-xs font-medium ${
                order.status === 'entregue' ? 'bg-success/15 text-success' : 'bg-warning/15 text-warning'
              }`}
            >
              {order.status}
            </span>
          </div>
          <div>
            <p className="text-sm text-muted">Quantidade</p>
            <p className="font-medium text-ink">{order.quantity} un.</p>
          </div>
          <div>
            <p className="text-sm text-muted">Peso</p>
            <p className="font-medium text-ink">{order.weight_kg} kg</p>
          </div>
          <div>
            <p className="text-sm text-muted">Valor total</p>
            <p className="font-medium text-ink">R$ {order.total_price}</p>
          </div>
          <div>
            <p className="text-sm text-muted">Pagamento</p>
            <span className={`inline-block rounded-full px-2 py-1 text-xs font-medium ${PAYMENT_STATUS_CLASSES[paymentStatus]}`}>
              {PAYMENT_STATUS_LABELS[paymentStatus]}
            </span>
            {paymentStatus !== 'pago' && order.payment_due_date && (
              <p className="mt-1 text-xs text-muted">Previsto para {formatDate(order.payment_due_date)}</p>
            )}
          </div>
        </Card>

        {order.notes && (
          <Card>
            <p className="text-sm text-muted">Observações</p>
            <p className="text-ink">{order.notes}</p>
          </Card>
        )}

        <ErrorBanner message={updateStatus.error?.message} />

        {order.status === 'pendente' && (
          <Button
            disabled={updateStatus.isPending}
            onClick={() =>
              updateStatus.mutate(
                { id: order.id, status: 'entregue' },
                { onSuccess: () => showToast('Pedido marcado como entregue.') },
              )
            }
          >
            {updateStatus.isPending ? 'Atualizando…' : 'Marcar como entregue'}
          </Button>
        )}
        {order.status === 'entregue' && (
          <Button
            variant="secondary"
            disabled={updateStatus.isPending}
            onClick={() =>
              updateStatus.mutate(
                { id: order.id, status: 'pendente' },
                { onSuccess: () => showToast('Pedido revertido para pendente.') },
              )
            }
          >
            Reverter para pendente
          </Button>
        )}
      </div>
    </AppShell>
  )
}
