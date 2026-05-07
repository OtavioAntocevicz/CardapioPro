import { describe, expect, it } from 'vitest'
import { DEFAULT_RESTAURANT_THEME } from '@/types/theme'
import { parseRestaurantTheme, themeCornerClasses, themeGapBlocks } from './menuTheme'

describe('parseRestaurantTheme', () => {
  it('preenche todos os defaults quando vazio ou inválido', () => {
    expect(parseRestaurantTheme(null)).toEqual(DEFAULT_RESTAURANT_THEME)
    expect(parseRestaurantTheme({})).toMatchObject(DEFAULT_RESTAURANT_THEME)
  })

  it('aceita novo layout e tipo de cartão quando válidos', () => {
    const t = parseRestaurantTheme({
      enabled: true,
      product_layout: 'compact',
      card_style: 'flat',
      density: 'compact',
      corner_radius: 'sm',
      heading_font_family: 'playfair',
      font_family: 'lora',
    })
    expect(t.product_layout).toBe('compact')
    expect(t.card_style).toBe('flat')
    expect(t.corner_radius).toBe('sm')
    expect(t.heading_font_family).toBe('playfair')
    expect(t.font_family).toBe('lora')
  })

  it('ignora valores desconhecidos e usa defaults', () => {
    const t = parseRestaurantTheme({
      product_layout: 'not-a-layout',
      card_style: 'weird',
      density: 'loose',
      corner_radius: 'xl',
    })
    expect(t.product_layout).toBe(DEFAULT_RESTAURANT_THEME.product_layout)
    expect(t.card_style).toBe(DEFAULT_RESTAURANT_THEME.card_style)
    expect(t.density).toBe(DEFAULT_RESTAURANT_THEME.density)
    expect(t.corner_radius).toBe(DEFAULT_RESTAURANT_THEME.corner_radius)
  })

  it('heading_font_family cai na fonte corpo quando inválida', () => {
    const t = parseRestaurantTheme({
      font_family: 'poppins',
      heading_font_family: 'comic_sans',
    })
    expect(t.font_family).toBe('poppins')
    expect(t.heading_font_family).toBe('poppins')
  })
})

describe('helpers de layout', () => {
  it('themeCornerClasses retorna classes válidas', () => {
    expect(themeCornerClasses('sm').card).toBe('rounded-lg')
    expect(themeCornerClasses('lg').cardSmall).toBe('rounded-2xl')
  })

  it('themeGapBlocks muda conforme densidade', () => {
    expect(themeGapBlocks('compact')).not.toEqual(themeGapBlocks('comfortable'))
  })
})
