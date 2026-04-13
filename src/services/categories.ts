import type { Category } from '@/types/database'
import { getSupabase, getSupabasePublic } from './supabase'

export async function fetchCategories(
  restaurantId: string,
  opts?: { asPublicVisitor?: boolean },
): Promise<Category[]> {
  const supabase = opts?.asPublicVisitor ? getSupabasePublic() : getSupabase()
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('restaurant_id', restaurantId)
    .order('created_at', { ascending: true })

  if (error) throw error
  return (data ?? []) as Category[]
}

export async function createCategory(
  restaurantId: string,
  name: string,
): Promise<Category> {
  const { data, error } = await getSupabase()
    .from('categories')
    .insert({ restaurant_id: restaurantId, name: name.trim() })
    .select()
    .single()

  if (error) throw error
  return data as Category
}

export async function updateCategory(id: string, name: string): Promise<Category> {
  const { data, error } = await getSupabase()
    .from('categories')
    .update({ name: name.trim() })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as Category
}

export async function deleteCategory(id: string): Promise<void> {
  const { error } = await getSupabase().from('categories').delete().eq('id', id)
  if (error) throw error
}
