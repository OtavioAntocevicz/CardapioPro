export function Spinner({ className = '' }: { className?: string }) {
  return (
    <div
      className={`h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-brand-600 dark:border-slate-600 dark:border-t-brand-500 ${className}`}
      role="status"
      aria-label="Carregando"
    />
  )
}
