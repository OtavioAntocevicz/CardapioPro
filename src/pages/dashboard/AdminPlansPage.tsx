import { Card } from '@/components/ui/Card'
import { Spinner } from '@/components/ui/Spinner'
import { adminSetRestaurantPlan, fetchAllRestaurantsAdmin } from '@/services/restaurants'
import type { Plan, Restaurant } from '@/types/database'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'

const PLANS: Plan[] = ['free', 'pro', 'enterprise']

function planSelectClassName() {
  return 'rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100'
}

export function AdminPlansPage() {
  const qc = useQueryClient()
  const listQuery = useQuery({
    queryKey: ['admin-restaurants'],
    queryFn: fetchAllRestaurantsAdmin,
  })

  const [pendingId, setPendingId] = useState<string | null>(null)

  const planMut = useMutation({
    mutationFn: ({ id, plan }: { id: string; plan: Plan }) => adminSetRestaurantPlan(id, plan),
    onMutate: ({ id }) => setPendingId(id),
    onSettled: () => setPendingId(null),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-restaurants'] }),
  })

  if (listQuery.isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner />
      </div>
    )
  }

  if (listQuery.isError) {
    return (
      <p className="text-sm text-red-600 dark:text-red-300">
        {(listQuery.error as Error).message}
      </p>
    )
  }

  const rows = listQuery.data ?? []

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Planos (admin)</h1>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
        Altere o plano de cada restaurante. O dono continua sendo o{' '}
        <code className="text-xs text-slate-700 dark:text-slate-300">user_id</code> no Supabase
        (Authentication → Users).
      </p>

      <h2 className="mt-8 text-lg font-semibold text-slate-900 dark:text-white">Restaurantes e planos</h2>
      <Card className="mt-3 overflow-x-auto p-0">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-800 dark:bg-slate-900/80 dark:text-slate-400">
            <tr>
              <th className="px-4 py-3 font-medium">Nome</th>
              <th className="px-4 py-3 font-medium">Slug</th>
              <th className="px-4 py-3 font-medium">Plano</th>
              <th className="px-4 py-3 font-medium">Dono (user_id)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {rows.map((r: Restaurant) => (
              <tr key={r.id} className="text-slate-800 dark:text-slate-200">
                <td className="px-4 py-3 font-medium">{r.name}</td>
                <td className="px-4 py-3 font-mono text-xs">{r.slug}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      className={planSelectClassName()}
                      value={r.plan}
                      disabled={planMut.isPending && pendingId === r.id}
                      aria-label={`Plano de ${r.name}`}
                      onChange={(e) => {
                        const plan = e.target.value as Plan
                        if (plan === r.plan) return
                        planMut.mutate({ id: r.id, plan })
                      }}
                    >
                      {PLANS.map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                  </div>
                </td>
                <td className="px-4 py-3 font-mono text-[11px] text-slate-500 dark:text-slate-500">
                  {r.user_id}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 ? (
          <p className="px-4 py-8 text-center text-slate-500 dark:text-slate-400">
            Nenhum restaurante cadastrado.
          </p>
        ) : null}
      </Card>

      {planMut.isError ? (
        <p className="mt-4 text-sm text-red-600 dark:text-red-300">
          {(planMut.error as Error).message}
        </p>
      ) : null}

      <p className="mt-6 text-xs text-slate-500 dark:text-slate-500">
        Para ver o email do dono, abra o Supabase → Authentication → Users e procure pelo UUID acima.
      </p>
    </div>
  )
}
