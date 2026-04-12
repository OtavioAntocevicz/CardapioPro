import type { Restaurant } from '@/types/database'
import { supabase } from './supabase'

/** Primeiro restaurante do usuário (RLS limita aos próprios). */
export async function fetchMyRestaurant(): Promise<Restaurant | null> {
  const { data, error } = await supabase
    .from('restaurants')
    .select('*')
    .order('created_at', { ascending: true })
    .limit(1)

  if (error) throw error
  const row = data?.[0]
  return (row as Restaurant | undefined) ?? null
}

export async function fetchRestaurantBySlug(slug: string): Promise<Restaurant | null> {
  const { data, error } = await supabase
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
  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError) throw userError
  const userId = userData.user?.id
  if (!userId) throw new Error('Sessão inválida')

  const { data, error } = await supabase
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
