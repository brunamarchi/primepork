import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import AppShell from '../../components/layout/AppShell'
import PurchaseForm from '../../components/PurchaseForm'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Spinner from '../../components/ui/Spinner'
import { usePurchase, useUpdatePurchase } from '../../hooks/usePurchases'
import { useToast } from '../../hooks/useToast'

function formatDate(iso) {
  return new Date(iso + 'T00:00:00').toLocaleDateString('pt-BR')
}

export default function DetalheCompra() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [editing, setEditing] = useState(false)
  const { data: purchase, isLoading } = usePurchase(id)
  const updatePurchase = useUpdatePurchase()
  const showToast = useToast()

  if (isLoading || !purchase) {
    return (
      <AppShell title="Compra">
        <Spinner />
      </AppShell>
    )
  }

  if (editing) {
    return (
      <AppShell title="Editar compra">
        <PurchaseForm
          initialValues={purchase}
          submitLabel="Salvar alterações"
          submitting={updatePurchase.isPending}
          error={updatePurchase.error?.message}
          onSubmit={async (fields) => {
            await updatePurchase.mutateAsync({ id, fields })
            showToast('Compra atualizada com sucesso.')
            setEditing(false)
          }}
        />
      </AppShell>
    )
  }

  const lossKg = Number(purchase.raw_weight_kg) - Number(purchase.yield_weight_kg)
  const lossPct = (lossKg / Number(purchase.raw_weight_kg)) * 100

  return (
    <AppShell
      title="Detalhe da compra"
      action={
        <Button variant="secondary" className="!min-h-[36px] !px-3 text-xs" onClick={() => setEditing(true)}>
          Editar
        </Button>
      }
    >
      <div className="flex flex-col gap-4">
        <Card className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-sm text-muted">Data</p>
            <p className="font-medium text-ink">{formatDate(purchase.purchase_date)}</p>
          </div>
          <div>
            <p className="text-sm text-muted">Matéria-prima comprada</p>
            <p className="font-medium text-ink">{Number(purchase.raw_weight_kg).toFixed(1)} kg</p>
          </div>
          <div>
            <p className="text-sm text-muted">Produto final</p>
            <p className="font-medium text-ink">
              {Number(purchase.yield_weight_kg).toFixed(1)} kg ({Number(purchase.yield_quantity).toFixed(0)} un.)
            </p>
          </div>
          <div>
            <p className="text-sm text-muted">Resíduo/perda</p>
            <p className="font-medium text-danger">
              {lossKg.toFixed(1)} kg ({lossPct.toFixed(1)}%)
            </p>
          </div>
        </Card>

        {purchase.notes && (
          <Card>
            <p className="text-sm text-muted">Observações</p>
            <p className="text-ink">{purchase.notes}</p>
          </Card>
        )}

        <Button variant="ghost" onClick={() => navigate('/estoque')}>
          Voltar para o estoque
        </Button>
      </div>
    </AppShell>
  )
}
