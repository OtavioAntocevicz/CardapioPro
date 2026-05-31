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

export type ThemeLogoAlign = 'left' | 'center' | 'right'
export type ThemeLogoShape = 'square' | 'rounded' | 'circle'
export type ThemeCardBorderStyle = 'solid' | 'dashed' | 'double'
export type ThemeEntryAnimation = 'none' | 'fade' | 'slide'
export type ThemeBadgeStyle = 'pill' | 'ribbon' | 'minimal'

/** Configuração persistida em `restaurants.theme` (jsonb). */
export interface RestaurantTheme {
  enabled: boolean
  background_color: string
  text_color: string
  accent_color: string
  font_family: ThemeFontId
  heading_font_family: ThemeFontId
  header_display: 'name' | 'logo'
  logo_url: string | null
  logo_align: ThemeLogoAlign
  /** Largura máxima da logo em px (50–200). */
  logo_size: number
  logo_shape: ThemeLogoShape
  header_banner_url: string | null
  product_layout: ThemeProductLayout
  card_style: ThemeCardStyle
  density: ThemeDensity
  corner_radius: ThemeCornerRadius
  /** Opacidade do fundo dos cards (40–100). Valores baixos = glassmorphism. */
  card_opacity: number
  card_border_style: ThemeCardBorderStyle
  entry_animation: ThemeEntryAnimation
  /** Estilo visual dos selos de destaque nos produtos. */
  badge_style: ThemeBadgeStyle
  show_product_badges: boolean
  social_instagram_url: string
  social_facebook_url: string
  show_social_float: boolean
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
  logo_align: 'center',
  logo_size: 120,
  logo_shape: 'rounded',
  header_banner_url: null,
  product_layout: 'cards',
  card_style: 'soft',
  density: 'comfortable',
  corner_radius: 'lg',
  card_opacity: 92,
  card_border_style: 'solid',
  entry_animation: 'fade',
  badge_style: 'pill',
  show_product_badges: true,
  social_instagram_url: '',
  social_facebook_url: '',
  show_social_float: false,
}
