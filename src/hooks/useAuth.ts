import { supabase } from '@/services/supabase'
import { useAuthStore } from '@/store/authStore'
import { useEffect } from 'react'

export function useAuthBootstrap() {
  const setSession = useAuthStore((s) => s.setSession)
  const setInitialized = useAuthStore((s) => s.setInitialized)

  useEffect(() => {
    let mounted = true

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return
      setSession(session)
      setInitialized(true)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [setSession, setInitialized])
}
