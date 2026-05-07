import { Card } from '@/components/ui/Card'
import { Spinner } from '@/components/ui/Spinner'
import {
  fetchSupportNotificationsAdmin,
  updateSupportNotificationStatus,
} from '@/services/supportNotifications'
import type { SupportNotification, SupportNotificationStatus } from '@/types/database'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

const STATUS_OPTIONS: { id: SupportNotificationStatus; label: string }[] = [
  { id: 'new', label: 'Novo' },
  { id: 'in_progress', label: 'Em atendimento' },
  { id: 'done', label: 'Finalizado' },
]

function typeLabel(type: SupportNotification['request_type']): string {
  return type === 'plan' ? 'Plano' : 'Suporte'
}

export function AdminNotificationsPage() {
  const qc = useQueryClient()
  const listQuery = useQuery({
    queryKey: ['admin-support-notifications'],
    queryFn: fetchSupportNotificationsAdmin,
  })

  const statusMut = useMutation({
    mutationFn: ({ id, status }: { id: string; status: SupportNotificationStatus }) =>
      updateSupportNotificationStatus(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-support-notifications'] }),
  })

  if (listQuery.isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner />
      </div>
    )
  }

  if (listQuery.isError) {
    return <p className="text-sm text-red-600 dark:text-red-300">{(listQuery.error as Error).message}</p>
  }

  const items = listQuery.data ?? []

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Notificações</h1>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
        Solicitações de plano e suporte enviadas pelos restaurantes.
      </p>

      <div className="mt-6 space-y-3">
        {items.length === 0 ? (
          <Card>
            <p className="text-sm text-slate-500 dark:text-slate-400">Nenhuma notificação no momento.</p>
          </Card>
        ) : (
          items.map((item) => (
            <Card key={item.id}>
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div className="space-y-1.5">
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    Conversa: {item.restaurant_name ?? item.restaurant_id}
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Tipo: {typeLabel(item.request_type)} • Recebido em:{' '}
                    {new Date(item.created_at).toLocaleString()}
                  </p>
                  <p className="text-sm text-slate-800 dark:text-slate-200">
                    WhatsApp: <span className="font-medium">{item.contact_whatsapp}</span>
                  </p>
                  <p className="text-sm text-slate-700 dark:text-slate-300">{item.message}</p>
                </div>

                <div className="flex items-center gap-2">
                  <select
                    className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                    value={item.status}
                    onChange={(e) =>
                      statusMut.mutate({ id: item.id, status: e.target.value as SupportNotificationStatus })
                    }
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
