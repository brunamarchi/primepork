import { useState } from 'react'
import { Link } from 'react-router-dom'
import AppShell from '../../components/layout/AppShell'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import { SkeletonList } from '../../components/ui/Skeleton'
import EmptyState from '../../components/ui/EmptyState'
import ErrorBanner from '../../components/ui/ErrorBanner'
import { inputClass } from '../../components/ui/Field'
import { useClients } from '../../hooks/useClients'

function ChevronRight() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="shrink-0 text-muted/60">
      <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export default function ClientesList() {
  const [search, setSearch] = useState('')
  const { data: clients, isLoading, error } = useClients(search)

  return (
    <AppShell
      title="Clientes"
      action={
        <Button to="/clientes/novo" className="!min-h-[36px] !px-3 text-xs">
          + Novo
        </Button>
      }
    >
      <input
        placeholder="Buscar por nome ou telefone…"
        className={`${inputClass} mb-4 w-full`}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {isLoading && <SkeletonList />}
      <ErrorBanner message={error?.message} />

      {clients && clients.length === 0 && (
        <EmptyState
          title="Nenhum cliente cadastrado"
          description="Cadastre seu primeiro cliente para começar a lançar vendas."
          action={<Button to="/clientes/novo">Cadastrar cliente</Button>}
        />
      )}

      <div className="flex flex-col gap-2">
        {clients?.map((client) => (
          <Link
            key={client.id}
            to={`/clientes/${client.id}`}
            className="block transition-transform duration-150 ease-out active:scale-[0.98]"
          >
            <Card className="flex items-center justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-ink">{client.full_name}</p>
                <p className="text-sm text-muted">{client.phone}</p>
              </div>
              {client.geocode_status !== 'success' && (
                <span className="shrink-0 rounded-full bg-bg px-2 py-1 text-xs text-muted">sem localização</span>
              )}
              <ChevronRight />
            </Card>
          </Link>
        ))}
      </div>
    </AppShell>
  )
}
