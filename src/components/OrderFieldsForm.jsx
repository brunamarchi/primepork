import { useState } from 'react'
import Field, { inputClass } from './ui/Field'
import Button from './ui/Button'
import ErrorBanner from './ui/ErrorBanner'

const todayISO = () => new Date().toISOString().slice(0, 10)

const EMPTY = {
  order_date: todayISO(),
  order_number: '',
  nf_number: '',
  product_description: '',
  weight_kg: '',
  unit_price: '',
  total_price: '',
  payment_term: '',
  payment_method: '',
  freight: '',
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

  function setWeightOrUnitPrice(key) {
    return (e) => {
      const next = { ...values, [key]: e.target.value }
      const weight = Number(next.weight_kg)
      const unitPrice = Number(next.unit_price)
      if (next.weight_kg !== '' && next.unit_price !== '' && weight > 0 && unitPrice > 0) {
        next.total_price = (weight * unitPrice).toFixed(2)
      }
      setValues(next)
    }
  }

  function handleSubmit(e) {
    e.preventDefault()
    onSubmit({
      order_date: values.order_date,
      order_number: values.order_number === '' ? null : Number(values.order_number),
      nf_number: values.nf_number || null,
      product_description: values.product_description || null,
      quantity: null,
      weight_kg: Number(values.weight_kg),
      unit_price: values.unit_price === '' ? null : Number(values.unit_price),
      total_price: Number(values.total_price),
      payment_term: values.payment_term || null,
      payment_method: values.payment_method || null,
      freight: values.freight || null,
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
      <div className="grid grid-cols-2 gap-3">
        <Field label="Data da venda" required>
          <input type="date" required className={inputClass} value={values.order_date} onChange={set('order_date')} />
        </Field>
        <Field label="Nº do pedido">
          <input
            type="number"
            inputMode="numeric"
            className={inputClass}
            value={values.order_number}
            onChange={set('order_number')}
          />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="NF">
          <input className={inputClass} value={values.nf_number} onChange={set('nf_number')} />
        </Field>
        <Field label="Descrição" hint="Ex: Torresmo de rolo">
          <input className={inputClass} value={values.product_description} onChange={set('product_description')} />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Peso (kg)" required>
          <input
            type="number"
            step="0.001"
            min="0"
            inputMode="decimal"
            required
            className={inputClass}
            value={values.weight_kg}
            onChange={setWeightOrUnitPrice('weight_kg')}
          />
        </Field>
        <Field label="Valor unitário (R$/kg)">
          <input
            type="number"
            step="0.01"
            min="0"
            inputMode="decimal"
            className={inputClass}
            value={values.unit_price}
            onChange={setWeightOrUnitPrice('unit_price')}
          />
        </Field>
      </div>

      <Field label="Valor total (R$)" required hint="Calculado automaticamente se peso e valor unitário forem preenchidos">
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

      <div className="grid grid-cols-2 gap-3">
        <Field label="Prazo" hint="Ex: 7 DD, 14 DD, A vista">
          <input className={inputClass} value={values.payment_term} onChange={set('payment_term')} />
        </Field>
        <Field label="Forma de pagamento" hint="Ex: PIX, dinheiro">
          <input className={inputClass} value={values.payment_method} onChange={set('payment_method')} />
        </Field>
      </div>

      <Field label="Frete" hint="Valor em R$ ou, se o cliente retirou, escreva Retirou">
        <input className={inputClass} value={values.freight} onChange={set('freight')} />
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
            <Field label="Vencimento" required>
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
