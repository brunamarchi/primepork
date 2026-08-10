import { useState } from 'react'
import Field, { inputClass } from './ui/Field'
import Button from './ui/Button'
import ErrorBanner from './ui/ErrorBanner'

const todayISO = () => new Date().toISOString().slice(0, 10)

const EMPTY = {
  order_date: todayISO(),
  quantity: '',
  weight_kg: '',
  total_price: '',
  status: 'pendente',
  payment_status: 'previsto',
  payment_due_date: todayISO(),
  notes: '',
}

export default function OrderFieldsForm({ initialValues, submitLabel = 'Salvar', onSubmit, submitting, error, disabled }) {
  const [values, setValues] = useState({ ...EMPTY, ...initialValues })

  function set(key) {
    return (e) => setValues((v) => ({ ...v, [key]: e.target.value }))
  }

  function handleSubmit(e) {
    e.preventDefault()
    onSubmit({
      order_date: values.order_date,
      quantity: Number(values.quantity),
      weight_kg: Number(values.weight_kg),
      total_price: Number(values.total_price),
      status: values.status,
      delivered_at: values.status === 'entregue' ? (values.delivered_at ?? new Date().toISOString()) : null,
      payment_status: values.payment_status,
      payment_due_date: values.payment_status === 'previsto' ? values.payment_due_date || null : null,
      paid_at: values.payment_status === 'pago' ? (values.paid_at ?? new Date().toISOString()) : null,
      notes: values.notes || null,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Field label="Data da venda" required>
        <input type="date" required className={inputClass} value={values.order_date} onChange={set('order_date')} />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Quantidade (un.)" required>
          <input
            type="number"
            step="0.01"
            min="0"
            inputMode="decimal"
            required
            className={inputClass}
            value={values.quantity}
            onChange={set('quantity')}
          />
        </Field>
        <Field label="Peso (kg)" required>
          <input
            type="number"
            step="0.001"
            min="0"
            inputMode="decimal"
            required
            className={inputClass}
            value={values.weight_kg}
            onChange={set('weight_kg')}
          />
        </Field>
      </div>

      <Field label="Valor total (R$)" required>
        <input
          type="number"
          step="0.01"
          min="0"
          inputMode="decimal"
          required
          className={inputClass}
          value={values.total_price}
          onChange={set('total_price')}
        />
      </Field>

      <Field label="Status da entrega" required>
        <select className={inputClass} value={values.status} onChange={set('status')}>
          <option value="pendente">Pendente</option>
          <option value="entregue">Entregue</option>
        </select>
      </Field>

      <div className="rounded-card border border-dashed border-hairline p-3">
        <p className="mb-3 text-sm font-medium text-ink">Pagamento</p>
        <div className="flex flex-col gap-3">
          <Field label="Status do pagamento" required>
            <select className={inputClass} value={values.payment_status} onChange={set('payment_status')}>
              <option value="previsto">Previsto</option>
              <option value="pago">Pago</option>
            </select>
          </Field>
          {values.payment_status === 'previsto' && (
            <Field label="Data prevista de pagamento" required>
              <input
                type="date"
                required
                className={inputClass}
                value={values.payment_due_date}
                onChange={set('payment_due_date')}
              />
            </Field>
          )}
        </div>
      </div>

      <Field label="Observações">
        <textarea rows={2} className={inputClass} value={values.notes} onChange={set('notes')} />
      </Field>

      <ErrorBanner message={error} />

      <Button type="submit" disabled={disabled || submitting} className="w-full">
        {submitting ? 'Salvando…' : submitLabel}
      </Button>
    </form>
  )
}
