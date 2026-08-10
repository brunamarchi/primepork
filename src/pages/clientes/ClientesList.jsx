import { useState } from 'react'
import { Link } from 'react-router-dom'
import AppShell from '../../components/layout/AppShell'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import Spinner from '../../components/ui/Spinner'
import EmptyState from '../../components/ui/EmptyState'
import ErrorBanner from '../../components/ui/ErrorBanner'
import { inputClass } from '../../components/ui/Field'
import { useClients } from '../../hooks/useClients'

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

      {isLoading && <Spinner />}
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
          <Link key={client.id} to={`/clientes/${client.id}`}>
            <Card className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-ink">{client.full_name}</p>
                <p className="text-sm text-muted">{client.phone}</p>
              </div>
              {client.geocode_status !== 'success' && (
                <span className="rounded-full bg-bg px-2 py-1 text-xs text-muted">sem localização</span>
              )}
            </Card>
          </Link>
        ))}
      </div>
    </AppShell>
  )
}
