import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim()
const anon = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)?.trim()

/** True quando URL e chave anon estão definidas (build/local ou Vercel). */
export const isSupabaseConfigured = Boolean(url && anon)

let client: SupabaseClient | null = null
let publicClient: SupabaseClient | null = null

/**
 * Cliente Supabase (singleton). Só chame se `isSupabaseConfigured` for true.
 * Em desenvolvimento sem .env, use a tela de configuração em vez de chamar isto.
 */
export function getSupabase(): SupabaseClient {
  if (!url || !anon) {
    throw new Error(
      'Supabase não configurado. Defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY. Na Vercel: Project → Settings → Environment Variables → adicione as duas e faça um novo deploy.',
    )
  }
  if (!client) {
    client = createClient(url, anon, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  }
  return client
}

/**
 * Cliente sem sessão: requisições usam apenas a chave anon (JWT `anon`).
 * Necessário para o cardápio público depois que as políticas RLS restringem
 * leituras públicas ao role `anon` (visitante logado continua como `authenticated`).
 */
export function getSupabasePublic(): SupabaseClient {
  if (!url || !anon) {
    throw new Error(
      'Supabase não configurado. Defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY. Na Vercel: Project → Settings → Environment Variables → adicione as duas e faça um novo deploy.',
    )
  }
  if (!publicClient) {
    publicClient = createClient(url, anon, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
        storageKey: 'cardapiopro-public-anon',
        storage: {
          getItem: async () => null,
          setItem: async () => {},
          removeItem: async () => {},
        },
      },
    })
  }
  return publicClient
}
