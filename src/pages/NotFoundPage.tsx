import { ThemeToggle } from '@/components/ThemeToggle'
import { Button } from '@/components/ui/Button'
import { Home, SearchX } from 'lucide-react'
import { Link } from 'react-router-dom'

export function NotFoundPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100 text-slate-900 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900 dark:text-slate-100">
      <header className="mx-auto flex max-w-lg items-center justify-end px-4 py-4">
        <ThemeToggle />
      </header>
      <main className="mx-auto flex max-w-lg flex-col items-center px-4 pb-20 pt-8 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 dark:bg-slate-800/80 dark:text-slate-400">
          <SearchX className="h-8 w-8" aria-hidden />
        </div>
        <h1 className="mt-6 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Página não encontrada
        </h1>
        <p className="mt-3 max-w-sm text-slate-600 dark:text-slate-400">
          O endereço pode estar incorreto ou a página foi removida. Confira o link ou volte ao início.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link to="/">
            <Button className="gap-2">
              <Home className="h-4 w-4" aria-hidden />
              Ir para o início
            </Button>
          </Link>
          <Link to="/login">
            <Button variant="secondary">Entrar</Button>
          </Link>
        </div>
      </main>
    </div>
  )
}
