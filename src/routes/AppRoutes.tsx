import { AdminRoute } from '@/components/AdminRoute'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { Spinner } from '@/components/ui/Spinner'
import { DashboardLayout } from '@/layouts/DashboardLayout'
import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'

const LandingPage = lazy(() =>
  import('@/pages/LandingPage').then((m) => ({ default: m.LandingPage })),
)
const LoginPage = lazy(() =>
  import('@/pages/auth/LoginPage').then((m) => ({ default: m.LoginPage })),
)
const RegisterPage = lazy(() =>
  import('@/pages/auth/RegisterPage').then((m) => ({ default: m.RegisterPage })),
)
const PlansPublicPage = lazy(() =>
  import('@/pages/PlansPublicPage').then((m) => ({ default: m.PlansPublicPage })),
)
const PublicMenuPage = lazy(() =>
  import('@/pages/public/PublicMenuPage').then((m) => ({ default: m.PublicMenuPage })),
)
const NotFoundPage = lazy(() =>
  import('@/pages/NotFoundPage').then((m) => ({ default: m.NotFoundPage })),
)
const DashboardOverview = lazy(() =>
  import('@/pages/dashboard/DashboardOverview').then((m) => ({ default: m.DashboardOverview })),
)
const RestaurantSettingsPage = lazy(() =>
  import('@/pages/dashboard/RestaurantSettingsPage').then((m) => ({
    default: m.RestaurantSettingsPage,
  })),
)
const UserPlansPage = lazy(() =>
  import('@/pages/dashboard/UserPlansPage').then((m) => ({ default: m.UserPlansPage })),
)
const CategoriesPage = lazy(() =>
  import('@/pages/dashboard/CategoriesPage').then((m) => ({ default: m.CategoriesPage })),
)
const ProductsPage = lazy(() =>
  import('@/pages/dashboard/ProductsPage').then((m) => ({ default: m.ProductsPage })),
)
const AdminPlansPage = lazy(() =>
  import('@/pages/dashboard/AdminPlansPage').then((m) => ({ default: m.AdminPlansPage })),
)

function RouteFallback() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center bg-slate-100 dark:bg-slate-950">
      <Spinner />
    </div>
  )
}

export function AppRoutes() {
  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/planos" element={<PlansPublicPage />} />
        <Route path="/m/:slug" element={<PublicMenuPage />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/app" element={<DashboardLayout />}>
            <Route index element={<DashboardOverview />} />
            <Route path="settings" element={<RestaurantSettingsPage />} />
            <Route path="plans" element={<UserPlansPage />} />
            <Route path="categories" element={<CategoriesPage />} />
            <Route path="products" element={<ProductsPage />} />
            <Route path="admin" element={<AdminRoute />}>
              <Route index element={<Navigate to="plans" replace />} />
              <Route path="plans" element={<AdminPlansPage />} />
            </Route>
          </Route>
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  )
}
