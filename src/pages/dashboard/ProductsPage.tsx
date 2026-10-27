import { Button } from '@/components/ui/Button'
import { buttonClass } from '@/components/ui/buttonClass'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { Input } from '@/components/ui/Input'
import { PageHeader } from '@/components/ui/PageHeader'
import { Select } from '@/components/ui/Select'
import { Spinner } from '@/components/ui/Spinner'
import { Textarea } from '@/components/ui/Textarea'
import { fetchCategories } from '@/services/categories'
import { fetchMenus } from '@/services/menus'
import { fetchMyRestaurant } from '@/services/restaurants'
import {
  createProduct,
  deleteProduct,
  fetchProducts,
  updateProduct,
  uploadProductImage,
} from '@/services/products'
import type { Product, ProductHighlightBadge } from '@/types/database'
import { formatPrice } from '@/utils/format'
import { HIGHLIGHT_BADGE_OPTIONS } from '@/utils/productBadges'
import { getSelectedMenuId, setSelectedMenuId } from '@/utils/menuSelection'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ImagePlus, Package, Pencil, Plus, Trash2, X } from 'lucide-react'
import type { FormEvent } from 'react'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

function getLimitMessage(message: string): string {
  if (message.includes('plan_limit_exceeded:max_products_per_category')) {
    return 'Você atingiu o limite de produtos por categoria no seu plano.'
  }
  return message
}

export function ProductsPage() {
  const qc = useQueryClient()
  const restaurantQuery = useQuery({ queryKey: ['my-restaurant'], queryFn: fetchMyRestaurant })
  const restaurantId = restaurantQuery.data?.id
  const menusQuery = useQuery({
    queryKey: ['menus', restaurantId],
    queryFn: () => fetchMenus(restaurantId!),
    enabled: Boolean(restaurantId),
  })
  const [selectedMenuId, setSelectedMenu] = useState<string | null>(getSelectedMenuId())

  const effectiveMenuId = useMemo(() => {
    const menus = menusQuery.data ?? []
    if (!menus.length) return null
    const exists = selectedMenuId && menus.some((m) => m.id === selectedMenuId)
    return exists ? selectedMenuId : menus.find((m) => m.is_active)?.id ?? menus[0].id
  }, [menusQuery.data, selectedMenuId])

  const categoriesQuery = useQuery({
    queryKey: ['categories', restaurantId, effectiveMenuId],
    queryFn: () => fetchCategories(restaurantId!, effectiveMenuId ?? undefined),
    enabled: Boolean(restaurantId && effectiveMenuId),
  })

  const productsQuery = useQuery({
    queryKey: ['products', restaurantId, effectiveMenuId],
    queryFn: () => fetchProducts(restaurantId!, effectiveMenuId ?? undefined),
    enabled: Boolean(restaurantId && effectiveMenuId),
  })

  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const filtered = useMemo(() => {
    const list = productsQuery.data ?? []
    if (categoryFilter === 'all') return list
    if (categoryFilter === 'none') return list.filter((p) => !p.category_id)
    return list.filter((p) => p.category_id === categoryFilter)
  }, [productsQuery.data, categoryFilter])

  const toggleMut = useMutation({
    mutationFn: ({ id, is_available }: { id: string; is_available: boolean }) =>
      updateProduct(id, { is_available }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['products', restaurantId] }),
  })

  const deleteMut = useMutation({
    mutationFn: deleteProduct,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['products', restaurantId] }),
  })

  const [modal, setModal] = useState<'create' | { edit: Product } | null>(null)

  if (restaurantQuery.isLoading || menusQuery.isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner />
      </div>
    )
  }

  if (restaurantQuery.isError) {
    return (
      <p className="text-center text-red-600 dark:text-red-400">
        Não foi possível carregar seu restaurante. Atualize a página ou tente novamente.
      </p>
    )
  }

  if (!restaurantQuery.data) {
    return (
      <div className="mx-auto max-w-4xl">
        <EmptyState
          icon={Package}
          title="Crie seu restaurante primeiro"
          description="Para cadastrar produtos, comece pela página inicial do painel e registre o nome e o link público do seu estabelecimento."
          action={
            <Link to="/app" className={buttonClass('primary')}>
              Ir para início
            </Link>
          }
        />
      </div>
    )
  }

  const myRestaurant = restaurantQuery.data

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Produtos"
        description="Imagens, preços e disponibilidade."
        actions={
          <Button type="button" onClick={() => setModal('create')}>
            <Plus className="h-4 w-4" aria-hidden />
            Novo produto
          </Button>
        }
      />

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:max-w-2xl">
        <Select
          id="menu-select"
          label="Cardápio"
          value={effectiveMenuId ?? ''}
          onChange={(e) => {
            setSelectedMenu(e.target.value)
            setSelectedMenuId(e.target.value)
          }}
        >
          {(menusQuery.data ?? []).map((menu) => (
            <option key={menu.id} value={menu.id}>
              {menu.name}
            </option>
          ))}
        </Select>
        <Select
          id="cat-filter"
          label="Filtrar por categoria"
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
        >
          <option value="all">Todas</option>
          <option value="none">Sem categoria</option>
          {(categoriesQuery.data ?? []).map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
      </div>

      <div className="mt-8">
        {productsQuery.isLoading ? (
          <div className="flex justify-center py-12">
            <Spinner />
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Package}
            title="Nenhum produto"
            description="Cadastre pratos e bebidas com foto e preço. Itens desativados não aparecem no cardápio público."
            action={
              <Button type="button" onClick={() => setModal('create')}>
                Adicionar produto
              </Button>
            }
          />
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((p) => (
              <li key={p.id}>
                <Card className="flex h-full flex-col gap-3 p-4">
                  <div className="flex gap-3">
                    <div className="h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-800">
                      {p.image_url ? (
                        <img
                          src={p.image_url}
                          alt={p.name}
                          className="h-full w-full object-cover object-center"
                        />
                      ) : (
                        <div
                          className="flex h-full items-center justify-center text-slate-400 dark:text-slate-600"
                          aria-hidden
                        >
                          <ImagePlus className="h-8 w-8" aria-hidden />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-slate-900 dark:text-slate-100" title={p.name}>
                        {p.name}
                      </p>
                      <p className="text-sm font-semibold text-brand-600 dark:text-brand-400">
                        {formatPrice(Number(p.price))}
                      </p>
                      <p className="mt-1 line-clamp-2 text-xs text-slate-500 dark:text-slate-500">
                        {p.description || '—'}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 border-t border-slate-200 pt-3 dark:border-slate-800">
                    <label className="flex cursor-pointer items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-slate-300 bg-white text-brand-600 focus:ring-brand-500 dark:border-slate-600 dark:bg-slate-900"
                        checked={p.is_available}
                        onChange={() =>
                          toggleMut.mutate({ id: p.id, is_available: !p.is_available })
                        }
                      />
                      Disponível
                    </label>
                    <span className="grow" />
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => setModal({ edit: p })}
                    >
                      <Pencil className="h-3.5 w-3.5" aria-hidden />
                      Editar
                    </Button>
                    <Button
                      type="button"
                      variant="danger"
                      size="sm"
                      aria-label={`Excluir ${p.name}`}
                      title="Excluir"
                      loading={deleteMut.isPending && deleteMut.variables === p.id}
                      onClick={() => {
                        if (confirm(`Excluir o produto "${p.name}"?`)) deleteMut.mutate(p.id)
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden />
                    </Button>
                  </div>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </div>

      {modal ? (
        <ProductModal
          restaurantId={myRestaurant.id}
          menuId={effectiveMenuId ?? ''}
          categories={categoriesQuery.data ?? []}
          mode={modal}
          onClose={() => setModal(null)}
          onSaved={() => {
            qc.invalidateQueries({ queryKey: ['products', myRestaurant.id] })
            setModal(null)
          }}
        />
      ) : null}
    </div>
  )
}

function ProductModal({
  restaurantId,
  menuId,
  categories,
  mode,
  onClose,
  onSaved,
}: {
  restaurantId: string
  menuId: string
  categories: { id: string; name: string }[]
  mode: 'create' | { edit: Product }
  onClose: () => void
  onSaved: () => void
}) {
  const editing = mode !== 'create' ? mode.edit : null
  const [name, setName] = useState(editing?.name ?? '')
  const [description, setDescription] = useState(editing?.description ?? '')
  const [price, setPrice] = useState(
    editing ? String(editing.price).replace('.', ',') : '',
  )
  const [categoryId, setCategoryId] = useState(editing?.category_id ?? '')
  const [highlightBadge, setHighlightBadge] = useState<ProductHighlightBadge | ''>(
    editing?.highlight_badge ?? '',
  )
  const [file, setFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const filePreview = useMemo(() => (file ? URL.createObjectURL(file) : null), [file])
  const previewUrl = filePreview ?? editing?.image_url ?? null

  useEffect(() => {
    return () => {
      if (filePreview) URL.revokeObjectURL(filePreview)
    }
  }, [filePreview])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !loading) onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [loading, onClose])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    const priceNum = Number.parseFloat(price.replace(',', '.'))
    if (Number.isNaN(priceNum) || priceNum < 0) {
      setError('Preço inválido.')
      return
    }
    setLoading(true)
    try {
      let imageUrl: string | null = editing?.image_url ?? null
      if (file) {
        imageUrl = await uploadProductImage(restaurantId, file)
      }
      if (editing) {
        await updateProduct(editing.id, {
          name: name.trim(),
          description: description.trim() || null,
          price: priceNum,
          category_id: categoryId || null,
          image_url: imageUrl,
          highlight_badge: highlightBadge || null,
        })
      } else {
        await createProduct({
          restaurant_id: restaurantId,
          menu_id: menuId,
          category_id: categoryId || null,
          name: name.trim(),
          description: description.trim() || null,
          price: priceNum,
          image_url: imageUrl,
          is_available: true,
          highlight_badge: highlightBadge || null,
        })
      }
      onSaved()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao salvar'
      if (message.includes('plan_limit_exceeded:max_products_per_category')) {
        setError(getLimitMessage(message))
      } else {
        setError(message)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 p-4 backdrop-blur-sm dark:bg-black/70 sm:items-center"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !loading) onClose()
      }}
    >
      <div
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900"
        role="dialog"
        aria-modal
        aria-labelledby="product-modal-title"
      >
        <div className="flex items-start justify-between gap-4">
          <h2
            id="product-modal-title"
            className="text-lg font-semibold text-slate-900 dark:text-white"
          >
            {editing ? 'Editar produto' : 'Novo produto'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="-m-1 rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
            aria-label="Fechar"
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-4">
          <Input label="Nome" name="name" required value={name} onChange={(e) => setName(e.target.value)} />
          <Textarea
            label="Descrição"
            name="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
          />
          <Input
            label="Preço (R$)"
            name="price"
            required
            inputMode="decimal"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="12,90"
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Select
              id="product-category"
              label="Categoria"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
            >
              <option value="">Sem categoria</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
            <Select
              id="product-badge"
              label="Selo de destaque"
              value={highlightBadge}
              onChange={(e) => setHighlightBadge(e.target.value as ProductHighlightBadge | '')}
            >
              {HIGHLIGHT_BADGE_OPTIONS.map((o) => (
                <option key={o.value || 'none'} value={o.value}>
                  {o.label}
                </option>
              ))}
            </Select>
          </div>
          <p className="-mt-2 text-xs text-slate-500">
            O selo aparece no cardápio público quando a personalização estiver ativa.
          </p>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="product-image" className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Imagem
            </label>
            <div className="flex items-center gap-3">
              <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-slate-100 dark:bg-slate-800">
                {previewUrl ? (
                  <img src={previewUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-slate-400 dark:text-slate-600">
                    <ImagePlus className="h-6 w-6" aria-hidden />
                  </div>
                )}
              </div>
              <input
                id="product-image"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="min-w-0 flex-1 text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-sm file:text-slate-800 dark:text-slate-400 dark:file:bg-slate-800 dark:file:text-slate-200"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
            </div>
          </div>
          {error ? (
            <p className="text-sm text-red-600 dark:text-red-300">
              {error}{' '}
              {/limite/i.test(error) ? (
                <Link to="/app/plans" className="underline">
                  Ver planos disponíveis
                </Link>
              ) : null}
            </p>
          ) : null}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" loading={loading}>
              Salvar
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
