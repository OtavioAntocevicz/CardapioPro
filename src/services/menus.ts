import type { Menu } from '@/types/database'
import { getSupabase, getSupabasePublic } from './supabase'

export async function fetchMenus(
  restaurantId: string,
  opts?: { asPublicVisitor?: boolean },
): Promise<Menu[]> {
  const supabase = opts?.asPublicVisitor ? getSupabasePublic() : getSupabase()
  const { data, error } = await supabase
    .from('menus')
    .select('*')
    .eq('restaurant_id', restaurantId)
    .order('created_at', { ascending: true })

  if (error) throw error
  return (data ?? []) as Menu[]
}

export async function createMenu(input: {
  restaurant_id: string
  name: string
  slug: string
  is_active?: boolean
}): Promise<Menu> {
  const { data, error } = await getSupabase().rpc('create_menu', {
    p_restaurant_id: input.restaurant_id,
    p_name: input.name.trim(),
    p_slug: input.slug.trim().toLowerCase(),
    p_is_active: input.is_active ?? false,
  })
  if (error) throw error
  return data as Menu
}

export async function updateMenu(id: string, patch: Partial<Pick<Menu, 'name' | 'is_active'>>): Promise<Menu> {
  const { data, error } = await getSupabase().from('menus').update(patch).eq('id', id).select().single()
  if (error) throw error
  return data as Menu
}

export async function deleteMenu(id: string): Promise<void> {
  const { error } = await getSupabase().from('menus').delete().eq('id', id)
  if (error) throw error
}
