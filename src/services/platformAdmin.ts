import { getSupabase } from './supabase'

export async function fetchIsPlatformAdmin(): Promise<boolean> {
  const { data: userData, error: userError } = await getSupabase().auth.getUser()
  if (userError || !userData.user) return false

  const { data, error } = await getSupabase()
    .from('platform_admins')
    .select('user_id')
    .eq('user_id', userData.user.id)
    .maybeSingle()

  if (error) {
    console.warn(
      '[CardápioPro] Falha ao consultar platform_admins (rede, RLS ou indisponibilidade):',
      error.message,
    )
    return false
  }
  return data != null
}
