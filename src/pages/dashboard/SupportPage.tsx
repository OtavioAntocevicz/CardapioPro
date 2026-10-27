import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { Input } from '@/components/ui/Input'
import { PageHeader } from '@/components/ui/PageHeader'
import { Spinner } from '@/components/ui/Spinner'
import { Textarea } from '@/components/ui/Textarea'
import { fetchMyRestaurant } from '@/services/restaurants'
import {
  createSupportNotification,
  fetchMySupportNotifications,
} from '@/services/supportNotifications'
import type { SupportNotificationStatus } from '@/types/database'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { LifeBuoy, Send } from 'lucide-react'
import { useState } from 'react'

const STATUS_STYLE: Record<SupportNotificationStatus, { label: string; className: string }> = {
  new: {
    label: 'Novo',
    className: 'bg-brand-50 text-brand-700 ring-brand-200 dark:bg-brand-500/10 dark:text-brand-200 dark:ring-brand-500/30',
  },
  in_progress: {
    label: 'Em atendimento',
    className: 'bg-amber-50 text-amber-800 ring-amber-200 dark:bg-amber-500/10 dark:text-amber-200 dark:ring-amber-500/30',
  },
  done: {
    label: 'Finalizado',
    className: 'bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/30',
  },
}

const dateFormatter = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' })

export function SupportPage() {
  const qc = useQueryClient()
  const restaurantQuery = useQuery({ queryKey: ['my-restaurant'], queryFn: fetchMyRestaurant })
  const listQuery = useQuery({
    queryKey: ['my-support-notifications'],
    queryFn: fetchMySupportNotifications,
  })

  const [whatsapp, setWhatsapp] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState<string | null>(null)

  const createMut = useMutation({
    mutationFn: () =>
      createSupportNotification({
        restaurantId: restaurantQuery.data!.id,
        requestType: 'support',
        contactWhatsapp: whatsapp,
        message,
      }),
    onSuccess: () => {
      setWhatsapp('')
      setMessage('')
      setError(null)
      qc.invalidateQueries({ queryKey: ['my-support-notifications'] })
    },
  })

  if (restaurantQuery.isLoading || listQuery.isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner />
      </div>
    )
  }

  if (!restaurantQuery.data) {
    return (
      <p className="text-sm text-slate-600 dark:text-slate-400">
        Crie seu restaurante primeiro para abrir solicitações de suporte.
      </p>
    )
  }

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader title="Suporte" description="Abra um chamado e acompanhe o andamento por aqui." />

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] lg:items-start">
        <Card className="lg:sticky lg:top-20">
          <h2 className="mb-4 text-base font-semibold text-slate-900 dark:text-white">Novo chamado</h2>
          <form
            className="space-y-3"
            onSubmit={(e) => {
              e.preventDefault()
              setError(null)
              if (!whatsapp.trim()) {
                setError('Informe seu WhatsApp para contato.')
                return
              }
              if (!message.trim()) {
                setError('Descreva sua dúvida ou problema.')
                return
              }
              createMut.mutate()
            }}
          >
            <Input
              label="WhatsApp"
              name="support-whatsapp"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              placeholder="Ex.: 11999999999"
            />
            <Textarea
              label="Mensagem"
              name="support-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              placeholder="Ex.: Não estou conseguindo cadastrar produtos no cardápio."
            />
            {error ? <p className="text-sm text-red-600 dark:text-red-300">{error}</p> : null}
            {createMut.isError ? (
              <p className="text-sm text-red-600 dark:text-red-300">{(createMut.error as Error).message}</p>
            ) : null}
            {createMut.isSuccess ? (
              <p className="text-sm text-emerald-700 dark:text-emerald-300">Chamado enviado com sucesso.</p>
            ) : null}
            <Button type="submit" className="w-full" loading={createMut.isPending}>
              <Send className="h-4 w-4" aria-hidden />
              Enviar solicitação
            </Button>
          </form>
        </Card>

        <section className="space-y-3" aria-labelledby="support-history">
          <h2 id="support-history" className="text-base font-semibold text-slate-900 dark:text-white">
            Histórico
          </h2>
          {(listQuery.data ?? []).length === 0 ? (
            <EmptyState
              icon={LifeBuoy}
              title="Nenhuma solicitação ainda"
              description="Quando você abrir um chamado, ele aparece aqui com o status do atendimento."
            />
          ) : (
            (listQuery.data ?? []).map((item) => {
              const status = STATUS_STYLE[item.status] ?? STATUS_STYLE.new
              return (
                <Card key={item.id} className="p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <time
                      dateTime={item.created_at}
                      className="text-xs font-medium text-slate-500 dark:text-slate-400"
                    >
                      {dateFormatter.format(new Date(item.created_at))}
                    </time>
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ${status.className}`}>
                      {status.label}
                    </span>
                  </div>
                  <p className="mt-2 whitespace-pre-line text-sm text-slate-700 dark:text-slate-300">
                    {item.message}
                  </p>
                </Card>
              )
            })
          )}
        </section>
      </div>
    </div>
  )
}
