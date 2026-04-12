import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon
  title: string
  description?: string
  action?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-slate-300 bg-slate-50/80 px-6 py-14 text-center dark:border-slate-600 dark:bg-slate-900/30">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-100 text-brand-600 dark:bg-slate-800 dark:text-brand-400">
        <Icon className="h-6 w-6" aria-hidden />
      </div>
      <div>
        <p className="font-medium text-slate-900 dark:text-slate-100">{title}</p>
        {description ? (
          <p className="mt-1 max-w-sm text-sm text-slate-600 dark:text-slate-400">{description}</p>
        ) : null}
      </div>
      {action}
    </div>
  )
}
