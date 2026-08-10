import { useState } from 'react'
import Field, { inputClass } from './ui/Field'
import Button from './ui/Button'
import ErrorBanner from './ui/ErrorBanner'

const EMPTY = {
  full_name: '',
  phone: '',
  document: '',
  email: '',
  address_zip: '',
  address_street: '',
  address_number: '',
  address_neighborhood: '',
  address_city: '',
  address_state: '',
  address_complement: '',
  notes: '',
}

export default function ClientForm({ initialValues, submitLabel = 'Salvar cliente', onSubmit, submitting, error }) {
  const [values, setValues] = useState({ ...EMPTY, ...initialValues })

  function set(key) {
    return (e) => setValues((v) => ({ ...v, [key]: e.target.value }))
  }

  function handleSubmit(e) {
    e.preventDefault()
    onSubmit(values)
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Field label="Nome / Razão social" required>
        <input required className={inputClass} value={values.full_name} onChange={set('full_name')} />
      </Field>
      <Field label="Telefone / WhatsApp" required>
        <input required type="tel" className={inputClass} value={values.phone} onChange={set('phone')} />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="CPF/CNPJ">
          <input className={inputClass} value={values.document} onChange={set('document')} />
        </Field>
        <Field label="E-mail">
          <input type="email" className={inputClass} value={values.email} onChange={set('email')} />
        </Field>
      </div>

      <div className="mt-2 border-t border-hairline pt-4">
        <p className="mb-3 text-sm font-semibold text-ink">
          Endereço <span className="font-normal text-muted">(opcional — necessário para aparecer no mapa)</span>
        </p>
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-3 gap-3">
            <Field label="CEP">
              <input className={inputClass} value={values.address_zip} onChange={set('address_zip')} />
            </Field>
            <div className="col-span-2">
              <Field label="Rua">
                <input className={inputClass} value={values.address_street} onChange={set('address_street')} />
              </Field>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Número">
              <input className={inputClass} value={values.address_number} onChange={set('address_number')} />
            </Field>
            <Field label="Complemento">
              <input className={inputClass} value={values.address_complement} onChange={set('address_complement')} />
            </Field>
          </div>
          <Field label="Bairro">
            <input className={inputClass} value={values.address_neighborhood} onChange={set('address_neighborhood')} />
          </Field>
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <Field label="Cidade">
                <input className={inputClass} value={values.address_city} onChange={set('address_city')} />
              </Field>
            </div>
            <Field label="UF">
              <input maxLength={2} className={`${inputClass} uppercase`} value={values.address_state} onChange={set('address_state')} />
            </Field>
          </div>
        </div>
      </div>

      <Field label="Observações">
        <textarea rows={3} className={inputClass} value={values.notes} onChange={set('notes')} />
      </Field>

      <ErrorBanner message={error} />

      <Button type="submit" disabled={submitting} className="w-full">
        {submitting ? 'Salvando…' : submitLabel}
      </Button>
    </form>
  )
}
