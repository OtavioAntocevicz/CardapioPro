import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { Input } from '@/components/ui/Input'
import { Spinner } from '@/components/ui/Spinner'
import { Textarea } from '@/components/ui/Textarea'
import { fetchCategories } from '@/services/categories'
import { fetchMyRestaurant } from '@/services/restaurants'
import {
  createProduct,
  deleteProduct,
  fetchProducts,
  updateProduct,
  uploadProductImage,
} from '@/services/products'
import type { Product } from '@/types/database'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ImagePlus, Package, Pencil, Trash2 } from 'lucide-react'
import type { FormEvent } from 'react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

function formatPrice(n: number) {
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export function ProductsPage() {
  const qc = useQueryClient()
  const restaurantQuery = useQuery({ queryKey: ['my-restaurant'], queryFn: fetchMyRestaurant })
  const restaurantId = restaurantQuery.data?.id

  const categoriesQuery = useQuery({
    queryKey: ['categories', restaurantId],
    queryFn: () => fetchCategories(restaurantId!),
    enabled: Boolean(restaurantId),
  })

  const productsQuery = useQuery({
    queryKey: ['products', restaurantId],
    queryFn: () => fetchProducts(restaurantId!),
    enabled: Boolean(restaurantId),
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

  if (restaurantQuery.isLoading || !restaurantId) {
    return (
      <div className="flex justify-center py-20">
        <Spinner />
      </div>
    )
  }

  if (!restaurantQuery.data) {
    return (
      <p className="text-slate-600 dark:text-slate-400">
        <Link to="/app" className="text-brand-600 hover:underline dark:text-brand-400">
          Crie um restaurante
        </Link>{' '}
        antes de cadastrar produtos.
      </p>
    )
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Produtos</h1>
          <p className="mt-1 text-slate-600 dark:text-slate-400">Imagens, preços e disponibilidade.</p>
        </div>
        <Button type="button" onClick={() => setModal('create')}>
          Novo produto
        </Button>
      </div>

      <div className="mt-6">
        <label
          className="text-sm font-medium text-slate-700 dark:text-slate-300"
          htmlFor="cat-filter"
        >
          Filtrar por categoria
        </label>
        <select
          id="cat-filter"
          className="mt-1.5 w-full max-w-xs rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-slate-600 dark:bg-slate-900/80 dark:text-slate-100"
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
        </select>
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
          <ul className="grid gap-3 sm:grid-cols-2">
            {filtered.map((p) => (
              <li key={p.id}>
                <Card className="flex h-full flex-col gap-3 p-4">
                  <div className="flex gap-3">
                    <div className="h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-800">
                      {p.image_url ? (
                        <img
                          src={p.image_url}
                          alt=""
                          className="h-full w-full object-cover object-center"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-slate-400 dark:text-slate-600">
                          <ImagePlus className="h-8 w-8" aria-hidden />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-slate-900 dark:text-slate-100">{p.name}</p>
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
                      className="gap-1 text-xs"
                      onClick={() => setModal({ edit: p })}
                    >
                      <Pencil className="h-3.5 w-3.5" aria-hidden />
                      Editar
                    </Button>
                    <Button
                      type="button"
                      variant="danger"
                      className="gap-1 text-xs"
                      onClick={() => {
                        if (confirm('Excluir este produto?')) deleteMut.mutate(p.id)
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
          restaurantId={restaurantId}
          categories={categoriesQuery.data ?? []}
          mode={modal}
          onClose={() => setModal(null)}
          onSaved={() => {
            qc.invalidateQueries({ queryKey: ['products', restaurantId] })
            setModal(null)
          }}
        />
      ) : null}
    </div>
  )
}

function ProductModal({
  restaurantId,
  categories,
  mode,
  onClose,
  onSaved,
}: {
  restaurantId: string
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
  const [file, setFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

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
        })
      } else {
        await createProduct({
          restaurant_id: restaurantId,
          category_id: categoryId || null,
          name: name.trim(),
          description: description.trim() || null,
          price: priceNum,
          image_url: imageUrl,
          is_available: true,
        })
      }
      onSaved()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 p-4 backdrop-blur-sm dark:bg-black/70 sm:items-center">
      <div
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900"
        role="dialog"
        aria-modal
        aria-labelledby="product-modal-title"
      >
        <h2
          id="product-modal-title"
          className="text-lg font-semibold text-slate-900 dark:text-white"
        >
          {editing ? 'Editar produto' : 'Novo produto'}
        </h2>
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
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="product-category"
              className="text-sm font-medium text-slate-700 dark:text-slate-300"
            >
              Categoria
            </label>
            <select
              id="product-category"
              className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-slate-600 dark:bg-slate-900/80 dark:text-slate-100"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
            >
              <option value="">Sem categoria</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Imagem</span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-sm file:text-slate-800 dark:text-slate-400 dark:file:bg-slate-800 dark:file:text-slate-200"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </div>
          {error ? (
            <p className="text-sm text-red-600 dark:text-red-300">{error}</p>
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
