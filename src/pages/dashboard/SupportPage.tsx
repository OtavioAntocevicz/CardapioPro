import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Spinner } from '@/components/ui/Spinner'
import { Textarea } from '@/components/ui/Textarea'
import { fetchMyRestaurant } from '@/services/restaurants'
import {
  createSupportNotification,
  fetchMySupportNotifications,
} from '@/services/supportNotifications'
import type { SupportNotificationStatus } from '@/types/database'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'

function statusLabel(status: SupportNotificationStatus): string {
  if (status === 'in_progress') return 'Em atendimento'
  if (status === 'done') return 'Finalizado'
  return 'Novo'
}

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
    <div className="mx-auto max-w-4xl">
      <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Suporte</h1>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
        Abra um chamado e acompanhe o andamento por aqui.
      </p>

      <Card className="mt-6">
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
          <Button type="submit" loading={createMut.isPending}>
            Enviar solicitação
          </Button>
        </form>
      </Card>

      <div className="mt-8 space-y-3">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Histórico</h2>
        {(listQuery.data ?? []).length === 0 ? (
          <Card>
            <p className="text-sm text-slate-500 dark:text-slate-400">Nenhuma solicitação enviada ainda.</p>
          </Card>
        ) : (
          (listQuery.data ?? []).map((item) => (
            <Card key={item.id}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                  {new Date(item.created_at).toLocaleString()}
                </p>
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                  {statusLabel(item.status)}
                </span>
              </div>
              <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">{item.message}</p>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
