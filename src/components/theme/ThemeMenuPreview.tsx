import { ProductHighlightBadgeView } from '@/components/theme/ProductHighlightBadge'
import { ThemedMenuHeader } from '@/components/theme/ThemedMenuHeader'
import type { RestaurantTheme } from '@/types/theme'
import {
  parseRestaurantTheme,
  pickContrastTextColor,
  resolvedPublicTheme,
  themeCardBackdropFilter,
  themeCardBorderCss,
  themeCardInsetShadow,
  themeCornerClasses,
  themeEntryAnimationClass,
  themeFontStack,
  pickCardSurfaceWithOpacity,
} from '@/utils/menuTheme'
import { LayoutGrid, List, UtensilsCrossed } from 'lucide-react'

type PreviewFrame = 'mobile' | 'desktop'

type ThemeMenuPreviewProps = {
  theme: RestaurantTheme
  frame: PreviewFrame
  restaurantName?: string
  embedded?: boolean
}

/** Amostra estática do cardápio público para o painel de personalização. */
export function ThemeMenuPreview({
  theme,
  frame,
  restaurantName = 'Seu restaurante',
  embedded = false,
}: ThemeMenuPreviewProps) {
  const parsed = parseRestaurantTheme(theme)
  const enabled = parsed.enabled
  const rt = enabled ? resolvedPublicTheme(parsed) : null
  const bg = enabled ? parsed.background_color : '#f1f5f9'
  const accent = enabled ? parsed.accent_color : '#4f46e5'
  const text = enabled && rt ? rt.effective_text_color : '#0f172a'
  const cardBg = enabled
    ? pickCardSurfaceWithOpacity(parsed.background_color, parsed.card_opacity)
    : 'rgba(255,255,255,0.92)'
  const headingFont = themeFontStack(parsed.heading_font_family)
  const bodyFont = themeFontStack(parsed.font_family)
  const radius = themeCornerClasses(parsed.corner_radius)
  const isCompact = parsed.product_layout === 'compact'
  const showBlocks = parsed.product_layout === 'cards'
  const accentFg = pickContrastTextColor(accent)
  const borderCss = themeCardBorderCss(parsed.card_border_style)
  const cardBackdrop = themeCardBackdropFilter(parsed.card_opacity)

  const frameClass = embedded ? 'w-full max-w-none' : frame === 'mobile' ? 'max-w-[360px]' : 'max-w-[720px]'

  if (!enabled) {
    return (
      <div
        className={`mx-auto ${frameClass} ${embedded ? 'rounded-none border-0' : 'rounded-xl border border-dashed border-slate-300'} bg-slate-50 px-4 py-8 text-center text-sm text-slate-600 dark:border-slate-600 dark:bg-slate-900/40 dark:text-slate-400`}
      >
        Ative a personalização para ver a prévia com suas cores e fontes.
      </div>
    )
  }

  const cardStyle = {
    borderColor: `${text}33`,
    borderStyle: borderCss.borderStyle,
    borderWidth: borderCss.borderWidth,
    backgroundColor: cardBg,
    ...cardBackdrop,
  } as const

  return (
    <div
      className={`mx-auto ${frameClass} overflow-hidden ${embedded ? 'rounded-none border-0 shadow-none ring-0' : 'rounded-xl border border-slate-200 shadow-sm ring-1 ring-black/5 dark:border-slate-700 dark:ring-white/5'}`}
      style={{ backgroundColor: bg, color: text, fontFamily: bodyFont }}
    >
      <ThemedMenuHeader theme={parsed} restaurantName={restaurantName} compact={embedded} />

      <div className="px-3 pb-3 pt-2">
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            className="rounded-full px-2.5 py-1 text-[10px] font-medium"
            style={{ backgroundColor: accent, color: accentFg }}
          >
            Destaque
          </button>
          <button
            type="button"
            className="rounded-full border px-2.5 py-1 text-[10px] font-medium"
            style={{ borderColor: `${text}33`, color: text, backgroundColor: 'transparent' }}
          >
            Outro
          </button>
        </div>

        {!isCompact ? (
          <div className="mt-3 flex justify-end gap-1 rounded-lg border p-1" style={{ borderColor: `${text}22` }}>
            <span
              className="inline-flex items-center gap-0.5 rounded px-2 py-1 text-[9px] font-semibold"
              style={{ backgroundColor: showBlocks ? `${accent}22` : 'transparent', color: text }}
            >
              <LayoutGrid className="h-3 w-3" aria-hidden /> Blocos
            </span>
            <span
              className="inline-flex items-center gap-0.5 rounded px-2 py-1 text-[9px] font-semibold"
              style={{ backgroundColor: !showBlocks ? `${accent}22` : 'transparent', color: text }}
            >
              <List className="h-3 w-3" aria-hidden /> Lista
            </span>
          </div>
        ) : null}
      </div>

      <div className={`px-3 pb-4 ${themeEntryAnimationClass(parsed.entry_animation, 0)}`}>
        {showBlocks && !isCompact ? (
          <article
            className={`overflow-hidden ${radius.card}`}
            style={{
              ...cardStyle,
              boxShadow: themeCardInsetShadow(parsed.card_style, text, 'blocks'),
            }}
          >
            <div className="relative flex aspect-[16/10] items-center justify-center" style={{ backgroundColor: `${text}14` }}>
              {parsed.show_product_badges ? (
                <ProductHighlightBadgeView
                  badge="bestseller"
                  accentColor={accent}
                  accentFg={accentFg}
                  style={parsed.badge_style}
                  className="absolute left-2 top-2 z-10"
                />
              ) : null}
              <UtensilsCrossed className="h-10 w-10 opacity-40" aria-hidden style={{ color: text }} />
            </div>
            <div className="space-y-1 px-2.5 pb-2 pt-2" style={{ fontFamily: headingFont }}>
              <div className="flex items-start justify-between gap-2">
                <span className="text-sm font-semibold" style={{ color: text }}>
                  Prato exemplo
                </span>
                <span className="text-sm font-bold tabular-nums" style={{ color: accent }}>
                  R$ 24,90
                </span>
              </div>
              <p className="text-[11px] opacity-80">Descrição de exemplo do prato.</p>
            </div>
          </article>
        ) : (
          <article
            className={`flex gap-2 p-2 ${radius.cardSmall}`}
            style={{
              ...cardStyle,
              boxShadow: themeCardInsetShadow(parsed.card_style, text, 'list'),
            }}
          >
            <div
              className={`relative flex h-12 w-12 shrink-0 items-center justify-center ${radius.thumbSmall}`}
              style={{ backgroundColor: `${text}12`, color: `${text}45` }}
            >
              <UtensilsCrossed className="h-6 w-6 opacity-60" aria-hidden />
            </div>
            <div className="min-w-0 flex-1" style={{ fontFamily: headingFont }}>
              {parsed.show_product_badges ? (
                <ProductHighlightBadgeView
                  badge="new"
                  accentColor={accent}
                  accentFg={accentFg}
                  style={parsed.badge_style}
                  className="mb-1"
                />
              ) : null}
              <div className="flex justify-between gap-2">
                <span className="text-[13px] font-semibold" style={{ color: text }}>
                  Prato exemplo
                </span>
                <span className="text-[13px] font-bold tabular-nums" style={{ color: accent }}>
                  R$ 24,90
                </span>
              </div>
            </div>
          </article>
        )}
      </div>
    </div>
  )
}
