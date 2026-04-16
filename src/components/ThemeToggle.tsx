import { useThemeStore } from '@/store/themeStore'
import { Moon, Sun } from 'lucide-react'

export function ThemeToggle({ className = '' }: { className?: string }) {
  const theme = useThemeStore((s) => s.theme)
  const setTheme = useThemeStore((s) => s.setTheme)

  function toggle() {
    setTheme(theme === 'light' ? 'dark' : 'light')
  }

  const Icon = theme === 'light' ? Sun : Moon
  const label = theme === 'light' ? 'Tema claro' : 'Tema escuro'
  const nextHint = theme === 'light' ? 'Alternar para tema escuro' : 'Alternar para tema claro'

  return (
    <button
      type="button"
      onClick={toggle}
      title={`${label} — ${nextHint}`}
      aria-label={nextHint}
      className={`inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700/80 ${className}`}
    >
      <Icon className="h-4 w-4" aria-hidden />
    </button>
  )
}
