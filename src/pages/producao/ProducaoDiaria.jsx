import { Link } from 'react-router-dom'
import AppShell from '../../components/layout/AppShell'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import { SkeletonList } from '../../components/ui/Skeleton'
import EmptyState from '../../components/ui/EmptyState'
import ErrorBanner from '../../components/ui/ErrorBanner'
import { IconChevronRight } from '../../components/icons'
import { useDailyProductionList } from '../../hooks/useDailyProduction'
import { STAGES } from '../../components/DailyProductionForm'

function formatDate(iso) {
  return new Date(iso + 'T00:00:00').toLocaleDateString('pt-BR')
}

export default function ProducaoDiaria() {
  const { data: entries, isLoading, error } = useDailyProductionList()

  return (
    <AppShell
      title="Produção"
      action={
        <Button to="/producao/nova" className="!min-h-[36px] !px-3 text-xs">
          + Lançar
        </Button>
      }
    >
      <p className="mb-4 text-sm text-muted">Lance a produção diária (de segunda a sexta) com o peso de cada etapa do processo.</p>

      {isLoading && <SkeletonList />}
      <ErrorBanner message={error?.message} />

      {entries && entries.length === 0 && (
        <EmptyState
          title="Nenhuma produção lançada"
          description="Registre o primeiro dia de produção."
          action={<Button to="/producao/nova">Lançar produção</Button>}
        />
      )}

      <div className="flex flex-col gap-2 lg:grid lg:grid-cols-2 lg:gap-3 xl:grid-cols-3">
        {entries?.map((entry) => (
          <Link
            key={entry.id}
            to={`/producao/${entry.id}`}
            className="block transition-transform duration-150 ease-out active:scale-[0.98]"
          >
            <Card className="flex items-center gap-3">
              <div className="min-w-0 flex-1">
                <p className="font-medium text-ink">{formatDate(entry.production_date)}</p>
                <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted">
                  {STAGES.map(({ key, label }) =>
                    entry[key] != null ? (
                      <span key={key}>
                        {label.replace(' (kg)', '')}: <strong className="text-ink">{Number(entry[key]).toFixed(1)} kg</strong>
                      </span>
                    ) : null,
                  )}
                </div>
              </div>
              <IconChevronRight className="text-muted/60" />
            </Card>
          </Link>
        ))}
      </div>
    </AppShell>
  )
}
