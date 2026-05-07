import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { AuthLayout } from '@/layouts/AuthLayout'
import { getSupabase } from '@/services/supabase'
import { useAuthStore } from '@/store/authStore'
import { useState } from 'react'
import { Link, Navigate } from 'react-router-dom'

export function RegisterPage() {
  const user = useAuthStore((s) => s.user)
  const initialized = useAuthStore((s) => s.initialized)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  if (initialized && user) {
    return <Navigate to="/app" replace />
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (loading) return
    setError(null)
    const normalizedEmail = email.trim().toLowerCase()
    if (!normalizedEmail) {
      setError('Informe um email válido.')
      return
    }
    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.')
      return
    }
    setLoading(true)
    const { data, error: err } = await getSupabase().auth.signUp({
      email: normalizedEmail,
      password,
    })
    setLoading(false)
    if (err) {
      setError(err.message)
      return
    }
    if (!data.session) {
      setError('Cadastro criado, mas a sessão não foi iniciada. Tente entrar na tela de login.')
    }
  }

  return (
    <AuthLayout>
      <div className="rounded-xl border border-slate-200/90 bg-white/90 p-6 shadow-lg shadow-slate-200/40 backdrop-blur dark:border-slate-800 dark:bg-slate-900/70 dark:shadow-black/30">
        <h1 className="text-xl font-semibold text-slate-900 dark:text-white">Criar conta</h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Comece a montar seu cardápio digital.
        </p>
        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
          <Input
            type="email"
            name="email"
            label="Email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
          />
          <Input
            type="password"
            name="password"
            label="Senha"
            autoComplete="new-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
          />
          {error ? (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-300">
              {error}
            </p>
          ) : null}
          <Button type="submit" className="w-full" loading={loading} disabled={loading}>
            Registrar
          </Button>
        </form>
        <p className="mt-6 text-center text-sm text-slate-600 dark:text-slate-400">
          Já tem conta?{' '}
          <Link
            to="/login"
            className="font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300"
          >
            Entrar
          </Link>
        </p>
      </div>
    </AuthLayout>
  )
}
