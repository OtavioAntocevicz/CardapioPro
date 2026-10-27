import { ThemeToggle } from '@/components/ThemeToggle'
import { buttonClass } from '@/components/ui/buttonClass'
import { Link } from 'react-router-dom'
import { ArrowRight, Palette, QrCode, Smartphone, Sparkles, Zap } from 'lucide-react'

const FEATURES = [
  {
    icon: Zap,
    tone: 'text-amber-500 bg-amber-50 dark:bg-amber-500/10 dark:text-amber-400',
    title: 'Rápido e leve',
    text: 'Interface otimizada e PWA instalável para acesso offline básico aos assets.',
  },
  {
    icon: QrCode,
    tone: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 dark:text-emerald-400',
    title: 'Link público e QR Code',
    text: 'Cada restaurante tem um link único. Clientes abrem no navegador, sem login.',
  },
  {
    icon: Palette,
    tone: 'text-brand-600 bg-brand-50 dark:bg-brand-500/10 dark:text-brand-400',
    title: 'Com a sua cara',
    text: 'Cores, fontes, banner e redes sociais personalizáveis para combinar com a marca.',
  },
]

const STEPS = [
  { title: 'Crie sua conta', text: 'Cadastro em segundos, sem cartão.' },
  { title: 'Monte o cardápio', text: 'Categorias, produtos, fotos e preços.' },
  { title: 'Compartilhe', text: 'Envie o link ou imprima o QR Code nas mesas.' },
]

export function LandingPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-slate-50 via-white to-slate-100 text-slate-900 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900 dark:text-slate-100">
      <div
        className="pointer-events-none absolute inset-0 opacity-70 dark:opacity-50"
        aria-hidden
        style={{
          backgroundImage:
            'radial-gradient(ellipse 100% 55% at 50% -8%, rgb(99 102 241 / 0.18), transparent)',
        }}
      />
      <header className="relative z-10 mx-auto flex max-w-5xl items-center justify-between gap-2 px-4 py-5">
        <Link to="/" className="text-xl font-semibold tracking-tight text-slate-900 dark:text-white">
          Cardápio<span className="text-brand-600 dark:text-brand-400">Pro</span>
        </Link>
        <nav className="flex items-center gap-1 sm:gap-2" aria-label="Principal">
          <ThemeToggle />
          <Link to="/planos" className={buttonClass('ghost', 'max-sm:hidden')}>
            Planos
          </Link>
          <Link to="/login" className={buttonClass('ghost')}>
            Entrar
          </Link>
          <Link to="/register" className={buttonClass('primary', 'max-sm:hidden')}>
            Criar conta
          </Link>
        </nav>
      </header>

      <main className="relative z-10 mx-auto max-w-5xl px-4 pb-24 pt-8 md:pt-16">
        <section className="grid items-center gap-12 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
          <div>
            <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-medium text-brand-800 dark:border-brand-500/35 dark:bg-brand-500/10 dark:text-brand-200">
              <Sparkles className="h-3.5 w-3.5" aria-hidden />
              Cardápio digital focado em performance
            </p>
            <h1 className="max-w-2xl text-4xl font-bold tracking-tight text-balance text-slate-900 dark:text-white md:text-5xl">
              Seu cardápio online, pronto para o celular do cliente.
            </h1>
            <p className="mt-5 max-w-xl text-lg text-slate-600 dark:text-slate-400">
              Gerencie categorias e produtos, envie fotos e compartilhe um link público. Sem
              complicação — pensado para restaurantes que querem escalar.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link to="/register" className={buttonClass('primary', 'px-6 py-3 text-base')}>
                Começar grátis
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
              <Link to="/planos" className={buttonClass('secondary', 'px-6 py-3 text-base')}>
                Ver planos
              </Link>
            </div>
          </div>

          <div className="relative mx-auto hidden w-full max-w-xs lg:block" aria-hidden>
            <div className="absolute -inset-6 rounded-[2.5rem] bg-brand-500/10 blur-2xl dark:bg-brand-500/20" />
            <div className="relative rounded-[2rem] border border-slate-200 bg-white p-3 shadow-2xl dark:border-slate-700 dark:bg-slate-900">
              <div className="rounded-[1.5rem] bg-slate-50 p-4 dark:bg-slate-950">
                <div className="h-20 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700" />
                <div className="mt-4 flex gap-2">
                  {['Entradas', 'Pratos', 'Bebidas'].map((c, i) => (
                    <span
                      key={c}
                      className={`rounded-full px-2.5 py-1 text-[10px] font-medium ${
                        i === 0
                          ? 'bg-brand-600 text-white'
                          : 'bg-white text-slate-600 ring-1 ring-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700'
                      }`}
                    >
                      {c}
                    </span>
                  ))}
                </div>
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="mt-3 flex items-center gap-3 rounded-xl bg-white p-2.5 ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800"
                  >
                    <div className="h-10 w-10 rounded-lg bg-slate-200 dark:bg-slate-700" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-2 w-3/4 rounded bg-slate-200 dark:bg-slate-700" />
                      <div className="h-2 w-1/3 rounded bg-brand-200 dark:bg-brand-500/40" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="mt-20 grid gap-4 md:grid-cols-3" aria-label="Recursos">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="rounded-xl border border-slate-200/90 bg-white/80 p-5 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/50"
            >
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${f.tone}`}>
                <f.icon className="h-5 w-5" aria-hidden />
              </div>
              <h2 className="mt-4 font-semibold text-slate-900 dark:text-white">{f.title}</h2>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{f.text}</p>
            </div>
          ))}
        </section>

        <section className="mt-20" aria-labelledby="como-funciona">
          <h2
            id="como-funciona"
            className="flex items-center gap-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-white"
          >
            <Smartphone className="h-6 w-6 text-brand-600 dark:text-brand-400" aria-hidden />
            Como funciona
          </h2>
          <ol className="mt-6 grid gap-4 sm:grid-cols-3">
            {STEPS.map((s, i) => (
              <li key={s.title} className="flex gap-4">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-600 text-sm font-semibold text-white">
                  {i + 1}
                </span>
                <div>
                  <p className="font-medium text-slate-900 dark:text-white">{s.title}</p>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{s.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>
      </main>

      <footer className="relative z-10 border-t border-slate-200 py-6 text-center text-xs text-slate-500 dark:border-slate-800 dark:text-slate-500">
        © {new Date().getFullYear()} CardápioPro
      </footer>
    </div>
  )
}
