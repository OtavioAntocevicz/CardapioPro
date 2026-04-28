import { ThemeToggle } from '@/components/ThemeToggle'
import { EmptyState } from '@/components/ui/EmptyState'
import { Spinner } from '@/components/ui/Spinner'
import { fetchCategories } from '@/services/categories'
import { fetchRestaurantBySlug } from '@/services/restaurants'
import { fetchProducts } from '@/services/products'
import type { Category, Product } from '@/types/database'
import { formatPrice } from '@/utils/format'
import {
  parseRestaurantTheme,
  pickCardBorder,
  pickCardSurface,
  pickContrastTextColor,
  resolvedPublicTheme,
  themeFontStack,
} from '@/utils/menuTheme'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, LayoutGrid, List, UtensilsCrossed } from 'lucide-react'
import { useMemo, useState } from 'react'
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
): CustomTone {
  return {
    text: rt.effective_text_color,
    accent: rt.accent_color,
    accentFg: pickContrastTextColor(rt.accent_color),
    border: pickCardBorder(backgroundHex),
    cardBg: pickCardSurface(backgroundHex),
  }
}

export function PublicMenuPage() {
  const { slug } = useParams<{ slug: string }>()
  const [searchParams] = useSearchParams()
  const isPreview = searchParams.get('preview') === '1'
  const [activeCategory, setActiveCategory] = useState<string>('all')
  const [viewMode, setViewMode] = useState<MenuViewMode>('blocks')

  const restaurantQuery = useQuery({
    queryKey: ['public-restaurant', slug],
    queryFn: () => fetchRestaurantBySlug(slug!),
    enabled: Boolean(slug),
  })

  const restaurantId = restaurantQuery.data?.id

  const categoriesQuery = useQuery({
    queryKey: ['public-categories', restaurantId],
    queryFn: () => fetchCategories(restaurantId!, { asPublicVisitor: true }),
    enabled: Boolean(restaurantId),
  })

  const productsQuery = useQuery({
    queryKey: ['public-products', restaurantId],
    queryFn: () => fetchProducts(restaurantId!, { asPublicVisitor: true }),
    enabled: Boolean(restaurantId),
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
  const tone = useCustom && rt ? buildCustomTone(rt, menuTheme.background_color) : null
  const fontStack = useCustom && menuTheme ? themeFontStack(menuTheme.font_family) : undefined
  const showLogo = Boolean(
    useCustom && menuTheme.header_display === 'logo' && menuTheme.logo_url,
  )

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
            ? 'sticky top-0 z-20 border-b px-4 py-4 backdrop-blur-md'
            : 'sticky top-0 z-20 border-b border-slate-200/90 bg-white/90 px-4 py-4 backdrop-blur-md dark:border-slate-800/80 dark:bg-slate-950/90'
        }
        style={
          useCustom && rt
            ? {
                borderColor: pickCardBorder(menuTheme.background_color),
                backgroundColor: `${menuTheme.background_color}f0`,
              }
            : undefined
        }
      >
        <div className="relative mx-auto max-w-lg">
          {!useCustom ? (
            <ThemeToggle className="absolute right-0 top-1/2 z-10 -translate-y-1/2" />
          ) : null}
          <div className={!useCustom ? 'px-12 text-center' : 'px-4 text-center sm:px-12'}>
            <p
              className={
                useCustom
                  ? 'text-[11px] font-semibold uppercase tracking-[0.2em]'
                  : 'text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-600 dark:text-brand-400'
              }
              style={useCustom && rt ? { color: menuTheme.accent_color } : undefined}
            >
              Cardápio digital
            </p>
            {showLogo && menuTheme.logo_url ? (
              <div className="mt-3 flex justify-center">
                <img
                  src={menuTheme.logo_url}
                  alt={restaurant.name}
                  className="h-16 max-w-[min(100%,240px)] object-contain"
                />
              </div>
            ) : (
              <h1
                className={
                  useCustom
                    ? 'mt-0.5 text-2xl font-bold tracking-tight'
                    : 'mt-0.5 text-2xl font-bold tracking-tight text-slate-900 dark:text-white'
                }
                style={useCustom && rt ? { color: rt.effective_text_color } : undefined}
              >
                {restaurant.name}
              </h1>
            )}
          </div>
        </div>
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
            onChange={setViewMode}
            custom={tone}
            useCustom={useCustom}
          />
        </div>
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
        ) : viewMode === 'blocks' ? (
          <ul className="flex flex-col gap-5">
            {filteredProducts.map((p) => (
              <li key={p.id}>
                {useCustom && rt && tone ? (
                  <article
                    className="overflow-hidden rounded-2xl border shadow-md"
                    style={{
                      borderColor: tone.border,
                      backgroundColor: tone.cardBg,
                      boxShadow: `0 8px 30px ${tone.text}12`,
                    }}
                  >
                    <div
                      className="relative aspect-[5/4] w-full overflow-hidden sm:aspect-[16/10]"
                      style={{ backgroundColor: `${tone.text}12` }}
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
                          <UtensilsCrossed className="h-16 w-16 opacity-60" aria-hidden />
                        </div>
                      )}
                    </div>
                    <div className="space-y-1.5 px-4 pb-4 pt-3">
                      <div className="flex flex-wrap items-start justify-between gap-2 gap-y-1">
                        <h2
                          className="text-lg font-semibold leading-snug"
                          style={{ color: rt.effective_text_color }}
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
          <ul className="flex flex-col gap-3">
            {filteredProducts.map((p) => (
              <li key={p.id}>
                {useCustom && rt && tone ? (
                  <article
                    className="flex gap-3 overflow-hidden rounded-2xl border p-3 shadow-sm"
                    style={{
                      borderColor: tone.border,
                      backgroundColor: tone.cardBg,
                      boxShadow: `0 4px 20px ${tone.text}0d`,
                    }}
                  >
                    <div
                      className="relative h-[5.25rem] w-[5.25rem] shrink-0 overflow-hidden rounded-xl sm:h-28 sm:w-28"
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
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-0.5">
                        <h2
                          className="text-base font-semibold leading-snug"
                          style={{ color: rt.effective_text_color }}
                        >
                          {p.name}
                        </h2>
                        <p
                          className="shrink-0 text-base font-bold tabular-nums"
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
