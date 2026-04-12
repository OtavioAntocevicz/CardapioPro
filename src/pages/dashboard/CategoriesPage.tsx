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
import { fetchMyRestaurant } from '@/services/restaurants'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Pencil, Tags, Trash2 } from 'lucide-react'
import type { FormEvent } from 'react'
import { useState } from 'react'
import { Link } from 'react-router-dom'

export function CategoriesPage() {
  const qc = useQueryClient()
  const restaurantQuery = useQuery({ queryKey: ['my-restaurant'], queryFn: fetchMyRestaurant })
  const restaurantId = restaurantQuery.data?.id

  const listQuery = useQuery({
    queryKey: ['categories', restaurantId],
    queryFn: () => fetchCategories(restaurantId!),
    enabled: Boolean(restaurantId),
  })

  const createMut = useMutation({
    mutationFn: (name: string) => createCategory(restaurantId!, name),
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
        antes de adicionar categorias.
      </p>
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
          <Button type="submit" loading={createMut.isPending} disabled={!newName.trim()}>
            Adicionar
          </Button>
        </form>
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
