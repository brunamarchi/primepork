import { useNavigate, useSearchParams } from 'react-router-dom'
import AppShell from '../../components/layout/AppShell'
import ClientForm from '../../components/ClientForm'
import { useCreateClient } from '../../hooks/useClients'
import { useToast } from '../../hooks/useToast'

export default function NovoCliente() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const returnTo = searchParams.get('returnTo')
  const { mutateAsync, isPending, error } = useCreateClient()
  const showToast = useToast()

  async function handleSubmit(values) {
    const client = await mutateAsync(values)
    showToast('Cliente cadastrado com sucesso.')
    if (returnTo) {
      navigate(`${returnTo}${returnTo.includes('?') ? '&' : '?'}clientId=${client.id}`, { replace: true })
    } else {
      navigate(`/clientes/${client.id}`, { replace: true })
    }
  }

  return (
    <AppShell title="Novo cliente">
      <ClientForm submitLabel="Cadastrar cliente" onSubmit={handleSubmit} submitting={isPending} error={error?.message} />
    </AppShell>
  )
}
