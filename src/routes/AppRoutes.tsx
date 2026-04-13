import { AdminRoute } from '@/components/AdminRoute'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { DashboardLayout } from '@/layouts/DashboardLayout'
import { LoginPage } from '@/pages/auth/LoginPage'
import { RegisterPage } from '@/pages/auth/RegisterPage'
import { AdminPlansPage } from '@/pages/dashboard/AdminPlansPage'
import { CategoriesPage } from '@/pages/dashboard/CategoriesPage'
import { DashboardOverview } from '@/pages/dashboard/DashboardOverview'
import { ProductsPage } from '@/pages/dashboard/ProductsPage'
import { RestaurantSettingsPage } from '@/pages/dashboard/RestaurantSettingsPage'
import { LandingPage } from '@/pages/LandingPage'
import { PublicMenuPage } from '@/pages/public/PublicMenuPage'
import { Navigate, Route, Routes } from 'react-router-dom'

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/m/:slug" element={<PublicMenuPage />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/app" element={<DashboardLayout />}>
          <Route index element={<DashboardOverview />} />
          <Route path="settings" element={<RestaurantSettingsPage />} />
          <Route path="categories" element={<CategoriesPage />} />
          <Route path="products" element={<ProductsPage />} />
          <Route path="admin" element={<AdminRoute />}>
            <Route index element={<Navigate to="plans" replace />} />
            <Route path="plans" element={<AdminPlansPage />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<LandingPage />} />
    </Routes>
  )
}
