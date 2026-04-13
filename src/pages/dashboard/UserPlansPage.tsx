import { PlansComparisonTable } from '@/components/plans/PlansComparisonTable'
import { Card } from '@/components/ui/Card'
import { Spinner } from '@/components/ui/Spinner'
import { PLAN_MARKETING } from '@/data/plans'
import { fetchMyRestaurant } from '@/services/restaurants'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'

export function UserPlansPage() {
  const restaurantQuery = useQuery({ queryKey: ['my-restaurant'], queryFn: fetchMyRestaurant })
  const restaurant = restaurantQuery.data
  const current = restaurant?.plan

  if (restaurantQuery.isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Planos</h1>
      <p className="mt-1 max-w-2xl text-slate-600 dark:text-slate-400">
        Compare o que cada nível oferece. A assinatura paga (Pro e Enterprise) será integrada em breve; por
        enquanto o plano da sua conta pode ser ajustado pelo suporte ou pela equipe da plataforma.
      </p>

      {restaurant ? (
        <Card className="mt-6 border-brand-200 bg-brand-50/80 dark:border-brand-500/30 dark:bg-brand-500/10">
          <p className="text-sm text-slate-800 dark:text-slate-200">
            <span className="font-medium">Seu plano atual:</span>{' '}
            <span className="text-brand-800 dark:text-brand-200">
              {PLAN_MARKETING[current ?? 'free'].name}
            </span>
            {' — '}
            {PLAN_MARKETING[current ?? 'free'].priceNote}
          </p>
        </Card>
      ) : (
        <p className="mt-6 text-sm text-slate-600 dark:text-slate-400">
          <Link to="/app" className="text-brand-600 hover:underline dark:text-brand-400">
            Crie seu restaurante
          </Link>{' '}
          na visão geral para associar um plano à sua conta.
        </p>
      )}

      <section className="mt-10" aria-labelledby="plans-compare-heading">
        <h2 id="plans-compare-heading" className="text-lg font-semibold text-slate-900 dark:text-white">
          Comparativo
        </h2>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Recursos e benefícios previstos por nível. Alguns itens de Pro e Enterprise entram conforme o produto
          evolui.
        </p>
        <div className="mt-4">
          <PlansComparisonTable highlightPlan={current ?? null} />
        </div>
      </section>

      <Card className="mt-8">
        <p className="text-sm text-slate-700 dark:text-slate-300">
          Quer assinar o <strong className="font-medium">Pro</strong> ou falar sobre{' '}
          <strong className="font-medium">Enterprise</strong>? Entre em contato pelo canal comercial quando
          estiver disponível ou use o suporte indicado no seu plano.
        </p>
      </Card>
    </div>
  )
}
