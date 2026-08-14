import { useNavigate } from 'react-router-dom'
import AppShell from '../../components/layout/AppShell'
import DailyProductionForm from '../../components/DailyProductionForm'
import { useCreateDailyProduction } from '../../hooks/useDailyProduction'
import { useToast } from '../../hooks/useToast'

export default function NovaProducao() {
  const navigate = useNavigate()
  const showToast = useToast()
  const { mutateAsync, isPending, error } = useCreateDailyProduction()

  async function handleSubmit(fields) {
    await mutateAsync(fields)
    showToast('Produção lançada com sucesso.')
    navigate('/producao', { replace: true })
  }

  return (
    <AppShell title="Lançar produção">
      <div className="lg:max-w-xl">
        <DailyProductionForm submitLabel="Salvar" onSubmit={handleSubmit} submitting={isPending} error={error?.message} />
      </div>
    </AppShell>
  )
}
