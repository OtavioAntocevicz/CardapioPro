import type { Plan } from '@/types/database'

export type PlanLimits = {
  maxRestaurants: number
  maxMenus: number
  maxCategoriesPerMenu: number
  maxProductsPerCategory: number
  allowQrCode: boolean
  allowCustomization: boolean
}

export const PLAN_LIMITS: Record<Plan, PlanLimits> = {
  free: {
    maxRestaurants: 1,
    maxMenus: 1,
    maxCategoriesPerMenu: 3,
    maxProductsPerCategory: 5,
    allowQrCode: false,
    allowCustomization: false,
  },
  pro: {
    maxRestaurants: 1,
    maxMenus: 3,
    maxCategoriesPerMenu: 5,
    maxProductsPerCategory: 10,
    allowQrCode: true,
    allowCustomization: true,
  },
  enterprise: {
    maxRestaurants: 3,
    maxMenus: 3,
    maxCategoriesPerMenu: 10,
    maxProductsPerCategory: 30,
    allowQrCode: true,
    allowCustomization: true,
  },
}

export function getPlanLimits(plan: Plan | null | undefined): PlanLimits {
  return PLAN_LIMITS[plan ?? 'free']
}
