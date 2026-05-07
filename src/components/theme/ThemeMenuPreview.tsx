import type { RestaurantTheme } from '@/types/theme'
import {
  parseRestaurantTheme,
  pickCardSurface,
  pickContrastTextColor,
  resolvedPublicTheme,
  themeCornerClasses,
  themeFontStack,
} from '@/utils/menuTheme'
import { LayoutGrid, List, UtensilsCrossed } from 'lucide-react'

type PreviewFrame = 'mobile' | 'desktop'

type ThemeMenuPreviewProps = {
  theme: RestaurantTheme
  frame: PreviewFrame
}

/** Amostra estática do cardápio público para o painel de personalização. */
export function ThemeMenuPreview({ theme, frame }: ThemeMenuPreviewProps) {
  const parsed = parseRestaurantTheme(theme)
  const enabled = parsed.enabled
  const rt = enabled ? resolvedPublicTheme(parsed) : null
  const bg = enabled ? parsed.background_color : '#f1f5f9'
  const accent = enabled ? parsed.accent_color : '#4f46e5'
  const text = enabled && rt ? rt.effective_text_color : '#0f172a'
  const cardBg = enabled ? pickCardSurface(parsed.background_color) : 'rgba(255,255,255,0.92)'
  const headingFont = themeFontStack(parsed.heading_font_family)
  const bodyFont = themeFontStack(parsed.font_family)
  const radius = themeCornerClasses(parsed.corner_radius)
  const isCompact = parsed.product_layout === 'compact'
  const showBlocks = parsed.product_layout === 'cards'
  const accentFg = pickContrastTextColor(accent)

  const frameClass =
    frame === 'mobile' ? 'max-w-[360px]' : 'max-w-[720px]'

  if (!enabled) {
    return (
      <div
        className={`mx-auto ${frameClass} rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center text-sm text-slate-600 dark:border-slate-600 dark:bg-slate-900/40 dark:text-slate-400`}
      >
        Ative “Usar personalização” para ver a pré-visualização com suas cores e fontes.
      </div>
    )
  }

  const sampleName = 'Prato exemplo'
  const samplePrice = 'R$ 24,90'
  const sampleDesc = 'Uma prévia rápida de como o cliente vê nome, descrição e preço.'

  return (
    <div
      className={`mx-auto ${frameClass} overflow-hidden rounded-xl border border-slate-200 shadow-sm ring-1 ring-black/5 dark:border-slate-700 dark:ring-white/5`}
      style={{ backgroundColor: bg, color: text, fontFamily: bodyFont }}
    >
      <div
        className="border-b px-4 py-3 backdrop-blur-sm"
        style={{ borderColor: `${text}22`, fontFamily: headingFont }}
      >
        <p className="text-[9px] font-semibold uppercase tracking-[0.2em]" style={{ color: accent }}>
          Cardápio digital
        </p>
        <p className="mt-1 text-lg font-bold tracking-tight" style={{ fontFamily: headingFont, color: text }}>
          Seu restaurante
        </p>
      </div>

      <div className="px-3 pb-3 pt-2">
        <p className="mb-1.5 text-[9px] font-medium uppercase opacity-65">Chips</p>
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
            style={{
              borderColor: `${text}33`,
              color: text,
              backgroundColor: 'transparent',
            }}
          >
            Outro
          </button>
        </div>

        {!isCompact ? (
          <div className="mt-3 flex justify-end gap-1 rounded-lg border p-1" style={{ borderColor: `${text}22` }}>
            <span
              className="inline-flex items-center gap-0.5 rounded px-2 py-1 text-[9px] font-semibold opacity-70"
              style={{ backgroundColor: showBlocks ? `${accent}22` : 'transparent', color: text }}
            >
              <LayoutGrid className="h-3 w-3 shrink-0" aria-hidden /> Blocos
            </span>
            <span
              className="inline-flex items-center gap-0.5 rounded px-2 py-1 text-[9px] font-semibold opacity-70"
              style={{
                backgroundColor: !showBlocks ? `${accent}22` : 'transparent',
                color: text,
              }}
            >
              <List className="h-3 w-3 shrink-0" aria-hidden /> Lista
            </span>
          </div>
        ) : (
          <p className="mt-3 text-[9px] font-medium uppercase opacity-60">Lista compacta (sem blocos)</p>
        )}
      </div>

      <div className="px-3 pb-4">
        {showBlocks && !isCompact ? (
          <article
            className={`overflow-hidden border ${radius.card}`}
            style={{
              borderColor: `${text}22`,
              backgroundColor: cardBg,
              boxShadow:
                parsed.card_style === 'flat'
                  ? 'none'
                  : parsed.card_style === 'elevated'
                    ? `0 10px 40px ${text}18`
                    : `0 6px 24px ${text}12`,
            }}
          >
            <div
              className="flex aspect-[16/10] items-center justify-center"
              style={{ backgroundColor: `${text}14` }}
            >
              <UtensilsCrossed className="h-10 w-10 opacity-40" aria-hidden style={{ color: text }} />
            </div>
            <div className="space-y-1 px-2.5 pb-2 pt-2" style={{ fontFamily: headingFont }}>
              <div className="flex items-start justify-between gap-2">
                <span className="text-sm font-semibold leading-snug" style={{ color: text }}>
                  {sampleName}
                </span>
                <span className="text-sm font-bold tabular-nums" style={{ color: accent }}>
                  {samplePrice}
                </span>
              </div>
              <p className="text-[11px] leading-relaxed opacity-80">{sampleDesc}</p>
            </div>
          </article>
        ) : (
          <article
            className={`flex gap-2 border p-2 ${radius.cardSmall}`}
            style={{
              borderColor: `${text}22`,
              backgroundColor: cardBg,
              boxShadow:
                parsed.card_style === 'flat'
                  ? 'none'
                  : parsed.card_style === 'elevated'
                    ? `0 8px 28px ${text}14`
                    : `0 4px 16px ${text}0f`,
            }}
          >
            <div
              className={`flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden ${radius.thumbSmall}`}
              style={{ backgroundColor: `${text}12`, color: `${text}45` }}
            >
              <UtensilsCrossed className="h-6 w-6 opacity-60" aria-hidden />
            </div>
            <div className="min-w-0 flex-1 space-y-0.5" style={{ fontFamily: headingFont }}>
              <div className="flex flex-wrap items-baseline justify-between gap-x-2">
                <span
                  className={`font-semibold leading-snug ${isCompact ? 'text-[12px]' : 'text-[13px]'}`}
                  style={{ color: text }}
                >
                  {sampleName}
                </span>
                <span
                  className={`shrink-0 font-bold tabular-nums ${isCompact ? 'text-[12px]' : 'text-[13px]'}`}
                  style={{ color: accent }}
                >
                  {samplePrice}
                </span>
              </div>
              <p
                className={`leading-relaxed opacity-80 ${isCompact ? 'line-clamp-2 text-[10px]' : 'text-[11px]'}`}
              >
                {sampleDesc}
              </p>
            </div>
          </article>
        )}
      </div>
    </div>
  )
}
