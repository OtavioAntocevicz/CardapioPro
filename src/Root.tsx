import { useAuthBootstrap } from '@/hooks/useAuth'
import { useThemeSync } from '@/hooks/useThemeSync'
import { QueryProvider } from '@/providers/QueryProvider'
import App from './App.tsx'

export function Root() {
  useAuthBootstrap()
  useThemeSync()
  return (
    <QueryProvider>
      <App />
    </QueryProvider>
  )
}
