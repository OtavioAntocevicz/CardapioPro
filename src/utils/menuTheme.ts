import {
  DEFAULT_RESTAURANT_THEME,
  type RestaurantTheme,
  type ThemeBadgeStyle,
  type ThemeCardBorderStyle,
  type ThemeCardStyle,
  type ThemeCornerRadius,
  type ThemeDensity,
  type ThemeEntryAnimation,
  type ThemeFontId,
  type ThemeLogoAlign,
  type ThemeLogoShape,
  type ThemeProductLayout,
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

/** Superfície de cards com opacidade configurável (glassmorphism). */
export function pickCardSurfaceWithOpacity(backgroundHex: string, opacityPercent: number): string {
  const rgb = parseRgb(backgroundHex)
  const dark = relativeLuminance(backgroundHex) <= 0.55
  const opacity = Math.min(100, Math.max(40, opacityPercent)) / 100

  if (!rgb) {
    return dark
      ? `rgba(255, 255, 255, ${(0.06 + opacity * 0.14).toFixed(2)})`
      : `rgba(255, 255, 255, ${opacity.toFixed(2)})`
  }

  // Eleva a cor do fundo em direção ao branco e usa alpha conforme o slider (40–100%).
  const lift = dark ? 0.08 + opacity * 0.18 : 0.3 + opacity * 0.55
  const r = Math.round(rgb.r + (255 - rgb.r) * lift)
  const g = Math.round(rgb.g + (255 - rgb.g) * lift)
  const b = Math.round(rgb.b + (255 - rgb.b) * lift)
  const alpha = dark ? 0.32 + opacity * 0.58 : 0.48 + opacity * 0.5

  return `rgba(${r}, ${g}, ${b}, ${alpha.toFixed(2)})`
}

export function pickCardSurface(backgroundHex: string): string {
  return pickCardSurfaceWithOpacity(backgroundHex, 92)
}

export function themeLogoAlignClass(align: ThemeLogoAlign): string {
  if (align === 'left') return 'justify-start text-left'
  if (align === 'right') return 'justify-end text-right'
  return 'justify-center text-center'
}

export function themeLogoShapeClass(shape: ThemeLogoShape): string {
  if (shape === 'circle') return 'rounded-full'
  if (shape === 'square') return 'rounded-none'
  return 'rounded-xl'
}

export function themeCardBorderCss(
  style: ThemeCardBorderStyle,
): { borderStyle: string; borderWidth: string } {
  if (style === 'dashed') return { borderStyle: 'dashed', borderWidth: '1px' }
  if (style === 'double') return { borderStyle: 'double', borderWidth: '3px' }
  return { borderStyle: 'solid', borderWidth: '1px' }
}

export function themeEntryAnimationClass(animation: ThemeEntryAnimation, index = 0): string {
  if (animation === 'none') return ''
  const delay = Math.min(index * 40, 200)
  if (animation === 'slide') return `menu-anim-slide [animation-delay:${delay}ms]`
  return `menu-anim-fade [animation-delay:${delay}ms]`
}

export function themeGlassBlur(cardOpacity: number): string | undefined {
  if (cardOpacity >= 96) return undefined
  const px = Math.round(6 + (96 - cardOpacity) * 0.35)
  return `blur(${px}px) saturate(1.2)`
}

/** Estilos de backdrop para glassmorphism (inclui prefixo WebKit). */
export function themeCardBackdropFilter(cardOpacity: number): {
  backdropFilter?: string
  WebkitBackdropFilter?: string
} {
  const blur = themeGlassBlur(cardOpacity)
  if (!blur) return {}
  return { backdropFilter: blur, WebkitBackdropFilter: blur }
}

const LOGO_ALIGNS: ThemeLogoAlign[] = ['left', 'center', 'right']
const LOGO_SHAPES: ThemeLogoShape[] = ['square', 'rounded', 'circle']
const BORDER_STYLES: ThemeCardBorderStyle[] = ['solid', 'dashed', 'double']
const ENTRY_ANIMS: ThemeEntryAnimation[] = ['none', 'fade', 'slide']
const BADGE_STYLES: ThemeBadgeStyle[] = ['pill', 'ribbon', 'minimal']

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n))
}

function parseEnum<T extends string>(raw: unknown, allowed: readonly T[], fallback: T): T {
  const s = String(raw ?? '')
  return allowed.includes(s as T) ? (s as T) : fallback
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

const THEME_FONTS: ThemeFontId[] = ['system', 'dm_sans', 'playfair', 'lora', 'poppins']
const PRODUCT_LAYOUTS: ThemeProductLayout[] = ['cards', 'list', 'compact']
const CARD_STYLES: ThemeCardStyle[] = ['soft', 'flat', 'elevated']
const DENSITIES: ThemeDensity[] = ['comfortable', 'compact']
const RADII: ThemeCornerRadius[] = ['sm', 'md', 'lg']

/** Classes Tailwind para cantos (precisa string literal completa para o JIT). */
export function themeCornerClasses(radius: ThemeCornerRadius): {
  card: string
  cardSmall: string
  thumb: string
  thumbSmall: string
} {
  const map = {
    sm: {
      card: 'rounded-lg',
      cardSmall: 'rounded-lg',
      thumb: 'rounded-md',
      thumbSmall: 'rounded-md',
    },
    md: {
      card: 'rounded-xl',
      cardSmall: 'rounded-xl',
      thumb: 'rounded-lg',
      thumbSmall: 'rounded-lg',
    },
    lg: {
      card: 'rounded-2xl',
      cardSmall: 'rounded-2xl',
      thumb: 'rounded-xl',
      thumbSmall: 'rounded-xl',
    },
  } satisfies Record<ThemeCornerRadius, Record<string, string>>

  return map[radius] ?? map.lg
}

export function themeGapBlocks(density: ThemeDensity): string {
  return density === 'compact' ? 'gap-4' : 'gap-5'
}

export function themeGapList(density: ThemeDensity): string {
  return density === 'compact' ? 'gap-2' : 'gap-3'
}

/** Caixa de sombra inline coerente com tema claro/escuro e estilo de cartão. */
export function themeCardInsetShadow(
  cardStyle: ThemeCardStyle,
  toneHex: string,
  mode: 'blocks' | 'list',
): string | undefined {
  if (cardStyle === 'flat') return 'none'
  const base = normalizeHex(toneHex) ?? '#0f172a'
  const alpha = mode === 'blocks' ? '14' : '0d'
  const strong = mode === 'blocks' ? '22' : '14'
  const eight = `${base}${cardStyle === 'elevated' ? strong : alpha}`
  if (cardStyle === 'elevated') return `0 14px 42px ${eight}`
  return `0 8px 28px ${eight}`
}

/** Mescla JSON salvo com defaults seguros. */
export function parseRestaurantTheme(raw: unknown): RestaurantTheme {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return { ...DEFAULT_RESTAURANT_THEME }
  }
  const o = raw as Record<string, unknown>
  const font = o.font_family
  const headingFontRaw = o.heading_font_family ?? font
  const baseFont = THEME_FONTS.includes(font as ThemeFontId)
    ? (font as ThemeFontId)
    : DEFAULT_RESTAURANT_THEME.font_family
  const headingFont =
    THEME_FONTS.includes(headingFontRaw as ThemeFontId)
      ? (headingFontRaw as ThemeFontId)
      : baseFont

  const layoutRaw = String(o.product_layout ?? '')
  const product_layout: ThemeProductLayout = PRODUCT_LAYOUTS.includes(layoutRaw as ThemeProductLayout)
    ? (layoutRaw as ThemeProductLayout)
    : DEFAULT_RESTAURANT_THEME.product_layout

  const cardRaw = String(o.card_style ?? '')
  const card_style: ThemeCardStyle = CARD_STYLES.includes(cardRaw as ThemeCardStyle)
    ? (cardRaw as ThemeCardStyle)
    : DEFAULT_RESTAURANT_THEME.card_style

  const densityRaw = String(o.density ?? '')
  const density: ThemeDensity = DENSITIES.includes(densityRaw as ThemeDensity)
    ? (densityRaw as ThemeDensity)
    : DEFAULT_RESTAURANT_THEME.density

  const cornerRaw = String(o.corner_radius ?? '')
  const corner_radius: ThemeCornerRadius = RADII.includes(cornerRaw as ThemeCornerRadius)
    ? (cornerRaw as ThemeCornerRadius)
    : DEFAULT_RESTAURANT_THEME.corner_radius

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
    font_family: baseFont,
    heading_font_family: headingFont,
    header_display: o.header_display === 'logo' ? 'logo' : 'name',
    logo_url: typeof o.logo_url === 'string' && o.logo_url.length > 0 ? o.logo_url : null,
    logo_align: parseEnum(o.logo_align, LOGO_ALIGNS, DEFAULT_RESTAURANT_THEME.logo_align),
    logo_size: clamp(Number(o.logo_size ?? DEFAULT_RESTAURANT_THEME.logo_size), 50, 200),
    logo_shape: parseEnum(o.logo_shape, LOGO_SHAPES, DEFAULT_RESTAURANT_THEME.logo_shape),
    header_banner_url:
      typeof o.header_banner_url === 'string' && o.header_banner_url.length > 0
        ? o.header_banner_url
        : null,
    product_layout,
    card_style,
    density,
    corner_radius,
    card_opacity: clamp(Number(o.card_opacity ?? DEFAULT_RESTAURANT_THEME.card_opacity), 40, 100),
    card_border_style: parseEnum(
      o.card_border_style,
      BORDER_STYLES,
      DEFAULT_RESTAURANT_THEME.card_border_style,
    ),
    entry_animation: parseEnum(
      o.entry_animation,
      ENTRY_ANIMS,
      DEFAULT_RESTAURANT_THEME.entry_animation,
    ),
    badge_style: parseEnum(o.badge_style, BADGE_STYLES, DEFAULT_RESTAURANT_THEME.badge_style),
    show_product_badges:
      o.show_product_badges === undefined
        ? DEFAULT_RESTAURANT_THEME.show_product_badges
        : Boolean(o.show_product_badges),
    social_instagram_url: String(o.social_instagram_url ?? '').trim(),
    social_facebook_url: String(o.social_facebook_url ?? '').trim(),
    show_social_float:
      o.show_social_float === undefined
        ? DEFAULT_RESTAURANT_THEME.show_social_float
        : Boolean(o.show_social_float),
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
