import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AppShell from '../../components/layout/AppShell'
import Field, { inputClass } from '../../components/ui/Field'
import Button from '../../components/ui/Button'
import Spinner from '../../components/ui/Spinner'
import ErrorBanner from '../../components/ui/ErrorBanner'
import { useSettings, useUpdateSettings } from '../../hooks/useSettings'
import { useToast } from '../../hooks/useToast'

export default function EstoqueConfiguracoes() {
  const navigate = useNavigate()
  const showToast = useToast()
  const { data: settings, isLoading } = useSettings()
  const updateSettings = useUpdateSettings()
  const [threshold, setThreshold] = useState('')

  useEffect(() => {
    if (settings) setThreshold(String(settings.low_stock_threshold_kg))
  }, [settings])

  async function handleSubmit(e) {
    e.preventDefault()
    await updateSettings.mutateAsync({ low_stock_threshold_kg: Number(threshold) })
    showToast('Configuração salva com sucesso.')
    navigate('/estoque', { replace: true })
  }

  if (isLoading) {
    return (
      <AppShell title="Configurações de estoque">
        <Spinner />
      </AppShell>
    )
  }

  return (
    <AppShell title="Configurações de estoque">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 lg:max-w-xl">
        <Field
          label="Limite mínimo de estoque (kg)"
          required
          hint="Quando o estoque de produto final ficar abaixo desse valor, o painel mostra um alerta de estoque baixo."
        >
          <input
            type="number"
            step="0.1"
            min="0"
            inputMode="decimal"
            required
            className={inputClass}
            value={threshold}
            onChange={(e) => setThreshold(e.target.value)}
          />
        </Field>

        <ErrorBanner message={updateSettings.error?.message} />

        <Button type="submit" disabled={updateSettings.isPending} className="w-full">
          {updateSettings.isPending ? 'Salvando…' : 'Salvar configuração'}
        </Button>
      </form>
    </AppShell>
  )
}
