import { MissingSupabaseConfig } from '@/components/MissingSupabaseConfig'
import { useAuthBootstrap } from '@/hooks/useAuth'
import { useThemeSync } from '@/hooks/useThemeSync'
import { QueryProvider } from '@/providers/QueryProvider'
import { isSupabaseConfigured } from '@/services/supabase'
import App from './App.tsx'

export function Root() {
  useThemeSync()
  useAuthBootstrap()

  if (!isSupabaseConfigured) {
    return <MissingSupabaseConfig />
  }

  return (
    <QueryProvider>
      <App />
    </QueryProvider>
  )
}
