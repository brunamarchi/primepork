import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import AppShell from '../../components/layout/AppShell'
import ClientPicker from '../../components/ClientPicker'
import OrderFieldsForm from '../../components/OrderFieldsForm'
import Field from '../../components/ui/Field'
import { useCreateOrder } from '../../hooks/useOrders'
import { useClient } from '../../hooks/useClients'
import { useToast } from '../../hooks/useToast'

export default function NovaVenda() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const preselectId = searchParams.get('clientId')
  const { data: preselectedClient } = useClient(preselectId)

  const [selectedClient, setSelectedClient] = useState(null)
  const { mutateAsync, isPending, error } = useCreateOrder()
  const showToast = useToast()

  useEffect(() => {
    if (preselectedClient) setSelectedClient(preselectedClient)
  }, [preselectedClient])

  async function handleSubmit(fields) {
    if (!selectedClient) return
    await mutateAsync({ ...fields, client_id: selectedClient.id })
    showToast('Pedido lançado com sucesso.')
    navigate('/vendas', { replace: true })
  }

  return (
    <AppShell title="Novo pedido">
      <div className="lg:max-w-xl">
        <div className="mb-4">
          <Field label="Cliente" required>
            <ClientPicker selectedClient={selectedClient} onSelect={setSelectedClient} returnTo="/vendas/nova" />
          </Field>
        </div>
        <OrderFieldsForm
          key={selectedClient?.id ?? 'none'}
          initialValues={
            selectedClient ? { payment_term: selectedClient.payment_term ?? '', unit_price: selectedClient.current_price ?? '' } : undefined
          }
          submitLabel="Lançar pedido"
          onSubmit={handleSubmit}
          submitting={isPending}
          error={error?.message}
          disabled={!selectedClient}
        />
      </div>
    </AppShell>
  )
}
