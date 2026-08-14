import { useState } from 'react'
import Field, { inputClass } from './ui/Field'
import Button from './ui/Button'
import ErrorBanner from './ui/ErrorBanner'

const EMPTY = {
  full_name: '',
  document: '',
  address_street: '',
  address_neighborhood: '',
  address_zip: '',
  contact_name: '',
  phone: '',
  payment_term: '',
  current_price: '',
}

export default function ClientForm({ initialValues, submitLabel = 'Salvar cliente', onSubmit, submitting, error }) {
  const [values, setValues] = useState({ ...EMPTY, ...initialValues })

  function set(key) {
    return (e) => setValues((v) => ({ ...v, [key]: e.target.value }))
  }

  function handleSubmit(e) {
    e.preventDefault()
    onSubmit({ ...values, current_price: values.current_price === '' ? null : Number(values.current_price) })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Field label="Nome" required>
        <input required className={inputClass} value={values.full_name} onChange={set('full_name')} />
      </Field>
      <Field label="CNPJ/CPF">
        <input className={inputClass} value={values.document} onChange={set('document')} />
      </Field>
      <Field label="Endereço">
        <input className={inputClass} value={values.address_street} onChange={set('address_street')} />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Bairro">
          <input className={inputClass} value={values.address_neighborhood} onChange={set('address_neighborhood')} />
        </Field>
        <Field label="CEP">
          <input className={inputClass} value={values.address_zip} onChange={set('address_zip')} />
        </Field>
      </div>
      <Field label="Contato">
        <input className={inputClass} value={values.contact_name} onChange={set('contact_name')} />
      </Field>
      <Field label="Telefone" required>
        <input required type="tel" className={inputClass} value={values.phone} onChange={set('phone')} />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Prazo de pagamento" hint="Ex: 7 DD, 14 DD, A vista">
          <input className={inputClass} value={values.payment_term} onChange={set('payment_term')} />
        </Field>
        <Field label="Preço atual (R$/kg)">
          <input
            type="number"
            step="0.01"
            min="0"
            inputMode="decimal"
            className={inputClass}
            value={values.current_price}
            onChange={set('current_price')}
          />
        </Field>
      </div>

      <ErrorBanner message={error} />

      <Button type="submit" disabled={submitting} className="w-full">
        {submitting ? 'Salvando…' : submitLabel}
      </Button>
    </form>
  )
}
