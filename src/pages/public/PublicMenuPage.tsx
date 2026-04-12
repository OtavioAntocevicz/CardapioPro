import { ThemeToggle } from '@/components/ThemeToggle'
import { EmptyState } from '@/components/ui/EmptyState'
import { Spinner } from '@/components/ui/Spinner'
import { fetchCategories } from '@/services/categories'
import { fetchRestaurantBySlug } from '@/services/restaurants'
import { fetchProducts } from '@/services/products'
import type { Category, Product } from '@/types/database'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, UtensilsCrossed } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'

function formatPrice(n: number) {
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export function PublicMenuPage() {
  const { slug } = useParams<{ slug: string }>()
  const [searchParams] = useSearchParams()
  const isPreview = searchParams.get('preview') === '1'
  const [activeCategory, setActiveCategory] = useState<string>('all')

  const restaurantQuery = useQuery({
    queryKey: ['public-restaurant', slug],
    queryFn: () => fetchRestaurantBySlug(slug!),
    enabled: Boolean(slug),
  })

  const restaurantId = restaurantQuery.data?.id

  const categoriesQuery = useQuery({
    queryKey: ['public-categories', restaurantId],
    queryFn: () => fetchCategories(restaurantId!),
    enabled: Boolean(restaurantId),
  })

  const productsQuery = useQuery({
    queryKey: ['public-products', restaurantId],
    queryFn: () => fetchProducts(restaurantId!),
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 via-white to-slate-50 pb-14 text-slate-900 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900 dark:text-slate-100">
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

      <header className="sticky top-0 z-20 border-b border-slate-200/90 bg-white/90 px-4 py-4 backdrop-blur-md dark:border-slate-800/80 dark:bg-slate-950/90">
        <div className="relative mx-auto max-w-lg">
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
      </header>

      <div className="mx-auto max-w-lg px-4 pt-5">
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-500">
          Categorias
        </p>
        <div className="flex gap-2 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <FilterChip
            active={activeCategory === 'all'}
            onClick={() => setActiveCategory('all')}
            label="Todos"
          />
          {(byCategory.get(null)?.length ?? 0) > 0 ? (
            <FilterChip
              active={activeCategory === 'none'}
              onClick={() => setActiveCategory('none')}
              label="Outros"
            />
          ) : null}
          {categories.map((c: Category) => (
            <FilterChip
              key={c.id}
              active={activeCategory === c.id}
              onClick={() => setActiveCategory(c.id)}
              label={c.name}
            />
          ))}
        </div>
      </div>

      <main className="mx-auto max-w-lg px-4 pt-6">
        {productsQuery.isLoading || categoriesQuery.isLoading ? (
          <div className="flex justify-center py-16">
            <Spinner />
          </div>
        ) : filteredProducts.length === 0 ? (
          <EmptyState
            icon={UtensilsCrossed}
            title="Nada por aqui"
            description="Este cardápio ainda não tem itens disponíveis nesta seleção."
          />
        ) : (
          <ul className="flex flex-col gap-5">
            {filteredProducts.map((p) => (
              <li key={p.id}>
                <article className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-md shadow-slate-200/50 dark:border-slate-800 dark:bg-slate-900/40 dark:shadow-black/20">
                  <div className="relative aspect-[5/4] w-full overflow-hidden bg-slate-100 dark:bg-slate-800/80 sm:aspect-[16/10]">
                    {p.image_url ? (
                      <img
                        src={p.image_url}
                        alt=""
                        className="h-full w-full object-cover object-center"
                        loading="lazy"
                        decoding="async"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-slate-300 dark:text-slate-600">
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
              </li>
            ))}
          </ul>
        )}
      </main>

      <footer className="mx-auto mt-12 max-w-lg px-4 text-center text-xs text-slate-500 dark:text-slate-600">
        <p>
          Feito com{' '}
          <span className="text-slate-600 dark:text-slate-500">
            Cardápio<span className="text-brand-600 dark:text-brand-500">Pro</span>
          </span>
        </p>
      </footer>
    </div>
  )
}

function FilterChip({
  active,
  onClick,
  label,
}: {
  active: boolean
  onClick: () => void
  label: string
}) {
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
