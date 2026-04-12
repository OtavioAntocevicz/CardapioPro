import { useThemeStore, type ThemePreference } from '@/store/themeStore'
import { Laptop, Moon, Sun } from 'lucide-react'

const cycle: ThemePreference[] = ['light', 'dark', 'system']

const labels: Record<ThemePreference, string> = {
  light: 'Tema claro',
  dark: 'Tema escuro',
  system: 'Seguir o sistema',
}

export function ThemeToggle({ className = '' }: { className?: string }) {
  const theme = useThemeStore((s) => s.theme)
  const setTheme = useThemeStore((s) => s.setTheme)

  function toggle() {
    const i = cycle.indexOf(theme)
    setTheme(cycle[(i + 1) % cycle.length])
  }

  const Icon = theme === 'light' ? Sun : theme === 'dark' ? Moon : Laptop

  return (
    <button
      type="button"
      onClick={toggle}
      title={`${labels[theme]} (clique para alternar)`}
      aria-label={labels[theme]}
      className={`inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700/80 ${className}`}
    >
      <Icon className="h-4 w-4" aria-hidden />
    </button>
  )
}
