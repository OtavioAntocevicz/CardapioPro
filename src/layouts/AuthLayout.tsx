import { ThemeToggle } from '@/components/ThemeToggle'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-slate-50 via-white to-brand-50/40 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900">
      <div
        className="pointer-events-none absolute inset-0 opacity-60 dark:opacity-40"
        style={{
          backgroundImage:
            'radial-gradient(ellipse 80% 50% at 50% -20%, rgb(99 102 241 / 0.22), transparent)',
        }}
      />
      <header className="relative z-10 border-b border-slate-200/80 bg-white/70 backdrop-blur dark:border-slate-800/80 dark:bg-slate-950/80">
        <div className="mx-auto flex h-14 max-w-lg items-center justify-between px-4">
          <Link
            to="/"
            className="text-lg font-semibold tracking-tight text-slate-900 dark:text-white"
          >
            Cardápio<span className="text-brand-600 dark:text-brand-400">Pro</span>
          </Link>
          <ThemeToggle />
        </div>
      </header>
      <main className="relative z-10 mx-auto flex max-w-lg flex-col px-4 py-10">{children}</main>
    </div>
  )
}
