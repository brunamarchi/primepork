import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { inputClass } from '../components/ui/Field'
import Field from '../components/ui/Field'
import Button from '../components/ui/Button'
import ErrorBanner from '../components/ui/ErrorBanner'
import { isSupabaseConfigured } from '../lib/supabaseClient'

export default function Login() {
  const { signIn, user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (user) {
    navigate(location.state?.from?.pathname ?? '/', { replace: true })
    return null
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await signIn(email, password)
      navigate(location.state?.from?.pathname ?? '/', { replace: true })
    } catch {
      setError('E-mail ou senha inválidos.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-bg px-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-primary">Prime Pork</h1>
          <p className="text-sm text-muted">Controle de estoque e vendas</p>
        </div>
        {!isSupabaseConfigured && (
          <ErrorBanner message="Supabase não configurado. Crie um .env com VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY (veja .env.example e o README)." />
        )}
        <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-4">
          <Field label="E-mail" required>
            <input
              type="email"
              autoComplete="username"
              required
              className={inputClass}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </Field>
          <Field label="Senha" required>
            <input
              type="password"
              autoComplete="current-password"
              required
              className={inputClass}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </Field>
          <ErrorBanner message={error} />
          <Button type="submit" disabled={submitting} className="w-full">
            {submitting ? 'Entrando…' : 'Entrar'}
          </Button>
        </form>
      </div>
    </div>
  )
}
