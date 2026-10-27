import { ThemeToggle } from '@/components/ThemeToggle'
import { Button } from '@/components/ui/Button'
import { getSupabase } from '@/services/supabase'
import { useAuthStore } from '@/store/authStore'
import { fetchIsPlatformAdmin } from '@/services/platformAdmin'
import { useQuery } from '@tanstack/react-query'
import {
  Bell,
  CreditCard,
  LayoutDashboard,
  LayoutList,
  LifeBuoy,
  LogOut,
  Menu,
  Package,
  Palette,
  Settings,
  Shield,
  Tags,
  UtensilsCrossed,
  X,
  type LucideIcon,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'

type NavItem = { to: string; label: string; icon: LucideIcon; end?: boolean }
type NavGroup = { title: string; items: NavItem[]; adminOnly?: boolean }

const NAV_GROUPS: NavGroup[] = [
  {
    title: 'Geral',
    items: [
      { to: '/app', label: 'Visão geral', icon: LayoutDashboard, end: true },
      { to: '/app/settings', label: 'Restaurante', icon: Settings },
    ],
  },
  {
    title: 'Cardápio',
    items: [
      { to: '/app/menus', label: 'Cardápios', icon: LayoutList },
      { to: '/app/categories', label: 'Categorias', icon: Tags },
      { to: '/app/products', label: 'Produtos', icon: Package },
      { to: '/app/personalizacao', label: 'Personalização', icon: Palette },
    ],
  },
  {
    title: 'Conta',
    items: [
      { to: '/app/plans', label: 'Planos', icon: CreditCard },
      { to: '/app/support', label: 'Suporte', icon: LifeBuoy },
    ],
  },
  {
    title: 'Administração',
    adminOnly: true,
    items: [
      { to: '/app/admin/plans', label: 'Planos (admin)', icon: Shield },
      { to: '/app/admin/notifications', label: 'Notificações', icon: Bell },
    ],
  },
]

const ALL_ITEMS = NAV_GROUPS.flatMap((g) => g.items)

function currentPageTitle(pathname: string): string {
  const match = ALL_ITEMS.filter((item) =>
    item.end ? pathname === item.to : pathname === item.to || pathname.startsWith(`${item.to}/`),
  ).sort((a, b) => b.to.length - a.to.length)[0]
  return match?.label ?? 'Painel'
}

const navClass = ({ isActive }: { isActive: boolean }) =>
  `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
    isActive
      ? 'bg-brand-50 text-brand-800 ring-1 ring-brand-200 dark:bg-brand-500/15 dark:text-brand-200 dark:ring-brand-500/30'
      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/80 dark:hover:text-slate-100'
  }`

export function DashboardLayout() {
  const user = useAuthStore((s) => s.user)
  const setSession = useAuthStore((s) => s.setSession)
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [open, setOpen] = useState(false)

  const adminQuery = useQuery({
    queryKey: ['platform-admin', user?.id],
    queryFn: fetchIsPlatformAdmin,
    enabled: Boolean(user),
    staleTime: 60_000,
  })
  const isPlatformAdmin = Boolean(adminQuery.data)
  const pageTitle = currentPageTitle(pathname)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open])

  async function handleLogout() {
    await getSupabase().auth.signOut()
    setSession(null)
    navigate('/login', { replace: true })
  }

  const email = user?.email ?? ''
  const initial = email.charAt(0).toUpperCase() || '?'

  const sidebar = (
    <div className="flex h-full flex-col border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      <div className="flex h-14 shrink-0 items-center gap-2 border-b border-slate-200 px-4 dark:border-slate-800">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white shadow-sm shadow-brand-600/30">
          <UtensilsCrossed className="h-4 w-4" aria-hidden />
        </div>
        <span className="font-semibold tracking-tight text-slate-900 dark:text-slate-100">
          Cardápio<span className="text-brand-600 dark:text-brand-400">Pro</span>
        </span>
      </div>
      <nav className="flex-1 space-y-5 overflow-y-auto p-3" aria-label="Navegação do painel">
        {NAV_GROUPS.filter((g) => !g.adminOnly || isPlatformAdmin).map((group) => (
          <div key={group.title}>
            <p className="px-3 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              {group.title}
            </p>
            <div className="flex flex-col gap-0.5">
              {group.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={navClass}
                  onClick={() => setOpen(false)}
                >
                  <item.icon className="h-4 w-4 shrink-0" aria-hidden />
                  {item.label}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>
      <div className="shrink-0 border-t border-slate-200 p-3 dark:border-slate-800">
        <div className="flex items-center gap-3 px-1">
          <div
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200"
            aria-hidden
          >
            {initial}
          </div>
          <p className="min-w-0 flex-1 truncate text-xs text-slate-500 dark:text-slate-400" title={email}>
            {email}
          </p>
        </div>
        <Button variant="ghost" className="mt-2 w-full justify-start" onClick={handleLogout}>
          <LogOut className="h-4 w-4" aria-hidden />
          Sair
        </Button>
      </div>
    </div>
  )

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 md:block">{sidebar}</aside>

      {open ? (
        <div className="fixed inset-0 z-40 md:hidden" role="dialog" aria-modal aria-label="Menu">
          <button
            type="button"
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm dark:bg-black/60"
            aria-label="Fechar menu"
            onClick={() => setOpen(false)}
          />
          <div className="absolute left-0 top-0 h-full w-[min(280px,85vw)] shadow-2xl">
            {sidebar}
            <button
              type="button"
              className="absolute right-2 top-3 rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
              onClick={() => setOpen(false)}
              aria-label="Fechar"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between gap-2 border-b border-slate-200 bg-white/90 px-3 backdrop-blur md:px-8 dark:border-slate-800 dark:bg-slate-950/90">
          <div className="flex min-w-0 items-center gap-2">
            <button
              type="button"
              className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 md:hidden dark:text-slate-300 dark:hover:bg-slate-800"
              onClick={() => setOpen(true)}
              aria-label="Abrir menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <span className="truncate text-sm font-medium text-slate-800 dark:text-slate-200">
              {pageTitle}
            </span>
          </div>
          <ThemeToggle />
        </header>
        <main className="flex-1 px-4 py-6 md:px-8 md:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
