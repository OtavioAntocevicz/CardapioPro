import { PlansComparisonTable } from '@/components/plans/PlansComparisonTable'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Spinner } from '@/components/ui/Spinner'
import { Textarea } from '@/components/ui/Textarea'
import { PLAN_MARKETING } from '@/data/plans'
import { fetchMyRestaurant } from '@/services/restaurants'
import { createSupportNotification } from '@/services/supportNotifications'
import { useMutation } from '@tanstack/react-query'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { Link } from 'react-router-dom'

export function UserPlansPage() {
  const restaurantQuery = useQuery({ queryKey: ['my-restaurant'], queryFn: fetchMyRestaurant })
  const restaurant = restaurantQuery.data
  const current = restaurant?.plan
  const [whatsapp, setWhatsapp] = useState('')
  const [message, setMessage] = useState('')
  const [localError, setLocalError] = useState<string | null>(null)

  const requestMut = useMutation({
    mutationFn: (input: { whatsapp: string; message: string }) =>
      createSupportNotification({
        restaurantId: restaurant!.id,
        requestType: 'plan',
        contactWhatsapp: input.whatsapp,
        message: input.message,
      }),
    onSuccess: () => {
      setWhatsapp('')
      setMessage('')
      setLocalError(null)
    },
  })

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
          Compare limites e recursos principais por plano.
        </p>
        <div className="mt-4">
          <PlansComparisonTable highlightPlan={current ?? null} />
        </div>
      </section>

      {restaurant ? (
        <Card className="mt-8">
          <form
            className="rounded-lg border border-slate-200 p-4 dark:border-slate-700"
            onSubmit={(e) => {
              e.preventDefault()
              setLocalError(null)
              if (!whatsapp.trim()) {
                setLocalError('Informe seu WhatsApp para contato.')
                return
              }
              if (!message.trim()) {
                setLocalError('Descreva o que você precisa.')
                return
              }
              requestMut.mutate({ whatsapp, message })
            }}
          >
            <p className="text-sm font-medium text-slate-800 dark:text-slate-100">Solicitar plano</p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Isso cria uma notificação para o admin com seu restaurante e contato.
            </p>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <Input
                label="WhatsApp"
                name="request-whatsapp"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder="Ex.: 11999999999"
              />
            </div>
            <div className="mt-3">
              <Textarea
                label="Mensagem"
                name="request-message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={3}
                placeholder="Ex.: Quero migrar para o Pro e entender valores."
              />
            </div>
            {localError ? (
              <p className="mt-2 text-sm text-red-600 dark:text-red-300">{localError}</p>
            ) : null}
            {requestMut.isError ? (
              <p className="mt-2 text-sm text-red-600 dark:text-red-300">
                {(requestMut.error as Error).message}
              </p>
            ) : null}
            {requestMut.isSuccess ? (
              <p className="mt-2 text-sm text-emerald-700 dark:text-emerald-300">
                Solicitação enviada com sucesso.
              </p>
            ) : null}
            <div className="mt-3">
              <Button type="submit" loading={requestMut.isPending}>
                Solicitar agora
              </Button>
            </div>
          </form>
        </Card>
      ) : null}
    </div>
  )
}
