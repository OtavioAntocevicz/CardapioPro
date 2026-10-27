import { PlansComparisonTable } from '@/components/plans/PlansComparisonTable'
import { ThemeToggle } from '@/components/ThemeToggle'
import { buttonClass } from '@/components/ui/buttonClass'
import { PLAN_MARKETING, PLAN_ORDER } from '@/data/plans'
import { ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'

const HIGHLIGHTED_PLAN = 'pro'

export function PlansPublicPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <header className="mx-auto flex max-w-5xl items-center justify-between gap-2 px-4 py-5">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Início
        </Link>
        <nav className="flex items-center gap-1 sm:gap-2" aria-label="Conta">
          <ThemeToggle />
          <Link to="/login" className={buttonClass('ghost')}>
            Entrar
          </Link>
          <Link to="/register" className={buttonClass('primary', 'max-sm:hidden')}>
            Criar conta
          </Link>
        </nav>
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
            const highlighted = id === HIGHLIGHTED_PLAN
            return (
              <li
                key={id}
                className={`relative flex flex-col rounded-xl border bg-white p-5 shadow-sm dark:bg-slate-900/50 ${
                  highlighted
                    ? 'border-brand-400 ring-1 ring-brand-400 dark:border-brand-500/60 dark:ring-brand-500/60'
                    : 'border-slate-200 dark:border-slate-800'
                }`}
              >
                {highlighted ? (
                  <span className="absolute -top-2.5 left-5 rounded-full bg-brand-600 px-2.5 py-0.5 text-[11px] font-semibold text-white">
                    Mais popular
                  </span>
                ) : null}
                <p className="text-lg font-semibold text-slate-900 dark:text-white">{m.name}</p>
                <p className="mt-1 text-2xl font-bold text-brand-600 dark:text-brand-400">{m.priceLabel}</p>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{m.tagline}</p>
                <p className="mt-2 flex-1 text-xs text-slate-500 dark:text-slate-500">{m.priceNote}</p>
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

        <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
          <Link to="/register" className={buttonClass('primary', 'sm:min-w-[200px]')}>
            Começar no Free
          </Link>
          <Link to="/login" className={buttonClass('secondary', 'sm:min-w-[200px]')}>
            Já tenho conta
          </Link>
        </div>
      </main>
    </div>
  )
}
