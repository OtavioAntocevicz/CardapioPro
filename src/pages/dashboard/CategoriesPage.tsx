import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { Input } from '@/components/ui/Input'
import { Spinner } from '@/components/ui/Spinner'
import {
  createCategory,
  deleteCategory,
  fetchCategories,
  updateCategory,
} from '@/services/categories'
import { fetchMenus } from '@/services/menus'
import { fetchMyRestaurant } from '@/services/restaurants'
import { getSelectedMenuId, setSelectedMenuId } from '@/utils/menuSelection'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Pencil, Tags, Trash2 } from 'lucide-react'
import type { FormEvent } from 'react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

function getLimitMessage(message: string): string {
  if (message.includes('plan_limit_exceeded:max_categories_per_menu')) {
    return 'Você atingiu o limite de categorias por cardápio no seu plano.'
  }
  return message
}

export function CategoriesPage() {
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

  const listQuery = useQuery({
    queryKey: ['categories', restaurantId, effectiveMenuId],
    queryFn: () => fetchCategories(restaurantId!, effectiveMenuId ?? undefined),
    enabled: Boolean(restaurantId && effectiveMenuId),
  })

  const createMut = useMutation({
    mutationFn: (name: string) => createCategory(restaurantId!, effectiveMenuId!, name),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['categories', restaurantId] }),
  })

  const updateMut = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) => updateCategory(id, name),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['categories', restaurantId] }),
  })

  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteCategory(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['categories', restaurantId] }),
  })

  const [newName, setNewName] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')

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
      <div className="mx-auto max-w-2xl">
        <EmptyState
          icon={Tags}
          title="Crie seu restaurante primeiro"
          description="As categorias ficam vinculadas ao seu estabelecimento. Configure o restaurante na página inicial do painel e volte aqui em seguida."
          action={
            <Link
              to="/app"
              className="inline-flex items-center justify-center rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm shadow-brand-600/20 transition hover:bg-brand-700 dark:shadow-brand-900/40"
            >
              Ir para início
            </Link>
          }
        />
      </div>
    )
  }

  function handleAdd(e: FormEvent) {
    e.preventDefault()
    if (!newName.trim()) return
    createMut.mutate(newName, { onSuccess: () => setNewName('') })
  }

  function startEdit(id: string, name: string) {
    setEditingId(id)
    setEditName(name)
  }

  function saveEdit() {
    if (!editingId || !editName.trim()) return
    updateMut.mutate(
      { id: editingId, name: editName },
      { onSuccess: () => setEditingId(null) },
    )
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Categorias</h1>
      <p className="mt-1 text-slate-600 dark:text-slate-400">Organize itens do cardápio em seções.</p>
      <div className="mt-4">
        <label className="text-sm font-medium text-slate-700 dark:text-slate-300" htmlFor="menu-select">
          Cardápio
        </label>
        <select
          id="menu-select"
          value={effectiveMenuId ?? ''}
          onChange={(e) => {
            setSelectedMenu(e.target.value)
            setSelectedMenuId(e.target.value)
          }}
          className="mt-1.5 w-full max-w-xs rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 dark:border-slate-600 dark:bg-slate-900/80 dark:text-slate-100"
        >
          {(menusQuery.data ?? []).map((menu) => (
            <option key={menu.id} value={menu.id}>
              {menu.name}
            </option>
          ))}
        </select>
      </div>

      <Card className="mt-6">
        <form onSubmit={handleAdd} className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <Input
              label="Nova categoria"
              name="newCategory"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Ex.: Pratos principais"
            />
          </div>
          <Button
            type="submit"
            loading={createMut.isPending}
            disabled={!newName.trim() || !effectiveMenuId}
          >
            Adicionar
          </Button>
        </form>
        {createMut.isError ? (
          <p className="mt-3 text-sm text-amber-700 dark:text-amber-300">
            {getLimitMessage((createMut.error as Error).message)}{' '}
            <Link to="/app/plans" className="underline">
              Ver planos disponíveis
            </Link>
          </p>
        ) : null}
      </Card>

      <div className="mt-8">
        {listQuery.isLoading ? (
          <div className="flex justify-center py-12">
            <Spinner />
          </div>
        ) : listQuery.data?.length === 0 ? (
          <EmptyState
            icon={Tags}
            title="Nenhuma categoria"
            description="Adicione a primeira categoria para começar a cadastrar produtos."
          />
        ) : (
          <ul className="flex flex-col gap-2">
            {listQuery.data?.map((c) => (
              <li key={c.id}>
                <Card className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
                  {editingId === c.id ? (
                    <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
                      <Input
                        name={`edit-${c.id}`}
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="sm:max-w-xs"
                      />
                      <div className="flex gap-2">
                        <Button type="button" onClick={saveEdit} loading={updateMut.isPending}>
                          Salvar
                        </Button>
                        <Button type="button" variant="ghost" onClick={() => setEditingId(null)}>
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <span className="font-medium text-slate-900 dark:text-slate-100">{c.name}</span>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="secondary"
                          className="gap-1.5"
                          onClick={() => startEdit(c.id, c.name)}
                        >
                          <Pencil className="h-3.5 w-3.5" aria-hidden />
                          Editar
                        </Button>
                        <Button
                          type="button"
                          variant="danger"
                          className="gap-1.5"
                          onClick={() => {
                            if (confirm('Excluir esta categoria? Produtos podem ficar sem categoria.')) {
                              deleteMut.mutate(c.id)
                            }
                          }}
                          loading={deleteMut.isPending}
                        >
                          <Trash2 className="h-3.5 w-3.5" aria-hidden />
                          Excluir
                        </Button>
                      </div>
                    </>
                  )}
                </Card>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
