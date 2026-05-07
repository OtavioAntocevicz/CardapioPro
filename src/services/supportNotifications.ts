import type {
  SupportNotification,
  SupportNotificationStatus,
  SupportRequestType,
} from '@/types/database'
import { getSupabase } from './supabase'

export async function createSupportNotification(input: {
  restaurantId: string
  requestType: SupportRequestType
  contactWhatsapp: string
  message: string
}): Promise<SupportNotification> {
  const { data: userData, error: userError } = await getSupabase().auth.getUser()
  if (userError) throw userError
  const userId = userData.user?.id
  if (!userId) throw new Error('Sessão inválida')

  const { data, error } = await getSupabase()
    .from('support_notifications')
    .insert({
      restaurant_id: input.restaurantId,
      user_id: userId,
      request_type: input.requestType,
      contact_whatsapp: input.contactWhatsapp.trim(),
      message: input.message.trim(),
    })
    .select('*')
    .single()

  if (error) throw error
  return data as SupportNotification
}

export async function fetchSupportNotificationsAdmin(): Promise<SupportNotification[]> {
  const { data, error } = await getSupabase()
    .from('support_notifications')
    .select('*, restaurants(name)')
    .order('created_at', { ascending: false })

  if (error) throw error
  type NotificationRow = SupportNotification & { restaurants?: { name?: string | null } | null }
  return ((data ?? []) as NotificationRow[]).map((row) => ({
    ...row,
    restaurant_name: row.restaurants?.name ?? undefined,
  })) as SupportNotification[]
}

export async function fetchMySupportNotifications(): Promise<SupportNotification[]> {
  const { data, error } = await getSupabase()
    .from('support_notifications')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data ?? []) as SupportNotification[]
}

export async function updateSupportNotificationStatus(
  id: string,
  status: SupportNotificationStatus,
): Promise<void> {
  const patch: Record<string, string | null> = { status }
  patch.handled_at = status === 'done' ? new Date().toISOString() : null
  const { error } = await getSupabase().from('support_notifications').update(patch).eq('id', id)
  if (error) throw error
}
