import { Spinner } from '@/components/ui/Spinner'
import { fetchIsPlatformAdmin } from '@/services/platformAdmin'
import { useAuthStore } from '@/store/authStore'
import { useQuery } from '@tanstack/react-query'
import { Navigate, Outlet } from 'react-router-dom'

export function AdminRoute() {
  const user = useAuthStore((s) => s.user)
  const adminQuery = useQuery({
    queryKey: ['platform-admin', user?.id],
    queryFn: fetchIsPlatformAdmin,
    enabled: Boolean(user),
    staleTime: 60_000,
  })

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (adminQuery.isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Spinner />
      </div>
    )
  }

  if (!adminQuery.data) {
    return <Navigate to="/app" replace />
  }

  return <Outlet />
}
