/** IDs das fontes disponíveis no cardápio público (Google Fonts + sistema). */
export type ThemeFontId = 'system' | 'dm_sans' | 'playfair' | 'lora' | 'poppins'

/** Modo inicial do catálogo de produtos no link público. */
export type ThemeProductLayout = 'cards' | 'list' | 'compact'

/** Sombreamento dos cartões / blocos no cardápio público. */
export type ThemeCardStyle = 'soft' | 'flat' | 'elevated'

/** Espaçamento entre itens quando aplicável (listas principalmente). */
export type ThemeDensity = 'comfortable' | 'compact'

/** Cantos nos cartões públicos e miniaturas. */
export type ThemeCornerRadius = 'sm' | 'md' | 'lg'

/** Configuração persistida em `restaurants.theme` (jsonb). */
export interface RestaurantTheme {
  /** Quando true, o cardápio público usa estas opções em vez do visual padrão. */
  enabled: boolean
  background_color: string
  /** Hex válido ou string vazia = contraste automático a partir do fundo. */
  text_color: string
  accent_color: string
  font_family: ThemeFontId
  /** Fonte só para nome do estabelecimento e nomes de produtos (titulação); se igual a font_family, comportamento igual ao anterior. */
  heading_font_family: ThemeFontId
  header_display: 'name' | 'logo'
  logo_url: string | null
  product_layout: ThemeProductLayout
  card_style: ThemeCardStyle
  density: ThemeDensity
  corner_radius: ThemeCornerRadius
}

export const DEFAULT_RESTAURANT_THEME: RestaurantTheme = {
  enabled: false,
  background_color: '#f8fafc',
  text_color: '',
  accent_color: '#4f46e5',
  font_family: 'dm_sans',
  heading_font_family: 'dm_sans',
  header_display: 'name',
  logo_url: null,
  product_layout: 'cards',
  card_style: 'soft',
  density: 'comfortable',
  corner_radius: 'lg',
}
