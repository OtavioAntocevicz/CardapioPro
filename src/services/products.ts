import type { Product, ProductInsert, ProductUpdate } from '@/types/database'
import { supabase } from './supabase'

const BUCKET = 'product-images'

export async function fetchProducts(restaurantId: string): Promise<Product[]> {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('restaurant_id', restaurantId)
    .order('created_at', { ascending: true })

  if (error) throw error
  return (data ?? []) as Product[]
}

export async function uploadProductImage(
  restaurantId: string,
  file: File,
): Promise<string> {
  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
  const safeExt = ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext) ? ext : 'jpg'
  const path = `${restaurantId}/${crypto.randomUUID()}.${safeExt}`

  const { error: upError } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { cacheControl: '3600', upsert: false })

  if (upError) throw upError

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
  return data.publicUrl
}

export async function createProduct(row: ProductInsert): Promise<Product> {
  const { data, error } = await supabase.from('products').insert(row).select().single()

  if (error) throw error
  return data as Product
}

export async function updateProduct(
  id: string,
  patch: ProductUpdate,
): Promise<Product> {
  const { data, error } = await supabase
    .from('products')
    .update(patch)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as Product
}

export async function deleteProduct(id: string): Promise<void> {
  const { error } = await supabase.from('products').delete().eq('id', id)
  if (error) throw error
}
