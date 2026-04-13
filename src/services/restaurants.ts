import type { Plan, Restaurant } from '@/types/database'
import { getSupabase } from './supabase'

/** Restaurante da conta (no máximo um por usuário; RLS limita aos próprios). */
export async function fetchMyRestaurant(): Promise<Restaurant | null> {
  const { data, error } = await getSupabase().from('restaurants').select('*').maybeSingle()

  if (error) throw error
  return (data as Restaurant | undefined) ?? null
}

export async function fetchRestaurantBySlug(slug: string): Promise<Restaurant | null> {
  const { data, error } = await getSupabase()
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

/** Lista todos os restaurantes (leitura já permitida pela política pública de cardápio). */
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
