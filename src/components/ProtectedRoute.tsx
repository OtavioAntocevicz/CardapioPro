import { Spinner } from '@/components/ui/Spinner'
import { useAuthStore } from '@/store/authStore'
import { Navigate, Outlet, useLocation } from 'react-router-dom'

export function ProtectedRoute() {
  const initialized = useAuthStore((s) => s.initialized)
  const user = useAuthStore((s) => s.user)
  const location = useLocation()

  if (!initialized) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Spinner />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  return <Outlet />
}
