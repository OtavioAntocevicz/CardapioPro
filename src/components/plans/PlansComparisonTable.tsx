import { PLAN_COMPARISON_ROWS, PLAN_MARKETING, PLAN_ORDER } from '@/data/plans'
import type { Plan } from '@/types/database'
import { Check, Minus } from 'lucide-react'

function Cell({ value }: { value: boolean | string }) {
  if (typeof value === 'boolean') {
    return value ? (
      <span className="inline-flex justify-center text-emerald-600 dark:text-emerald-400" title="Incluído">
        <Check className="h-5 w-5" strokeWidth={2.5} aria-hidden />
        <span className="sr-only">Incluído</span>
      </span>
    ) : (
      <span className="inline-flex justify-center text-slate-300 dark:text-slate-600" title="Não incluído">
        <Minus className="h-5 w-5" aria-hidden />
        <span className="sr-only">Não incluído</span>
      </span>
    )
  }
  return (
    <span className="text-left text-sm leading-snug text-slate-700 dark:text-slate-300">{value}</span>
  )
}

type PlansComparisonTableProps = {
  /** Destaca a coluna do plano atual (painel). */
  highlightPlan?: Plan | null
}

export function PlansComparisonTable({ highlightPlan }: PlansComparisonTableProps) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900/40">
      <table className="w-full min-w-[720px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900/80">
            <th
              scope="col"
              className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400"
            >
              Recurso / benefício
            </th>
            {PLAN_ORDER.map((id) => {
              const m = PLAN_MARKETING[id]
              const active = highlightPlan === id
              return (
                <th
                  key={id}
                  scope="col"
                  className={`px-4 py-4 text-center ${
                    active
                      ? 'bg-brand-50 ring-1 ring-inset ring-brand-200 dark:bg-brand-500/10 dark:ring-brand-500/35'
                      : ''
                  }`}
                >
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-base font-semibold text-slate-900 dark:text-white">{m.name}</span>
                    <span className="text-xs font-normal text-brand-700 dark:text-brand-300">{m.priceLabel}</span>
                    <span className="max-w-[10rem] text-xs font-normal text-slate-500 dark:text-slate-400">
                      {m.tagline}
                    </span>
                  </div>
                </th>
              )
            })}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
          {PLAN_COMPARISON_ROWS.map((row) => (
            <tr key={row.label} className="bg-white/80 dark:bg-slate-950/20">
              <th
                scope="row"
                className="max-w-[220px] px-4 py-3 text-left font-medium text-slate-800 dark:text-slate-200 md:max-w-none"
              >
                {row.label}
              </th>
              {PLAN_ORDER.map((id) => {
                const active = highlightPlan === id
                const val = row[id]
                return (
                  <td
                    key={id}
                    className={`px-4 py-3 text-center align-top ${
                      active
                        ? 'bg-brand-50/80 dark:bg-brand-500/[0.07]'
                        : ''
                    }`}
                  >
                    <div className={typeof val === 'boolean' ? 'flex justify-center' : 'text-center sm:text-left'}>
                      <Cell value={val} />
                    </div>
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
