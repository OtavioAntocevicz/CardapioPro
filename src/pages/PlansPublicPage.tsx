import { PlansComparisonTable } from '@/components/plans/PlansComparisonTable'
import { ThemeToggle } from '@/components/ThemeToggle'
import { Button } from '@/components/ui/Button'
import { PLAN_MARKETING, PLAN_ORDER } from '@/data/plans'
import { ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'

export function PlansPublicPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-4 py-6">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Início
        </Link>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link to="/login">
            <Button variant="ghost">Entrar</Button>
          </Link>
          <Link to="/register">
            <Button>Criar conta</Button>
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 pb-20 pt-4">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Planos</h1>
        <p className="mt-3 max-w-2xl text-slate-600 dark:text-slate-400">
          Escolha o nível que combina com o tamanho da operação. O Free já inclui cardápio público completo; Pro e
          Enterprise adicionam suporte e evolução pensados para quem escala.
        </p>

        <ul className="mt-8 grid gap-4 sm:grid-cols-3">
          {PLAN_ORDER.map((id) => {
            const m = PLAN_MARKETING[id]
            return (
              <li
                key={id}
                className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/50"
              >
                <p className="text-lg font-semibold text-slate-900 dark:text-white">{m.name}</p>
                <p className="mt-1 text-2xl font-bold text-brand-600 dark:text-brand-400">{m.priceLabel}</p>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{m.tagline}</p>
                <p className="mt-2 text-xs text-slate-500 dark:text-slate-500">{m.priceNote}</p>
              </li>
            )
          })}
        </ul>

        <section className="mt-12" aria-labelledby="public-plans-table">
          <h2 id="public-plans-table" className="text-lg font-semibold text-slate-900 dark:text-white">
            Comparativo detalhado
          </h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Veja o que está incluído em cada plano antes de criar sua conta.
          </p>
          <div className="mt-4">
            <PlansComparisonTable />
          </div>
        </section>

        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <Link to="/register">
            <Button className="min-w-[200px]">Começar no Free</Button>
          </Link>
          <Link to="/login">
            <Button variant="secondary" className="min-w-[200px]">
              Já tenho conta
            </Button>
          </Link>
        </div>
      </main>
    </div>
  )
}
