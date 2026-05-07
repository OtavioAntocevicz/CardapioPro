import { describe, expect, it } from 'vitest'
import { getPlanLimits } from './planLimits'

describe('planLimits', () => {
  it('retorna limite esperado para free', () => {
    expect(getPlanLimits('free')).toMatchObject({
      maxRestaurants: 1,
      maxMenus: 1,
      maxCategoriesPerMenu: 3,
      maxProductsPerCategory: 5,
      allowQrCode: false,
      allowCustomization: false,
    })
  })

  it('retorna limite esperado para enterprise', () => {
    expect(getPlanLimits('enterprise')).toMatchObject({
      maxRestaurants: 3,
      maxMenus: 3,
      maxCategoriesPerMenu: 10,
      maxProductsPerCategory: 30,
      allowQrCode: true,
      allowCustomization: true,
    })
  })
})
