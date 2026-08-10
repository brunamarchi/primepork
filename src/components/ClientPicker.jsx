import { useState } from 'react'
import { inputClass } from './ui/Field'
import Button from './ui/Button'
import { useClients } from '../hooks/useClients'

export default function ClientPicker({ selectedClient, onSelect, returnTo }) {
  const [search, setSearch] = useState('')
  const { data: clients } = useClients(search)

  if (selectedClient) {
    return (
      <div className="flex items-center justify-between rounded-card border border-hairline bg-surface p-3">
        <div>
          <p className="font-medium text-ink">{selectedClient.full_name}</p>
          <p className="text-sm text-muted">{selectedClient.phone}</p>
        </div>
        <Button type="button" variant="ghost" className="!min-h-0 !px-2" onClick={() => onSelect(null)}>
          Trocar
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      <input
        placeholder="Buscar cliente por nome ou telefone…"
        className={inputClass}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      <div className="max-h-52 overflow-y-auto rounded-card border border-hairline">
        {clients?.length === 0 && <p className="p-3 text-sm text-muted">Nenhum cliente encontrado.</p>}
        {clients?.map((client) => (
          <button
            key={client.id}
            type="button"
            onClick={() => onSelect(client)}
            className="flex w-full items-center justify-between border-b border-hairline px-3 py-2.5 text-left last:border-0 active:bg-bg"
          >
            <span className="font-medium text-ink">{client.full_name}</span>
            <span className="text-sm text-muted">{client.phone}</span>
          </button>
        ))}
      </div>
      <Button type="button" variant="secondary" to={`/clientes/novo${returnTo ? `?returnTo=${encodeURIComponent(returnTo)}` : ''}`}>
        + Cadastrar cliente
      </Button>
    </div>
  )
}
