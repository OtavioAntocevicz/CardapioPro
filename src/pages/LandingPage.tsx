import { ThemeToggle } from '@/components/ThemeToggle'
import { Button } from '@/components/ui/Button'
import { Link } from 'react-router-dom'
import { ArrowRight, QrCode, Sparkles, Zap } from 'lucide-react'

export function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100 text-slate-900 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900 dark:text-slate-100">
      <div
        className="pointer-events-none absolute inset-0 opacity-70 dark:opacity-50"
        style={{
          backgroundImage:
            'radial-gradient(ellipse 100% 55% at 50% -8%, rgb(99 102 241 / 0.18), transparent)',
        }}
      />
      <header className="relative z-10 mx-auto flex max-w-5xl items-center justify-between px-4 py-6">
        <span className="text-xl font-semibold text-slate-900 dark:text-white">
          Cardápio<span className="text-brand-600 dark:text-brand-400">Pro</span>
        </span>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link to="/planos">
            <Button variant="ghost">Planos</Button>
          </Link>
          <Link to="/login">
            <Button variant="ghost">Entrar</Button>
          </Link>
          <Link to="/register">
            <Button>Criar conta</Button>
          </Link>
        </div>
      </header>

      <section className="relative z-10 mx-auto max-w-5xl px-4 pb-24 pt-10 md:pt-16">
        <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-medium text-brand-800 dark:border-brand-500/35 dark:bg-brand-500/10 dark:text-brand-200">
          <Sparkles className="h-3.5 w-3.5" aria-hidden />
          Cardápio digital focado em performance
        </p>
        <h1 className="max-w-2xl text-4xl font-bold tracking-tight text-slate-900 dark:text-white md:text-5xl">
          Seu cardápio online, pronto para o celular do cliente.
        </h1>
        <p className="mt-5 max-w-xl text-lg text-slate-600 dark:text-slate-400">
          Gerencie categorias e produtos, envie fotos e compartilhe um link público. Sem
          complicação — pensado para restaurantes que querem escalar.
        </p>
        <div className="mt-10 flex flex-wrap gap-3">
          <Link to="/register">
            <Button className="gap-2">
              Começar grátis
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Button>
          </Link>
          <Link to="/login">
            <Button variant="secondary">Já tenho conta</Button>
          </Link>
        </div>

        <div className="mt-20 grid gap-6 md:grid-cols-3">
          <div className="rounded-xl border border-slate-200/90 bg-white/80 p-5 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/50">
            <Zap className="h-8 w-8 text-amber-500 dark:text-amber-400" aria-hidden />
            <h2 className="mt-3 font-semibold text-slate-900 dark:text-white">Rápido e leve</h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              Interface otimizada e PWA instalável para acesso offline básico aos assets.
            </p>
          </div>
          <div className="rounded-xl border border-slate-200/90 bg-white/80 p-5 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/50">
            <QrCode className="h-8 w-8 text-emerald-600 dark:text-emerald-400" aria-hidden />
            <h2 className="mt-3 font-semibold text-slate-900 dark:text-white">Link público</h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              Cada restaurante tem um slug único. Clientes abrem no navegador, sem login.
            </p>
          </div>
          <div className="rounded-xl border border-slate-200/90 bg-white/80 p-5 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/50">
            <Sparkles className="h-8 w-8 text-brand-600 dark:text-brand-400" aria-hidden />
            <h2 className="mt-3 font-semibold text-slate-900 dark:text-white">Pronto para crescer</h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              Estrutura multi-restaurante e campo de plano para monetização futura.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
