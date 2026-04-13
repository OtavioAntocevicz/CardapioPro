import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Spinner } from '@/components/ui/Spinner'
import { fetchMyRestaurant, updateMyRestaurant } from '@/services/restaurants'
import { isValidSlug, slugify } from '@/utils/slug'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { FormEvent } from 'react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

export function RestaurantSettingsPage() {
  const qc = useQueryClient()
  const restaurantQuery = useQuery({ queryKey: ['my-restaurant'], queryFn: fetchMyRestaurant })
  const restaurant = restaurantQuery.data

  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [slugTouched, setSlugTouched] = useState(false)

  useEffect(() => {
    if (!restaurant) return
    setName(restaurant.name)
    setSlug(restaurant.slug)
    setSlugTouched(false)
  }, [restaurant])

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

  const publicPath = `/m/${slug || restaurant.slug}`

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Restaurante</h1>
      <p className="mt-1 text-slate-600 dark:text-slate-400">
        Nome e endereço público do cardápio. Ao mudar o slug, o link antigo deixa de funcionar.
      </p>

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
          <p className="text-xs text-slate-500 dark:text-slate-500">
            Caminho público: <span className="text-slate-700 dark:text-slate-400">{publicPath}</span>
          </p>
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
          <Button type="submit" loading={updateMut.isPending}>
            Salvar alterações
          </Button>
        </form>
      </Card>
    </div>
  )
}
