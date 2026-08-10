import { useState } from 'react'
import Field, { inputClass } from './ui/Field'
import Button from './ui/Button'
import ErrorBanner from './ui/ErrorBanner'

const todayISO = () => new Date().toISOString().slice(0, 10)

const EMPTY = {
  purchase_date: todayISO(),
  raw_weight_kg: '',
  yield_quantity: '',
  yield_weight_kg: '',
  notes: '',
}

export default function PurchaseForm({ initialValues, submitLabel = 'Salvar compra', onSubmit, submitting, error }) {
  const [values, setValues] = useState({ ...EMPTY, ...initialValues })

  const rawWeight = Number(values.raw_weight_kg) || 0
  const yieldWeight = Number(values.yield_weight_kg) || 0
  const showYieldFields = rawWeight > 0
  const lossKg = rawWeight > 0 && yieldWeight > 0 ? rawWeight - yieldWeight : null
  const lossPct = lossKg != null && rawWeight > 0 ? (lossKg / rawWeight) * 100 : null

  function set(key) {
    return (e) => setValues((v) => ({ ...v, [key]: e.target.value }))
  }

  function handleSubmit(e) {
    e.preventDefault()
    onSubmit({
      purchase_date: values.purchase_date,
      raw_weight_kg: Number(values.raw_weight_kg),
      yield_quantity: Number(values.yield_quantity),
      yield_weight_kg: Number(values.yield_weight_kg),
      notes: values.notes || null,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Field label="Data da compra" required>
        <input type="date" required className={inputClass} value={values.purchase_date} onChange={set('purchase_date')} />
      </Field>

      <Field label="Peso da matéria-prima comprada (kg)" required hint="Ex: uma peça de 300 kg">
        <input
          type="number"
          step="0.001"
          min="0"
          inputMode="decimal"
          required
          className={inputClass}
          value={values.raw_weight_kg}
          onChange={set('raw_weight_kg')}
        />
      </Field>

      {showYieldFields && (
        <div className="flex flex-col gap-4 rounded-card border border-dashed border-hairline p-3">
          <p className="text-sm font-medium text-ink">Quanto isso rendeu de produto final?</p>
          <Field label="Quantidade produzida (unidades)" required>
            <input
              type="number"
              step="0.01"
              min="0"
              inputMode="decimal"
              required
              className={inputClass}
              value={values.yield_quantity}
              onChange={set('yield_quantity')}
            />
          </Field>
          <Field label="Peso total do produto final (kg)" required>
            <input
              type="number"
              step="0.001"
              min="0"
              inputMode="decimal"
              required
              className={inputClass}
              value={values.yield_weight_kg}
              onChange={set('yield_weight_kg')}
            />
          </Field>

          {lossKg != null && (
            <div className="rounded-card bg-bg px-3 py-2 text-sm">
              <span className="text-muted">Resíduo/perda na produção: </span>
              <span className="font-semibold text-ink">
                {lossKg.toFixed(1)} kg ({lossPct.toFixed(1)}%)
              </span>
            </div>
          )}
        </div>
      )}

      <Field label="Observações">
        <textarea rows={2} className={inputClass} value={values.notes} onChange={set('notes')} />
      </Field>

      <ErrorBanner message={error} />

      <Button type="submit" disabled={!showYieldFields || submitting} className="w-full">
        {submitting ? 'Salvando…' : submitLabel}
      </Button>
    </form>
  )
}
