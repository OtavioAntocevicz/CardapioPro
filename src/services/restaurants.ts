import type {
  AdminAuditLog,
  AdminRestaurantUsage,
  Plan,
  Restaurant,
  SubscriptionStatus,
} from '@/types/database'
import type { RestaurantTheme } from '@/types/theme'
import { getSupabase, getSupabasePublic } from './supabase'

const BUCKET = 'product-images'

export async function fetchMyRestaurant(): Promise<Restaurant | null> {
  const { data: userData, error: userError } = await getSupabase().auth.getUser()
  if (userError) throw userError
  const userId = userData.user?.id
  if (!userId) return null

  const { data, error } = await getSupabase()
    .from('restaurants')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle()

  if (error) throw error
  return (data as Restaurant | undefined) ?? null
}

/** Cardápio público por slug (cliente anon — políticas RLS `to anon`). */
export async function fetchRestaurantBySlug(slug: string): Promise<Restaurant | null> {
  const { data, error } = await getSupabasePublic()
    .from('restaurants')
    .select('*')
    .eq('slug', slug)
    .maybeSingle()

  if (error) throw error
  return data as Restaurant | null
}

export async function createRestaurant(input: {
  name: string
  slug: string
}): Promise<Restaurant> {
  const { data: userData, error: userError } = await getSupabase().auth.getUser()
  if (userError) throw userError
  const userId = userData.user?.id
  if (!userId) throw new Error('Sessão inválida')

  const { data: ownRestaurants, error: ownError } = await getSupabase()
    .from('restaurants')
    .select('id, plan')
    .eq('user_id', userId)

  if (ownError) throw ownError
  const currentPlan = (ownRestaurants?.[0]?.plan as Plan | undefined) ?? 'free'
  const maxRestaurants = currentPlan === 'enterprise' ? 3 : 1
  if ((ownRestaurants?.length ?? 0) >= maxRestaurants) {
    throw new Error(`plan_limit_exceeded:max_restaurants (${maxRestaurants})`)
  }

  const { data, error } = await getSupabase()
    .from('restaurants')
    .insert({
      user_id: userId,
      name: input.name.trim(),
      slug: input.slug,
      plan: currentPlan,
    })
    .select()
    .single()

  if (error) throw error
  return data as Restaurant
}

export async function updateMyRestaurant(input: {
  name: string
  slug: string
}): Promise<Restaurant> {
  const existing = await fetchMyRestaurant()
  if (!existing) throw new Error('Restaurante não encontrado')

  const slug = input.slug.trim().toLowerCase()
  const { data, error } = await getSupabase()
    .from('restaurants')
    .update({
      name: input.name.trim(),
      slug,
    })
    .eq('id', existing.id)
    .select()
    .single()

  if (error) throw error
  return data as Restaurant
}

export async function updateMyRestaurantTheme(theme: RestaurantTheme): Promise<Restaurant> {
  const existing = await fetchMyRestaurant()
  if (!existing) throw new Error('Restaurante não encontrado')

  const { data, error } = await getSupabase()
    .from('restaurants')
    .update({ theme })
    .eq('id', existing.id)
    .select()
    .single()

  if (error) throw error
  return data as Restaurant
}

/** Logo do cardápio (mesmo bucket e RLS que imagens de produto; caminho fixo com upsert). */
export async function uploadRestaurantLogo(restaurantId: string, file: File): Promise<string> {
  const ext = file.name.split('.').pop()?.toLowerCase() || 'png'
  const safeExt = ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext) ? ext : 'png'
  const path = `${restaurantId}/branding/logo.${safeExt}`

  const { error: upError } = await getSupabase().storage
    .from(BUCKET)
    .upload(path, file, { cacheControl: '3600', upsert: true })

  if (upError) throw upError

  const { data } = getSupabase().storage.from(BUCKET).getPublicUrl(path)
  return data.publicUrl
}

/** Banner de capa do cabeçalho público. */
export async function uploadRestaurantBanner(restaurantId: string, file: File): Promise<string> {
  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
  const safeExt = ['jpg', 'jpeg', 'png', 'webp'].includes(ext) ? ext : 'jpg'
  const path = `${restaurantId}/branding/banner.${safeExt}`

  const { error: upError } = await getSupabase().storage
    .from(BUCKET)
    .upload(path, file, { cacheControl: '3600', upsert: true })

  if (upError) throw upError

  const { data } = getSupabase().storage.from(BUCKET).getPublicUrl(path)
  return data.publicUrl
}

export async function fetchAllRestaurantsAdmin(): Promise<AdminRestaurantUsage[]> {
  const { data, error } = await getSupabase().rpc('admin_restaurants_usage')

  if (error) throw error
  return (data ?? []) as AdminRestaurantUsage[]
}

export async function adminSetRestaurantPlan(restaurantId: string, plan: Plan): Promise<void> {
  const { error } = await getSupabase().rpc('admin_set_restaurant_plan_status', {
    p_restaurant_id: restaurantId,
    p_plan: plan,
    p_status: 'manual',
    p_period_end: null,
    p_note: null,
  })
  if (error) throw error
}

export async function adminSetRestaurantPlanStatus(input: {
  restaurantId: string
  plan: Plan
  status: SubscriptionStatus
  periodEnd?: string | null
  note?: string | null
}): Promise<void> {
  const { error } = await getSupabase().rpc('admin_set_restaurant_plan_status', {
    p_restaurant_id: input.restaurantId,
    p_plan: input.plan,
    p_status: input.status,
    p_period_end: input.periodEnd ?? null,
    p_note: input.note ?? null,
  })
  if (error) throw error
}

export async function fetchAdminAuditLogs(restaurantId: string): Promise<AdminAuditLog[]> {
  const { data, error: listError } = await getSupabase()
    .from('admin_audit_logs')
    .select('*')
    .eq('restaurant_id', restaurantId)
    .order('created_at', { ascending: false })
    .limit(20)

  if (listError) throw listError
  return (data ?? []) as AdminAuditLog[]
}
