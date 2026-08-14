import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import AppShell from '../../components/layout/AppShell'
import DailyProductionForm, { STAGES } from '../../components/DailyProductionForm'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Spinner from '../../components/ui/Spinner'
import { useDailyProductionEntry, useUpdateDailyProduction } from '../../hooks/useDailyProduction'
import { useToast } from '../../hooks/useToast'

function formatDate(iso) {
  return new Date(iso + 'T00:00:00').toLocaleDateString('pt-BR')
}

export default function DetalheProducao() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [editing, setEditing] = useState(false)
  const { data: entry, isLoading } = useDailyProductionEntry(id)
  const updateEntry = useUpdateDailyProduction()
  const showToast = useToast()

  if (isLoading || !entry) {
    return (
      <AppShell title="Produção">
        <Spinner />
      </AppShell>
    )
  }

  if (editing) {
    return (
      <AppShell title="Editar produção">
        <div className="lg:max-w-xl">
          <DailyProductionForm
            initialValues={entry}
            submitLabel="Salvar alterações"
            submitting={updateEntry.isPending}
            error={updateEntry.error?.message}
            onSubmit={async (fields) => {
              await updateEntry.mutateAsync({ id, fields })
              showToast('Produção atualizada com sucesso.')
              setEditing(false)
            }}
          />
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell
      title="Detalhe da produção"
      action={
        <Button variant="secondary" className="!min-h-[36px] !px-3 text-xs" onClick={() => setEditing(true)}>
          Editar
        </Button>
      }
    >
      <div className="flex flex-col gap-4 lg:max-w-xl">
        <Card>
          <p className="text-sm text-muted">Data</p>
          <p className="font-medium text-ink">{formatDate(entry.production_date)}</p>
        </Card>

        <Card className="grid grid-cols-2 gap-3">
          {STAGES.map(({ key, label }) => (
            <div key={key}>
              <p className="text-sm text-muted">{label}</p>
              <p className="font-medium text-ink">{entry[key] != null ? `${Number(entry[key]).toFixed(1)} kg` : '—'}</p>
            </div>
          ))}
        </Card>

        {entry.notes && (
          <Card>
            <p className="text-sm text-muted">Observações</p>
            <p className="text-ink">{entry.notes}</p>
          </Card>
        )}

        <Button variant="ghost" onClick={() => navigate('/producao')}>
          Voltar para a produção
        </Button>
      </div>
    </AppShell>
  )
}
