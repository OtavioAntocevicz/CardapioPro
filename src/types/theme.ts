/** IDs das fontes disponíveis no cardápio público (Google Fonts + sistema). */
export type ThemeFontId = 'system' | 'dm_sans' | 'playfair' | 'lora' | 'poppins'

/** Configuração persistida em `restaurants.theme` (jsonb). */
export interface RestaurantTheme {
  /** Quando true, o cardápio público usa estas opções em vez do visual padrão. */
  enabled: boolean
  background_color: string
  /** Hex válido ou string vazia = contraste automático a partir do fundo. */
  text_color: string
  accent_color: string
  font_family: ThemeFontId
  header_display: 'name' | 'logo'
  logo_url: string | null
}

export const DEFAULT_RESTAURANT_THEME: RestaurantTheme = {
  enabled: false,
  background_color: '#f8fafc',
  text_color: '',
  accent_color: '#4f46e5',
  font_family: 'dm_sans',
  header_display: 'name',
  logo_url: null,
}
