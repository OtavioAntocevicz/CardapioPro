import { ProtectedRoute } from '@/components/ProtectedRoute'
import { DashboardLayout } from '@/layouts/DashboardLayout'
import { LoginPage } from '@/pages/auth/LoginPage'
import { RegisterPage } from '@/pages/auth/RegisterPage'
import { CategoriesPage } from '@/pages/dashboard/CategoriesPage'
import { DashboardOverview } from '@/pages/dashboard/DashboardOverview'
import { ProductsPage } from '@/pages/dashboard/ProductsPage'
import { LandingPage } from '@/pages/LandingPage'
import { PublicMenuPage } from '@/pages/public/PublicMenuPage'
import { Route, Routes } from 'react-router-dom'

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
          <Route path="categories" element={<CategoriesPage />} />
          <Route path="products" element={<ProductsPage />} />
        </Route>
      </Route>

      <Route path="*" element={<LandingPage />} />
    </Routes>
  )
}
