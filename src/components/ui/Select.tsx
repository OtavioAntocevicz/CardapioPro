import type { SelectHTMLAttributes } from 'react'

type Props = SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string
  hint?: string
}

export function Select({ label, hint, className = '', id, children, ...rest }: Props) {
  const selectId = id ?? rest.name
  return (
    <div className="flex w-full flex-col gap-1.5">
      {label ? (
        <label htmlFor={selectId} className="text-sm font-medium text-slate-700 dark:text-slate-300">
          {label}
        </label>
      ) : null}
      <select
        id={selectId}
        className={`w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 disabled:opacity-60 dark:border-slate-600 dark:bg-slate-900/80 dark:text-slate-100 ${className}`}
        {...rest}
      >
        {children}
      </select>
      {hint ? <p className="text-xs text-slate-500 dark:text-slate-500">{hint}</p> : null}
    </div>
  )
}
