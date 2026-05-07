import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { Input } from '@/components/ui/Input'
import { Spinner } from '@/components/ui/Spinner'
import { getPlanLimits } from '@/config/planLimits'
import { createMenu, deleteMenu, fetchMenus, updateMenu } from '@/services/menus'
import { fetchMyRestaurant } from '@/services/restaurants'
import { setSelectedMenuId } from '@/utils/menuSelection'
import { slugify } from '@/utils/slug'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { LayoutGrid, Star, Trash2 } from 'lucide-react'
import { useState, type FormEvent } from 'react'

function getLimitErrorMessage(message: string): string {
  if (message.includes('plan_limit_exceeded:max_menus')) {
    return 'Você atingiu o limite de cardápios do seu plano. Acesse "Ver planos" para fazer upgrade.'
  }
  return message
}

export function MenusPage() {
  const qc = useQueryClient()
  const restaurantQuery = useQuery({ queryKey: ['my-restaurant'], queryFn: fetchMyRestaurant })
  const restaurant = restaurantQuery.data
  const menuLimit = getPlanLimits(restaurant?.plan).maxMenus

  const listQuery = useQuery({
    queryKey: ['menus', restaurant?.id],
    queryFn: () => fetchMenus(restaurant!.id),
    enabled: Boolean(restaurant?.id),
  })

  const createMut = useMutation({
    mutationFn: (input: { name: string; slug: string }) =>
      createMenu({ restaurant_id: restaurant!.id, ...input }),
    onSuccess: (menu) => {
      setSelectedMenuId(menu.id)
      qc.invalidateQueries({ queryKey: ['menus', restaurant?.id] })
    },
  })

  const setActiveMut = useMutation({
    mutationFn: async (id: string) => {
      const menus = listQuery.data ?? []
      await Promise.all(menus.filter((m) => m.id !== id && m.is_active).map((m) => updateMenu(m.id, { is_active: false })))
      await updateMenu(id, { is_active: true })
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['menus', restaurant?.id] }),
  })

  const deleteMut = useMutation({
    mutationFn: deleteMenu,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['menus', restaurant?.id] }),
  })

  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const menus = listQuery.data ?? []

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    const trimmed = name.trim()
    if (!trimmed) return
    createMut.mutate(
      { name: trimmed, slug: slugify(trimmed) || crypto.randomUUID().slice(0, 8) },
      {
        onSuccess: () => setName(''),
        onError: (err) => setError(getLimitErrorMessage((err as Error).message)),
      },
    )
  }

  if (restaurantQuery.isLoading) return <div className="flex justify-center py-20"><Spinner /></div>
  if (!restaurant) return <EmptyState icon={LayoutGrid} title="Crie seu restaurante primeiro" description="Antes de criar cardápios, configure seu restaurante na visão geral." />

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Cardápios</h1>
      <p className="mt-1 text-slate-600 dark:text-slate-400">
        Você está usando {menus.length}/{menuLimit} cardápios neste restaurante.
      </p>

      <Card className="mt-6">
        <form onSubmit={onSubmit} className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <Input
            label="Novo cardápio"
            name="menu-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex.: Almoço"
            className="flex-1"
          />
          <Button type="submit" disabled={!name.trim()} loading={createMut.isPending}>
            Criar cardápio
          </Button>
        </form>
        {error ? <p className="mt-3 text-sm text-red-600 dark:text-red-300">{error}</p> : null}
      </Card>

      <div className="mt-6 space-y-3">
        {listQuery.isLoading ? (
          <div className="flex justify-center py-10"><Spinner /></div>
        ) : (
          menus.map((menu) => (
            <Card
              key={menu.id}
              className={`flex items-center justify-between gap-3 border-2 transition ${
                menu.is_active
                  ? 'border-emerald-300 bg-emerald-50/60 shadow-sm dark:border-emerald-500/50 dark:bg-emerald-500/10'
                  : 'border-slate-200 dark:border-slate-700'
              }`}
            >
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium text-slate-900 dark:text-slate-100">{menu.name}</p>
                  {menu.is_active ? (
                    <span className="inline-flex rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300">
                      Ativo agora
                    </span>
                  ) : (
                    <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                      Inativo
                    </span>
                  )}
                </div>
                <p className="font-mono text-xs text-slate-500 dark:text-slate-400">{menu.slug}</p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant={menu.is_active ? 'secondary' : 'ghost'}
                  onClick={() => setActiveMut.mutate(menu.id)}
                  disabled={menu.is_active}
                  className="gap-1.5"
                >
                  <Star className="h-3.5 w-3.5" />
                  {menu.is_active ? 'Em uso' : 'Definir como ativo'}
                </Button>
                <Button
                  type="button"
                  variant="danger"
                  onClick={() => deleteMut.mutate(menu.id)}
                  disabled={menus.length <= 1 || menu.is_active}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
