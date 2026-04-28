export type Plan = 'free' | 'pro' | 'enterprise'

export interface Restaurant {
  id: string
  user_id: string
  name: string
  slug: string
  plan: Plan
  created_at: string
  /** Configuração do cardápio público; vindo do Supabase como jsonb. */
  theme?: unknown
}

export interface Category {
  id: string
  restaurant_id: string
  name: string
  created_at: string
}

export interface Product {
  id: string
  restaurant_id: string
  category_id: string | null
  name: string
  description: string | null
  price: number
  image_url: string | null
  is_available: boolean
  created_at: string
}

export type ProductInsert = Omit<Product, 'id' | 'created_at'>
export type ProductUpdate = Partial<
  Pick<Product, 'name' | 'description' | 'price' | 'image_url' | 'is_available' | 'category_id'>
>
