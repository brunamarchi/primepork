import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import AppShell from '../../components/layout/AppShell'
import ClientForm from '../../components/ClientForm'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Spinner from '../../components/ui/Spinner'
import ErrorBanner from '../../components/ui/ErrorBanner'
import { useClient, useUpdateClient, useRetryGeocode } from '../../hooks/useClients'
import { useClientPurchaseStat } from '../../hooks/useClientPurchaseStats'
import { useToast } from '../../hooks/useToast'
import { supabase } from '../../lib/supabaseClient'

function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso + 'T00:00:00').toLocaleDateString('pt-BR')
}

export default function ClienteDetalhe() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [editing, setEditing] = useState(false)
  const { data: client, isLoading } = useClient(id)
  const { data: stats } = useClientPurchaseStat(id)
  const updateClient = useUpdateClient()
  const retryGeocode = useRetryGeocode()
  const showToast = useToast()

  const { data: orders } = useQuery({
    queryKey: ['orders', 'byClient', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('client_id', id)
        .order('order_date', { ascending: false })
      if (error) throw error
      return data
    },
    enabled: !!id,
  })

  if (isLoading || !client) {
    return (
      <AppShell title="Cliente">
        <Spinner />
      </AppShell>
    )
  }

  if (editing) {
    return (
      <AppShell title="Editar cliente">
        <div className="lg:max-w-xl">
          <ClientForm
            initialValues={client}
            submitLabel="Salvar alterações"
            submitting={updateClient.isPending}
            error={updateClient.error?.message}
            onSubmit={async (fields) => {
              await updateClient.mutateAsync({ id, fields, previous: client })
              showToast('Cliente atualizado com sucesso.')
              setEditing(false)
            }}
          />
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell
      title={client.full_name}
      action={
        <Button variant="secondary" className="!min-h-[36px] !px-3 text-xs" onClick={() => setEditing(true)}>
          Editar
        </Button>
      }
    >
      <div className="flex flex-col gap-4 lg:max-w-xl">
        <Card>
          <p className="text-sm text-muted">Telefone</p>
          <p className="font-medium text-ink">{client.phone}</p>
          {client.document && (
            <>
              <p className="mt-2 text-sm text-muted">CPF/CNPJ</p>
              <p className="font-medium text-ink">{client.document}</p>
            </>
          )}
          {client.contact_name && (
            <>
              <p className="mt-2 text-sm text-muted">Contato</p>
              <p className="font-medium text-ink">{client.contact_name}</p>
            </>
          )}
          {(client.address_street || client.address_neighborhood || client.address_zip) && (
            <>
              <p className="mt-2 text-sm text-muted">Endereço</p>
              <p className="font-medium text-ink">
                {[client.address_street, client.address_neighborhood, client.address_zip].filter(Boolean).join(' · ')}
              </p>
            </>
          )}
          {(client.payment_term || client.current_price != null) && (
            <div className="mt-2 grid grid-cols-2 gap-3">
              {client.payment_term && (
                <div>
                  <p className="text-sm text-muted">Prazo de pagamento</p>
                  <p className="font-medium text-ink">{client.payment_term}</p>
                </div>
              )}
              {client.current_price != null && (
                <div>
                  <p className="text-sm text-muted">Preço atual</p>
                  <p className="font-medium text-ink">R$ {Number(client.current_price).toFixed(2)}/kg</p>
                </div>
              )}
            </div>
          )}
        </Card>

        <Card>
          <p className="mb-2 text-sm font-semibold text-ink">Histórico de compras</p>
          {!stats || stats.order_count === 0 ? (
            <p className="text-sm text-muted">Nenhuma compra registrada ainda.</p>
          ) : (
            <div className="flex flex-col gap-1 text-sm">
              <p>
                <span className="text-muted">Última compra: </span>
                {formatDate(stats.last_order_date)}
              </p>
              <p>
                <span className="text-muted">Quantidade da última compra: </span>
                {stats.last_order_weight_kg} kg
              </p>
              {stats.avg_interval_days != null ? (
                <p>
                  <span className="text-muted">Intervalo médio entre compras: </span>
                  {Math.round(stats.avg_interval_days)} dias
                </p>
              ) : (
                <p className="text-muted">Ainda não há compras suficientes para prever recompra.</p>
              )}
            </div>
          )}
        </Card>

        <Card>
          <p className="mb-2 text-sm font-semibold text-ink">Localização no mapa</p>
          {client.geocode_status === 'success' && <p className="text-sm text-success">Localizado com sucesso.</p>}
          {client.geocode_status === 'pending' && (
            <p className="text-sm text-muted">Adicione o endereço para que este cliente apareça no mapa.</p>
          )}
          {client.geocode_status === 'failed' && (
            <div className="flex flex-col gap-2">
              <ErrorBanner message="Não foi possível localizar este endereço no mapa." />
              <Button
                variant="secondary"
                disabled={retryGeocode.isPending}
                onClick={() => retryGeocode.mutate(client)}
              >
                {retryGeocode.isPending ? 'Tentando…' : 'Tentar novamente'}
              </Button>
            </div>
          )}
        </Card>

        <div>
          <p className="mb-2 text-sm font-semibold text-ink">Pedidos</p>
          <div className="flex flex-col gap-2">
            {orders?.length === 0 && <p className="text-sm text-muted">Nenhum pedido ainda.</p>}
            {orders?.map((order) => (
              <Card
                key={order.id}
                className="flex cursor-pointer items-center justify-between"
                onClick={() => navigate(`/vendas/${order.id}`)}
              >
                <div>
                  <p className="text-sm font-medium text-ink">{formatDate(order.order_date)}</p>
                  <p className="text-xs text-muted">{order.weight_kg} kg · R$ {order.total_price}</p>
                </div>
                <span
                  className={`rounded-full px-2 py-1 text-xs font-medium ${
                    order.status === 'entregue' ? 'bg-success/15 text-success' : 'bg-warning/15 text-warning'
                  }`}
                >
                  {order.status}
                </span>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  )
}
