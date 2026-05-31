import { ProductHighlightBadgeView } from '@/components/theme/ProductHighlightBadge'
import { PublicSocialFloat } from '@/components/theme/PublicSocialFloat'
import { ThemedMenuHeader } from '@/components/theme/ThemedMenuHeader'
import { ThemeToggle } from '@/components/ThemeToggle'
import { EmptyState } from '@/components/ui/EmptyState'
import { Spinner } from '@/components/ui/Spinner'
import { fetchCategories } from '@/services/categories'
import { fetchMenus } from '@/services/menus'
import { fetchRestaurantBySlug } from '@/services/restaurants'
import { fetchProducts } from '@/services/products'
import type { Category, Product } from '@/types/database'
import { formatPrice } from '@/utils/format'
import {
  parseRestaurantTheme,
  pickCardBorder,
  pickCardSurfaceWithOpacity,
  pickContrastTextColor,
  resolvedPublicTheme,
  themeCardBorderCss,
  themeCardInsetShadow,
  themeCornerClasses,
  themeEntryAnimationClass,
  themeFontStack,
  themeGapBlocks,
  themeGapList,
  themeGlassBlur,
} from '@/utils/menuTheme'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, LayoutGrid, List, UtensilsCrossed } from 'lucide-react'
import { useMemo, useState, type CSSProperties } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'

type MenuViewMode = 'blocks' | 'list'

type CustomTone = {
  text: string
  accent: string
  accentFg: string
  border: string
  cardBg: string
}

function buildCustomTone(
  rt: ReturnType<typeof resolvedPublicTheme>,
  backgroundHex: string,
  cardOpacity: number,
): CustomTone {
  return {
    text: rt.effective_text_color,
    accent: rt.accent_color,
    accentFg: pickContrastTextColor(rt.accent_color),
    border: pickCardBorder(backgroundHex),
    cardBg: pickCardSurfaceWithOpacity(backgroundHex, cardOpacity),
  }
}

export function PublicMenuPage() {
  const { slug } = useParams<{ slug: string }>()
  const [searchParams] = useSearchParams()
  const isPreview = searchParams.get('preview') === '1'
  const [activeCategory, setActiveCategory] = useState<string>('all')
  /** Visitante sobrescreve blocos/lista; remontar a página (/mSlug) volta ao padrão do tema. */
  const [visitorViewPreference, setVisitorViewPreference] = useState<MenuViewMode | null>(null)

  const restaurantQuery = useQuery({
    queryKey: ['public-restaurant', slug],
    queryFn: () => fetchRestaurantBySlug(slug!),
    enabled: Boolean(slug),
  })

  const restaurantId = restaurantQuery.data?.id
  const menusQuery = useQuery({
    queryKey: ['public-menus', restaurantId],
    queryFn: () => fetchMenus(restaurantId!, { asPublicVisitor: true }),
    enabled: Boolean(restaurantId),
  })
  const activeMenuId = (menusQuery.data ?? []).find((m) => m.is_active)?.id

  const categoriesQuery = useQuery({
    queryKey: ['public-categories', restaurantId, activeMenuId],
    queryFn: () => fetchCategories(restaurantId!, activeMenuId, { asPublicVisitor: true }),
    enabled: Boolean(restaurantId && activeMenuId),
  })

  const productsQuery = useQuery({
    queryKey: ['public-products', restaurantId, activeMenuId],
    queryFn: () => fetchProducts(restaurantId!, activeMenuId, { asPublicVisitor: true }),
    enabled: Boolean(restaurantId && activeMenuId),
  })

  const visibleProducts = useMemo(() => {
    const list = productsQuery.data ?? []
    return list.filter((p) => p.is_available)
  }, [productsQuery.data])

  const byCategory = useMemo(() => {
    const map = new Map<string | null, Product[]>()
    for (const p of visibleProducts) {
      const k = p.category_id
      if (!map.has(k)) map.set(k, [])
      map.get(k)!.push(p)
    }
    return map
  }, [visibleProducts])

  const filteredProducts = useMemo(() => {
    if (activeCategory === 'all') return visibleProducts
    if (activeCategory === 'none') return byCategory.get(null) ?? []
    return byCategory.get(activeCategory) ?? []
  }, [activeCategory, byCategory, visibleProducts])

  const themeDefaultView = useMemo((): MenuViewMode => {
    const r = restaurantQuery.data
    if (!r) return 'blocks'
    const mt = parseRestaurantTheme(r.theme)
    if (!mt.enabled) return 'blocks'
    return mt.product_layout === 'cards' ? 'blocks' : 'list'
  }, [restaurantQuery.data])

  const viewMode = visitorViewPreference ?? themeDefaultView

  if (!slug) {
    return (
      <p className="p-6 text-center text-slate-500 dark:text-slate-400">Link inválido.</p>
    )
  }

  if (restaurantQuery.isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 dark:bg-slate-950">
        <Spinner />
      </div>
    )
  }

  if (restaurantQuery.isError || !restaurantQuery.data) {
    return (
      <div className="min-h-screen bg-slate-100 px-4 py-16 text-center dark:bg-slate-950">
        <UtensilsCrossed
          className="mx-auto h-12 w-12 text-slate-400 dark:text-slate-600"
          aria-hidden
        />
        <h1 className="mt-4 text-xl font-semibold text-slate-900 dark:text-white">
          Cardápio não encontrado
        </h1>
        <p className="mt-2 text-slate-600 dark:text-slate-400">
          Confira o link ou tente novamente mais tarde.
        </p>
      </div>
    )
  }

  const restaurant = restaurantQuery.data
  const categories = categoriesQuery.data ?? []
  const menuTheme = parseRestaurantTheme(restaurant.theme)
  const useCustom = menuTheme.enabled
  const rt = useCustom ? resolvedPublicTheme(menuTheme) : null
  const tone = useCustom && rt ? buildCustomTone(rt, menuTheme.background_color, menuTheme.card_opacity) : null
  const fontStack = useCustom && menuTheme ? themeFontStack(menuTheme.font_family) : undefined
  const headingStack =
    useCustom && menuTheme ? themeFontStack(menuTheme.heading_font_family) : undefined
  const cornerRound = themeCornerClasses(menuTheme.corner_radius)
  const layoutLockedToList = useCustom && menuTheme.product_layout === 'compact'
  const effectiveDensity =
    menuTheme.product_layout === 'compact' ? 'compact' : menuTheme.density
  const showAsBlocks = viewMode === 'blocks' && !layoutLockedToList

  const cardBorderCss =
    useCustom && rt && tone ? themeCardBorderCss(menuTheme.card_border_style) : null
  const cardGlass = useCustom ? themeGlassBlur(menuTheme.card_opacity) : undefined

  function themedCardInlineStyle(): CSSProperties {
    if (!tone || !cardBorderCss) return {}
    return {
      borderColor: tone.border,
      borderStyle: cardBorderCss.borderStyle as CSSProperties['borderStyle'],
      borderWidth: cardBorderCss.borderWidth,
      backgroundColor: tone.cardBg,
      backdropFilter: cardGlass,
    }
  }

  const shellStyle =
    useCustom && rt && fontStack
      ? {
          backgroundColor: menuTheme.background_color,
          color: rt.effective_text_color,
          fontFamily: fontStack,
        }
      : undefined

  return (
    <div
      className={
        useCustom
          ? 'min-h-screen pb-14'
          : 'min-h-screen bg-gradient-to-b from-slate-100 via-white to-slate-50 pb-14 text-slate-900 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900 dark:text-slate-100'
      }
      style={shellStyle}
    >
      {isPreview ? (
        <div className="sticky top-0 z-30 border-b border-amber-200/80 bg-amber-50/95 px-3 py-2.5 backdrop-blur dark:border-amber-500/30 dark:bg-amber-950/90">
          <div className="mx-auto flex max-w-lg flex-wrap items-center justify-between gap-2">
            <p className="text-xs font-medium text-amber-900 dark:text-amber-100">
              Modo pré-visualização — igual ao link público, com atalho para o painel.
            </p>
            <Link
              to="/app"
              className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg bg-white px-3 text-xs font-medium text-slate-800 ring-1 ring-slate-200 transition hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-100 dark:ring-slate-600 dark:hover:bg-slate-700"
            >
              <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
              Voltar ao painel
            </Link>
          </div>
        </div>
      ) : null}

      <header
        className={
          useCustom
            ? 'sticky top-0 z-20'
            : 'sticky top-0 z-20 border-b border-slate-200/90 bg-white/90 px-4 py-4 backdrop-blur-md dark:border-slate-800/80 dark:bg-slate-950/90'
        }
      >
        {useCustom && rt ? (
          <ThemedMenuHeader theme={menuTheme} restaurantName={restaurant.name} />
        ) : (
          <div className="relative mx-auto max-w-lg px-4 py-4">
            <ThemeToggle className="absolute right-0 top-1/2 z-10 -translate-y-1/2" />
            <div className="px-12 text-center">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-600 dark:text-brand-400">
                Cardápio digital
              </p>
              <h1 className="mt-0.5 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                {restaurant.name}
              </h1>
            </div>
          </div>
        )}
      </header>

      <div className="mx-auto max-w-lg px-4 pt-5">
        <p
          className={
            useCustom
              ? 'mb-2 text-xs font-medium uppercase tracking-wide'
              : 'mb-2 text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-500'
          }
          style={useCustom && rt ? { color: rt.effective_text_color, opacity: 0.65 } : undefined}
        >
          Categorias
        </p>
        <div className="flex gap-2 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <FilterChip
            active={activeCategory === 'all'}
            onClick={() => setActiveCategory('all')}
            label="Todos"
            custom={tone}
          />
          {(byCategory.get(null)?.length ?? 0) > 0 ? (
            <FilterChip
              active={activeCategory === 'none'}
              onClick={() => setActiveCategory('none')}
              label="Outros"
              custom={tone}
            />
          ) : null}
          {categories.map((c: Category) => (
            <FilterChip
              key={c.id}
              active={activeCategory === c.id}
              onClick={() => setActiveCategory(c.id)}
              label={c.name}
              custom={tone}
            />
          ))}
        </div>

        {!layoutLockedToList ? (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <p
              className={
                useCustom
                  ? 'text-xs font-medium uppercase tracking-wide'
                  : 'text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-500'
              }
              style={useCustom && rt ? { color: rt.effective_text_color, opacity: 0.65 } : undefined}
            >
              Visualização
            </p>
            <ViewModeSwitch
              viewMode={viewMode}
              onChange={setVisitorViewPreference}
              custom={tone}
              useCustom={useCustom}
            />
          </div>
        ) : useCustom && rt ? (
          <p
            className="mt-4 text-[11px] font-medium uppercase tracking-wide"
            style={{ color: rt.effective_text_color, opacity: 0.55 }}
          >
            Modo definido pelo estabelecimento: lista compacta
          </p>
        ) : null}
      </div>

      <main className="mx-auto max-w-lg px-4 pt-6">
        {productsQuery.isLoading || categoriesQuery.isLoading ? (
          <div className="flex justify-center py-16">
            <Spinner />
          </div>
        ) : filteredProducts.length === 0 ? (
          useCustom && rt && tone ? (
            <div
              className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed px-6 py-14 text-center"
              style={{ borderColor: tone.border, backgroundColor: tone.cardBg }}
            >
              <div
                className="flex h-12 w-12 items-center justify-center rounded-full"
                style={{ backgroundColor: `${menuTheme.accent_color}25`, color: menuTheme.accent_color }}
              >
                <UtensilsCrossed className="h-6 w-6" aria-hidden />
              </div>
              <div>
                <p className="font-medium" style={{ color: rt.effective_text_color }}>
                  Nada por aqui
                </p>
                <p
                  className="mt-1 max-w-sm text-sm"
                  style={{ color: rt.effective_text_color, opacity: 0.75 }}
                >
                  Este cardápio ainda não tem itens disponíveis nesta seleção.
                </p>
              </div>
            </div>
          ) : (
            <EmptyState
              icon={UtensilsCrossed}
              title="Nada por aqui"
              description="Este cardápio ainda não tem itens disponíveis nesta seleção."
            />
          )
        ) : showAsBlocks ? (
          <ul className={`flex flex-col ${themeGapBlocks(effectiveDensity)}`}>
            {filteredProducts.map((p, index) => (
              <li
                key={p.id}
                className={
                  useCustom && rt
                    ? themeEntryAnimationClass(menuTheme.entry_animation, index)
                    : undefined
                }
              >
                {useCustom && rt && tone ? (
                  <article
                    className={`overflow-hidden border ${cornerRound.card}`}
                    style={{
                      ...themedCardInlineStyle(),
                      boxShadow: themeCardInsetShadow(
                        menuTheme.card_style,
                        rt.effective_text_color,
                        'blocks',
                      ),
                    }}
                  >
                    <div
                      className="relative aspect-[5/4] w-full overflow-hidden sm:aspect-[16/10]"
                      style={{ backgroundColor: `${tone.text}12` }}
                    >
                      {menuTheme.show_product_badges && p.highlight_badge ? (
                        <ProductHighlightBadgeView
                          badge={p.highlight_badge}
                          accentColor={menuTheme.accent_color}
                          accentFg={tone.accentFg}
                          style={menuTheme.badge_style}
                          className="absolute left-3 top-3 z-10"
                        />
                      ) : null}
                      {p.image_url ? (
                        <img
                          src={p.image_url}
                          alt={p.name}
                          className="h-full w-full object-cover object-center"
                          loading="lazy"
                          decoding="async"
                        />
                      ) : (
                        <div
                          className="flex h-full w-full items-center justify-center"
                          style={{ color: `${tone.text}40` }}
                          aria-hidden
                        >
                          <UtensilsCrossed className="h-16 w-16 opacity-60" aria-hidden />
                        </div>
                      )}
                    </div>
                    <div
                      className={
                        effectiveDensity === 'compact' ? 'space-y-1 px-3 pb-3 pt-2' : 'space-y-1.5 px-4 pb-4 pt-3'
                      }
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2 gap-y-1">
                        <h2
                          className={`font-semibold leading-snug ${effectiveDensity === 'compact' ? 'text-base' : 'text-lg'}`}
                          style={{ color: rt.effective_text_color, fontFamily: headingStack }}
                        >
                          {p.name}
                        </h2>
                        <p
                          className="shrink-0 text-lg font-bold tabular-nums"
                          style={{ color: menuTheme.accent_color }}
                        >
                          {formatPrice(Number(p.price))}
                        </p>
                      </div>
                      {p.description ? (
                        <p
                          className="text-sm leading-relaxed"
                          style={{ color: rt.effective_text_color, opacity: 0.8 }}
                        >
                          {p.description}
                        </p>
                      ) : null}
                    </div>
                  </article>
                ) : (
                  <article className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-md shadow-slate-200/50 dark:border-slate-800 dark:bg-slate-900/40 dark:shadow-black/20">
                    <div className="relative aspect-[5/4] w-full overflow-hidden bg-slate-100 dark:bg-slate-800/80 sm:aspect-[16/10]">
                      {p.image_url ? (
                        <img
                          src={p.image_url}
                          alt={p.name}
                          className="h-full w-full object-cover object-center"
                          loading="lazy"
                          decoding="async"
                        />
                      ) : (
                        <div
                          className="flex h-full w-full items-center justify-center text-slate-300 dark:text-slate-600"
                          aria-hidden
                        >
                          <UtensilsCrossed className="h-16 w-16 opacity-60" aria-hidden />
                        </div>
                      )}
                    </div>
                    <div className="space-y-1.5 px-4 pb-4 pt-3">
                      <div className="flex flex-wrap items-start justify-between gap-2 gap-y-1">
                        <h2 className="text-lg font-semibold leading-snug text-slate-900 dark:text-white">
                          {p.name}
                        </h2>
                        <p className="shrink-0 text-lg font-bold tabular-nums text-brand-600 dark:text-brand-400">
                          {formatPrice(Number(p.price))}
                        </p>
                      </div>
                      {p.description ? (
                        <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                          {p.description}
                        </p>
                      ) : null}
                    </div>
                  </article>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <ul className={`flex flex-col ${themeGapList(effectiveDensity)}`}>
            {filteredProducts.map((p, index) => (
              <li
                key={p.id}
                className={
                  useCustom && rt
                    ? themeEntryAnimationClass(menuTheme.entry_animation, index)
                    : undefined
                }
              >
                {useCustom && rt && tone ? (
                  <article
                    className={`flex overflow-hidden border shadow-sm ${cornerRound.cardSmall} ${effectiveDensity === 'compact' ? 'gap-2 p-2' : 'gap-3 p-3'}`}
                    style={{
                      ...themedCardInlineStyle(),
                      boxShadow: themeCardInsetShadow(
                        menuTheme.card_style,
                        rt.effective_text_color,
                        'list',
                      ),
                    }}
                  >
                    <div
                      className={`relative shrink-0 overflow-hidden ${cornerRound.thumbSmall} ${effectiveDensity === 'compact' ? 'h-[4.25rem] w-[4.25rem] sm:h-20 sm:w-20' : 'h-[5.25rem] w-[5.25rem] sm:h-28 sm:w-28'}`}
                      style={{ backgroundColor: `${tone.text}10` }}
                    >
                      {p.image_url ? (
                        <img
                          src={p.image_url}
                          alt={p.name}
                          className="h-full w-full object-cover object-center"
                          loading="lazy"
                          decoding="async"
                        />
                      ) : (
                        <div
                          className="flex h-full w-full items-center justify-center"
                          style={{ color: `${tone.text}40` }}
                          aria-hidden
                        >
                          <UtensilsCrossed className="h-8 w-8 opacity-60 sm:h-10 sm:w-10" aria-hidden />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1 space-y-0.5 sm:space-y-1">
                      {menuTheme.show_product_badges && p.highlight_badge ? (
                        <ProductHighlightBadgeView
                          badge={p.highlight_badge}
                          accentColor={menuTheme.accent_color}
                          accentFg={tone.accentFg}
                          style={menuTheme.badge_style}
                          className="mb-0.5"
                        />
                      ) : null}
                      <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-0.5">
                        <h2
                          className={`font-semibold leading-snug ${effectiveDensity === 'compact' ? 'text-sm' : 'text-base'}`}
                          style={{ color: rt.effective_text_color, fontFamily: headingStack }}
                        >
                          {p.name}
                        </h2>
                        <p
                          className={`shrink-0 font-bold tabular-nums ${effectiveDensity === 'compact' ? 'text-sm' : 'text-base'}`}
                          style={{ color: menuTheme.accent_color }}
                        >
                          {formatPrice(Number(p.price))}
                        </p>
                      </div>
                      {p.description ? (
                        <p
                          className="line-clamp-3 text-sm leading-relaxed"
                          style={{ color: rt.effective_text_color, opacity: 0.8 }}
                        >
                          {p.description}
                        </p>
                      ) : null}
                    </div>
                  </article>
                ) : (
                  <article className="flex gap-3 overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-3 shadow-sm shadow-slate-200/40 dark:border-slate-800 dark:bg-slate-900/40 dark:shadow-black/15">
                    <div className="relative h-[5.25rem] w-[5.25rem] shrink-0 overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-800/80 sm:h-28 sm:w-28">
                      {p.image_url ? (
                        <img
                          src={p.image_url}
                          alt={p.name}
                          className="h-full w-full object-cover object-center"
                          loading="lazy"
                          decoding="async"
                        />
                      ) : (
                        <div
                          className="flex h-full w-full items-center justify-center text-slate-300 dark:text-slate-600"
                          aria-hidden
                        >
                          <UtensilsCrossed className="h-8 w-8 opacity-60 sm:h-10 sm:w-10" aria-hidden />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-0.5">
                        <h2 className="text-base font-semibold leading-snug text-slate-900 dark:text-white">
                          {p.name}
                        </h2>
                        <p className="shrink-0 text-base font-bold tabular-nums text-brand-600 dark:text-brand-400">
                          {formatPrice(Number(p.price))}
                        </p>
                      </div>
                      {p.description ? (
                        <p className="line-clamp-3 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                          {p.description}
                        </p>
                      ) : null}
                    </div>
                  </article>
                )}
              </li>
            ))}
          </ul>
        )}
      </main>

      {useCustom && menuTheme.show_social_float ? (
        <PublicSocialFloat
          instagramUrl={menuTheme.social_instagram_url}
          facebookUrl={menuTheme.social_facebook_url}
        />
      ) : null}

      <footer
        className={useCustom ? 'mx-auto mt-12 max-w-lg px-4 text-center text-xs' : 'mx-auto mt-12 max-w-lg px-4 text-center text-xs text-slate-500 dark:text-slate-600'}
        style={useCustom && rt ? { color: rt.effective_text_color, opacity: 0.55 } : undefined}
      >
        <p>
          Feito com{' '}
          <span className={useCustom ? '' : 'text-slate-600 dark:text-slate-500'}>
            Cardápio
            {useCustom && rt ? (
              <span style={{ color: menuTheme.accent_color }}>Pro</span>
            ) : (
              <span className="text-brand-600 dark:text-brand-500">Pro</span>
            )}
          </span>
        </p>
      </footer>
    </div>
  )
}

function ViewModeSwitch({
  viewMode,
  onChange,
  useCustom,
  custom,
}: {
  viewMode: MenuViewMode
  onChange: (m: MenuViewMode) => void
  useCustom: boolean
  custom: CustomTone | null
}) {
  if (useCustom && custom) {
    return (
      <div
        className="inline-flex rounded-xl border p-1 shadow-sm"
        style={{ borderColor: custom.border, backgroundColor: custom.cardBg }}
        role="group"
        aria-label="Modo de visualização do cardápio"
      >
        <button
          type="button"
          onClick={() => onChange('blocks')}
          aria-pressed={viewMode === 'blocks'}
          className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition"
          style={
            viewMode === 'blocks'
              ? { backgroundColor: custom.accent, color: custom.accentFg }
              : { color: custom.text, opacity: 0.85 }
          }
        >
          <LayoutGrid className="h-3.5 w-3.5" aria-hidden />
          Blocos
        </button>
        <button
          type="button"
          onClick={() => onChange('list')}
          aria-pressed={viewMode === 'list'}
          className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition"
          style={
            viewMode === 'list'
              ? { backgroundColor: custom.accent, color: custom.accentFg }
              : { color: custom.text, opacity: 0.85 }
          }
        >
          <List className="h-3.5 w-3.5" aria-hidden />
          Lista
        </button>
      </div>
    )
  }

  return (
    <div
      className="inline-flex rounded-xl border border-slate-200/90 bg-white p-1 shadow-sm dark:border-slate-700 dark:bg-slate-900/60"
      role="group"
      aria-label="Modo de visualização do cardápio"
    >
      <button
        type="button"
        onClick={() => onChange('blocks')}
        aria-pressed={viewMode === 'blocks'}
        className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition ${
          viewMode === 'blocks'
            ? 'bg-brand-600 text-white shadow-sm dark:bg-brand-500'
            : 'text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800/80'
        }`}
      >
        <LayoutGrid className="h-3.5 w-3.5" aria-hidden />
        Blocos
      </button>
      <button
        type="button"
        onClick={() => onChange('list')}
        aria-pressed={viewMode === 'list'}
        className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition ${
          viewMode === 'list'
            ? 'bg-brand-600 text-white shadow-sm dark:bg-brand-500'
            : 'text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800/80'
        }`}
      >
        <List className="h-3.5 w-3.5" aria-hidden />
        Lista
      </button>
    </div>
  )
}

function FilterChip({
  active,
  onClick,
  label,
  custom,
}: {
  active: boolean
  onClick: () => void
  label: string
  custom: CustomTone | null
}) {
  if (custom) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="shrink-0 rounded-full px-4 py-2 text-sm font-medium transition"
        style={
          active
            ? {
                backgroundColor: custom.accent,
                color: custom.accentFg,
                boxShadow: `0 4px 14px ${custom.accent}40`,
              }
            : {
                backgroundColor: 'transparent',
                borderWidth: 1,
                borderStyle: 'solid',
                borderColor: custom.border,
                color: custom.text,
              }
        }
      >
        {label}
      </button>
    )
  }
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition ${
        active
          ? 'bg-brand-600 text-white shadow-md shadow-brand-600/25 dark:shadow-brand-900/40'
          : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800/90 dark:text-slate-200 dark:hover:bg-slate-800'
      }`}
    >
      {label}
    </button>
  )
}
