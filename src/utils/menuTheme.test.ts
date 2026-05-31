import { describe, expect, it } from 'vitest'
import { DEFAULT_RESTAURANT_THEME } from '@/types/theme'
import {
  parseRestaurantTheme,
  pickCardSurfaceWithOpacity,
  themeCornerClasses,
  themeGapBlocks,
  themeGlassBlur,
} from './menuTheme'

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

  it('aceita novos campos de branding e estilo', () => {
    const t = parseRestaurantTheme({
      logo_align: 'left',
      logo_size: 180,
      logo_shape: 'circle',
      card_opacity: 65,
      card_border_style: 'dashed',
      entry_animation: 'slide',
      badge_style: 'ribbon',
      show_social_float: true,
    })
    expect(t.logo_align).toBe('left')
    expect(t.logo_size).toBe(180)
    expect(t.card_opacity).toBe(65)
    expect(t.entry_animation).toBe('slide')
  })
})

describe('pickCardSurfaceWithOpacity', () => {
  it('gera superfícies distintas em fundo escuro conforme o slider', () => {
    const low = pickCardSurfaceWithOpacity('#0f172a', 40)
    const high = pickCardSurfaceWithOpacity('#0f172a', 100)
    expect(low).not.toBe(high)
    expect(low).toMatch(/^rgba\(\d+, \d+, \d+, 0\.\d+\)$/)
  })

  it('aplica blur proporcional abaixo de 96%', () => {
    expect(themeGlassBlur(100)).toBeUndefined()
    expect(themeGlassBlur(70)).toMatch(/blur\(\d+px\)/)
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
