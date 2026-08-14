import { useState } from 'react'
import Field, { inputClass } from './ui/Field'
import Button from './ui/Button'
import ErrorBanner from './ui/ErrorBanner'

const todayISO = () => new Date().toISOString().slice(0, 10)

const STAGES = [
  { key: 'panceta_congelada_kg', label: 'Panceta congelada (kg)' },
  { key: 'panceta_descongelada_kg', label: 'Panceta descongelada (kg)' },
  { key: 'panceta_temperada_kg', label: 'Panceta temperada (kg)' },
  { key: 'rolo_assado_kg', label: 'Rolo assado (kg)' },
  { key: 'rolo_congelado_kg', label: 'Rolo congelado (kg)' },
  { key: 'rolo_fatiado_kg', label: 'Rolo fatiado (kg)' },
]

const EMPTY = {
  production_date: todayISO(),
  panceta_congelada_kg: '',
  panceta_descongelada_kg: '',
  panceta_temperada_kg: '',
  rolo_assado_kg: '',
  rolo_congelado_kg: '',
  rolo_fatiado_kg: '',
  notes: '',
}

export default function DailyProductionForm({ initialValues, submitLabel = 'Salvar', onSubmit, submitting, error }) {
  const [values, setValues] = useState({ ...EMPTY, ...initialValues })

  function set(key) {
    return (e) => setValues((v) => ({ ...v, [key]: e.target.value }))
  }

  function handleSubmit(e) {
    e.preventDefault()
    onSubmit({
      production_date: values.production_date,
      ...Object.fromEntries(STAGES.map(({ key }) => [key, values[key] === '' ? null : Number(values[key])])),
      notes: values.notes || null,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Field label="Data" required hint="Lance de segunda a sexta, no fim do dia de produção">
        <input type="date" required className={inputClass} value={values.production_date} onChange={set('production_date')} />
      </Field>

      <div className="rounded-card border border-dashed border-hairline p-3">
        <p className="mb-3 text-sm font-medium text-ink">Peso em cada etapa</p>
        <div className="flex flex-col gap-3">
          {STAGES.map(({ key, label }) => (
            <Field key={key} label={label}>
              <input
                type="number"
                step="0.001"
                min="0"
                inputMode="decimal"
                className={inputClass}
                value={values[key]}
                onChange={set(key)}
              />
            </Field>
          ))}
        </div>
      </div>

      <Field label="Observações">
        <textarea rows={2} className={inputClass} value={values.notes} onChange={set('notes')} />
      </Field>

      <ErrorBanner message={error} />

      <Button type="submit" disabled={submitting} className="w-full">
        {submitting ? 'Salvando…' : submitLabel}
      </Button>
    </form>
  )
}

export { STAGES }
