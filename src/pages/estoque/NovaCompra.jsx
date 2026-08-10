import { useNavigate } from 'react-router-dom'
import AppShell from '../../components/layout/AppShell'
import PurchaseForm from '../../components/PurchaseForm'
import { useCreatePurchase } from '../../hooks/usePurchases'
import { useToast } from '../../hooks/useToast'

export default function NovaCompra() {
  const navigate = useNavigate()
  const showToast = useToast()
  const { mutateAsync, isPending, error } = useCreatePurchase()

  async function handleSubmit(fields) {
    await mutateAsync(fields)
    showToast('Compra registrada com sucesso.')
    navigate('/estoque', { replace: true })
  }

  return (
    <AppShell title="Nova compra">
      <div className="lg:max-w-xl">
        <PurchaseForm submitLabel="Salvar compra" onSubmit={handleSubmit} submitting={isPending} error={error?.message} />
      </div>
    </AppShell>
  )
}
