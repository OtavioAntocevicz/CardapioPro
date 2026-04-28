import {
  DEFAULT_RESTAURANT_THEME,
  type RestaurantTheme,
  type ThemeFontId,
} from '@/types/theme'

const HEX = /^#?([0-9a-fA-F]{6}|[0-9a-fA-F]{3})$/

export function normalizeHex(input: string): string | null {
  const s = input.trim()
  if (!s) return null
  const m = s.match(HEX)
  if (!m) return null
  let h = m[1]
  if (h.length === 3) {
    h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2]
  }
  return `#${h.toLowerCase()}`
}

function parseRgb(hex: string): { r: number; g: number; b: number } | null {
  const n = normalizeHex(hex)
  if (!n) return null
  const h = n.slice(1)
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  }
}

/** Luminância relativa (sRGB), 0–1. */
export function relativeLuminance(hex: string): number {
  const rgb = parseRgb(hex)
  if (!rgb) return 0.5
  const lin = (c: number) => {
    const x = c / 255
    return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4
  }
  const r = lin(rgb.r)
  const g = lin(rgb.g)
  const b = lin(rgb.b)
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/** Texto legível sobre o fundo informado. */
export function pickContrastTextColor(backgroundHex: string): '#0f172a' | '#f8fafc' {
  return relativeLuminance(backgroundHex) > 0.55 ? '#0f172a' : '#f8fafc'
}

/** Superfície de cards (produtos) com bom contraste sobre o fundo. */
export function pickCardSurface(backgroundHex: string): string {
  const dark = relativeLuminance(backgroundHex) <= 0.55
  return dark ? 'rgba(15, 23, 42, 0.55)' : 'rgba(255, 255, 255, 0.92)'
}

export function pickCardBorder(backgroundHex: string): string {
  const dark = relativeLuminance(backgroundHex) <= 0.55
  return dark ? 'rgba(148, 163, 184, 0.35)' : 'rgba(15, 23, 42, 0.12)'
}

const FONT_STACK: Record<ThemeFontId, string> = {
  system:
    'ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji"',
  dm_sans: '"DM Sans", ui-sans-serif, system-ui, sans-serif',
  playfair: '"Playfair Display", Georgia, "Times New Roman", serif',
  lora: '"Lora", Georgia, "Times New Roman", serif',
  poppins: '"Poppins", ui-sans-serif, system-ui, sans-serif',
}

export function themeFontStack(id: ThemeFontId): string {
  return FONT_STACK[id] ?? FONT_STACK.dm_sans
}

/** Mescla JSON salvo com defaults seguros. */
export function parseRestaurantTheme(raw: unknown): RestaurantTheme {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return { ...DEFAULT_RESTAURANT_THEME }
  }
  const o = raw as Record<string, unknown>
  const font = o.font_family
  const fonts: ThemeFontId[] = ['system', 'dm_sans', 'playfair', 'lora', 'poppins']
  return {
    enabled: Boolean(o.enabled),
    background_color:
      normalizeHex(String(o.background_color ?? '')) ??
      DEFAULT_RESTAURANT_THEME.background_color,
    text_color: (() => {
      const s = String(o.text_color ?? '').trim()
      if (s === '') return ''
      return normalizeHex(s) ?? DEFAULT_RESTAURANT_THEME.text_color
    })(),
    accent_color:
      normalizeHex(String(o.accent_color ?? '')) ??
      DEFAULT_RESTAURANT_THEME.accent_color,
    font_family: fonts.includes(font as ThemeFontId)
      ? (font as ThemeFontId)
      : DEFAULT_RESTAURANT_THEME.font_family,
    header_display: o.header_display === 'logo' ? 'logo' : 'name',
    logo_url: typeof o.logo_url === 'string' && o.logo_url.length > 0 ? o.logo_url : null,
  }
}

/** Cores efetivas para o cardápio público (texto automático se necessário). */
export function resolvedPublicTheme(theme: RestaurantTheme): RestaurantTheme & {
  effective_text_color: string
} {
  const text =
    normalizeHex(theme.text_color) ?? pickContrastTextColor(theme.background_color)
  return {
    ...theme,
    text_color: text,
    effective_text_color: text,
  }
}
