import { Button } from '@/components/ui/Button'
import { buttonClass } from '@/components/ui/buttonClass'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { Input } from '@/components/ui/Input'
import { PageHeader } from '@/components/ui/PageHeader'
import { Spinner } from '@/components/ui/Spinner'
import { getPlanLimits } from '@/config/planLimits'
import { createMenu, deleteMenu, fetchMenus, updateMenu } from '@/services/menus'
import { fetchMyRestaurant } from '@/services/restaurants'
import { setSelectedMenuId } from '@/utils/menuSelection'
import { slugify } from '@/utils/slug'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { LayoutGrid, Plus, Star, Trash2 } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'

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

  if (restaurantQuery.isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner />
      </div>
    )
  }
  if (!restaurant) {
    return (
      <div className="mx-auto max-w-3xl">
        <EmptyState
          icon={LayoutGrid}
          title="Crie seu restaurante primeiro"
          description="Antes de criar cardápios, configure seu restaurante na visão geral."
          action={
            <Link to="/app" className={buttonClass('primary')}>
              Ir para início
            </Link>
          }
        />
      </div>
    )
  }

  const usagePct = menuLimit > 0 ? Math.min(100, Math.round((menus.length / menuLimit) * 100)) : 0
  const atLimit = menus.length >= menuLimit

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Cardápios"
        description="Crie cardápios diferentes (ex.: almoço, jantar) e escolha qual fica ativo no link público."
      />

      <div className="mt-4 max-w-xs">
        <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
          <span>Uso do plano</span>
          <span className="font-medium text-slate-700 dark:text-slate-300">
            {menus.length}/{menuLimit}
          </span>
        </div>
        <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
          <div
            className={`h-full rounded-full transition-all ${atLimit ? 'bg-amber-500' : 'bg-brand-500'}`}
            style={{ width: `${usagePct}%` }}
          />
        </div>
      </div>

      <Card className="mt-6">
        <form onSubmit={onSubmit} className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <Input
              label="Novo cardápio"
              name="menu-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex.: Almoço"
            />
          </div>
          <Button type="submit" disabled={!name.trim()} loading={createMut.isPending}>
            <Plus className="h-4 w-4" aria-hidden />
            Criar cardápio
          </Button>
        </form>
        {error ? (
          <p className="mt-3 text-sm text-red-600 dark:text-red-300">
            {error}{' '}
            {/limite/i.test(error) ? (
              <Link to="/app/plans" className="underline">
                Ver planos
              </Link>
            ) : null}
          </p>
        ) : null}
      </Card>

      <div className="mt-6 space-y-3">
        {listQuery.isLoading ? (
          <div className="flex justify-center py-10"><Spinner /></div>
        ) : (
          menus.map((menu) => (
            <Card
              key={menu.id}
              className={`flex flex-col gap-3 transition sm:flex-row sm:items-center sm:justify-between ${
                menu.is_active
                  ? 'border-emerald-300 bg-emerald-50/60 ring-1 ring-emerald-300 dark:border-emerald-500/50 dark:bg-emerald-500/10 dark:ring-emerald-500/40'
                  : ''
              }`}
            >
              <div className="min-w-0">
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
              <div className="flex shrink-0 items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant={menu.is_active ? 'ghost' : 'secondary'}
                  onClick={() => setActiveMut.mutate(menu.id)}
                  disabled={menu.is_active}
                  loading={setActiveMut.isPending && setActiveMut.variables === menu.id}
                >
                  <Star className={`h-3.5 w-3.5 ${menu.is_active ? 'fill-current text-emerald-600 dark:text-emerald-400' : ''}`} aria-hidden />
                  {menu.is_active ? 'Em uso' : 'Definir como ativo'}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="danger"
                  aria-label={`Excluir cardápio ${menu.name}`}
                  title={
                    menu.is_active
                      ? 'Não é possível excluir o cardápio ativo'
                      : menus.length <= 1
                        ? 'É preciso manter ao menos um cardápio'
                        : 'Excluir'
                  }
                  onClick={() => {
                    if (
                      confirm(
                        `Excluir o cardápio "${menu.name}"? As categorias e produtos dele também serão removidos.`,
                      )
                    ) {
                      deleteMut.mutate(menu.id)
                    }
                  }}
                  disabled={menus.length <= 1 || menu.is_active}
                  loading={deleteMut.isPending && deleteMut.variables === menu.id}
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden />
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
