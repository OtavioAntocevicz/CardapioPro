import type { Plan, Restaurant } from '@/types/database'
import type { RestaurantTheme } from '@/types/theme'
import { getSupabase, getSupabasePublic } from './supabase'

const BUCKET = 'product-images'

/** Restaurante da conta (no máximo um por usuário). Filtra por dono; não depende só do RLS. */
export async function fetchMyRestaurant(): Promise<Restaurant | null> {
  const { data: userData, error: userError } = await getSupabase().auth.getUser()
  if (userError) throw userError
  const userId = userData.user?.id
  if (!userId) return null

  const { data, error } = await getSupabase()
    .from('restaurants')
    .select('*')
    .eq('user_id', userId)
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

  const { data, error } = await getSupabase()
    .from('restaurants')
    .insert({
      user_id: userId,
      name: input.name.trim(),
      slug: input.slug,
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

/** Lista todos os restaurantes (política RLS para platform_admins). */
export async function fetchAllRestaurantsAdmin(): Promise<Restaurant[]> {
  const { data, error } = await getSupabase()
    .from('restaurants')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data ?? []) as Restaurant[]
}

export async function adminSetRestaurantPlan(restaurantId: string, plan: Plan): Promise<void> {
  const { error } = await getSupabase().rpc('admin_set_restaurant_plan', {
    p_restaurant_id: restaurantId,
    p_plan: plan,
  })
  if (error) throw error
}
