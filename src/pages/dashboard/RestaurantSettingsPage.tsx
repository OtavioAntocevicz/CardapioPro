import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { PageHeader } from '@/components/ui/PageHeader'
import { Spinner } from '@/components/ui/Spinner'
import { fetchMyRestaurant, updateMyRestaurant } from '@/services/restaurants'
import type { Restaurant } from '@/types/database'
import { isValidSlug, slugify } from '@/utils/slug'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { TriangleAlert } from 'lucide-react'
import type { FormEvent } from 'react'
import { useState } from 'react'
import { Link } from 'react-router-dom'

/** Estado inicial do formulário vem das props; `key={restaurant.id}` remonta ao trocar de conta. */
function RestaurantSettingsForm({ restaurant }: { restaurant: Restaurant }) {
  const qc = useQueryClient()
  const [name, setName] = useState(restaurant.name)
  const [slug, setSlug] = useState(restaurant.slug)
  const [slugTouched, setSlugTouched] = useState(false)

  const updateMut = useMutation({
    mutationFn: updateMyRestaurant,
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['my-restaurant'] })
      qc.invalidateQueries({ queryKey: ['public-restaurant'] })
      if (restaurant && variables.slug !== restaurant.slug) {
        qc.removeQueries({ queryKey: ['public-restaurant', restaurant.slug] })
      }
    },
  })

  function handleNameChange(value: string) {
    setName(value)
    if (!slugTouched) setSlug(slugify(value))
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const s = slug.trim().toLowerCase()
    if (!isValidSlug(s)) return
    updateMut.mutate({ name, slug: s })
  }

  const publicPath = `/m/${slug || restaurant.slug}`
  const slugChanged = slug.trim().toLowerCase() !== restaurant.slug

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Restaurante" description="Nome e endereço público do cardápio." />

      <Card className="mt-6">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="Nome do restaurante"
            name="name"
            required
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder="Ex.: Cantinho da Esquina"
          />
          <Input
            label="Slug público (URL)"
            name="slug"
            required
            value={slug}
            onChange={(e) => {
              setSlugTouched(true)
              setSlug(e.target.value.toLowerCase())
            }}
            placeholder="ex-cantinho"
          />
          <p className="-mt-2 text-xs text-slate-500 dark:text-slate-500">
            Caminho público:{' '}
            <code className="rounded bg-slate-100 px-1.5 py-0.5 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
              {publicPath}
            </code>
          </p>
          {slugChanged ? (
            <p className="flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800 ring-1 ring-amber-200 dark:bg-amber-500/10 dark:text-amber-200 dark:ring-amber-500/30">
              <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
              Ao salvar, o link antigo (/m/{restaurant.slug}) deixa de funcionar. QR Codes já impressos
              precisarão ser refeitos.
            </p>
          ) : null}
          {updateMut.isError ? (
            <p className="text-sm text-red-600 dark:text-red-300">
              {(updateMut.error as Error).message.includes('duplicate') ||
              (updateMut.error as Error).message.includes('unique')
                ? 'Este slug já está em uso. Escolha outro.'
                : (updateMut.error as Error).message}
            </p>
          ) : null}
          {updateMut.isSuccess ? (
            <p className="text-sm text-emerald-700 dark:text-emerald-400">Alterações salvas.</p>
          ) : null}
          <div className="flex justify-end">
            <Button type="submit" loading={updateMut.isPending}>
              Salvar alterações
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}

export function RestaurantSettingsPage() {
  const restaurantQuery = useQuery({ queryKey: ['my-restaurant'], queryFn: fetchMyRestaurant })
  const restaurant = restaurantQuery.data

  if (restaurantQuery.isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner />
      </div>
    )
  }

  if (!restaurant) {
    return (
      <p className="text-slate-600 dark:text-slate-400">
        <Link to="/app" className="text-brand-600 hover:underline dark:text-brand-400">
          Crie um restaurante
        </Link>{' '}
        antes de editar as configurações.
      </p>
    )
  }

  return <RestaurantSettingsForm key={restaurant.id} restaurant={restaurant} />
}
