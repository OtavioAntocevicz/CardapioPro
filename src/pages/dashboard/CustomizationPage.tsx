import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Spinner } from '@/components/ui/Spinner'
import {
  fetchMyRestaurant,
  updateMyRestaurantTheme,
  uploadRestaurantLogo,
} from '@/services/restaurants'
import { DEFAULT_RESTAURANT_THEME, type RestaurantTheme, type ThemeFontId } from '@/types/theme'
import {
  normalizeHex,
  parseRestaurantTheme,
  pickContrastTextColor,
} from '@/utils/menuTheme'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ExternalLink, ImagePlus, Palette } from 'lucide-react'
import type { FormEvent } from 'react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

const FONT_OPTIONS: { id: ThemeFontId; label: string }[] = [
  { id: 'system', label: 'Sistema' },
  { id: 'dm_sans', label: 'DM Sans' },
  { id: 'playfair', label: 'Playfair Display' },
  { id: 'lora', label: 'Lora' },
  { id: 'poppins', label: 'Poppins' },
]

function CustomizationForm({
  restaurantId,
  slug,
  initial,
}: {
  restaurantId: string
  slug: string
  initial: RestaurantTheme
}) {
  const qc = useQueryClient()
  const [theme, setTheme] = useState<RestaurantTheme>(initial)
  const [textManual, setTextManual] = useState(Boolean(initial.text_color))
  const [logoUploading, setLogoUploading] = useState(false)

  useEffect(() => {
    setTheme(initial)
    setTextManual(Boolean(initial.text_color))
  }, [initial])

  const saveMut = useMutation({
    mutationFn: updateMyRestaurantTheme,
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['my-restaurant'] })
      qc.invalidateQueries({ queryKey: ['public-restaurant', slug] })
      const next = parseRestaurantTheme(data.theme)
      setTheme(next)
      setTextManual(Boolean(next.text_color))
    },
  })

  async function handleLogoFile(file: File | null) {
    if (!file) return
    setLogoUploading(true)
    try {
      const url = await uploadRestaurantLogo(restaurantId, file)
      setTheme((t) => ({ ...t, logo_url: url, header_display: 'logo' }))
    } finally {
      setLogoUploading(false)
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const textColor =
      textManual && theme.text_color.trim()
        ? normalizeHex(theme.text_color.trim()) ?? ''
        : ''
    saveMut.mutate({
      ...theme,
      text_color: textColor,
      logo_url: theme.header_display === 'logo' ? theme.logo_url : null,
    })
  }

  const previewHref = `/m/${slug}?preview=1`

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Personalização</h1>
      <p className="mt-1 text-slate-600 dark:text-slate-400">
        Ajuste o visual do seu cardápio público: cores, fonte e identidade no topo (nome ou logo).
      </p>

      <Card className="mt-6">
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-700 dark:bg-slate-800/40">
            <input
              type="checkbox"
              className="mt-1 h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
              checked={theme.enabled}
              onChange={(e) => setTheme((t) => ({ ...t, enabled: e.target.checked }))}
            />
            <span>
              <span className="font-medium text-slate-900 dark:text-slate-100">
                Usar personalização no link público
              </span>
              <span className="mt-0.5 block text-sm text-slate-600 dark:text-slate-400">
                Quando desligado, o cardápio mantém o visual padrão do CardápioPro (incluindo tema
                claro/escuro).
              </span>
            </span>
          </label>

          <fieldset
            disabled={!theme.enabled}
            className="flex flex-col gap-5 disabled:pointer-events-none disabled:opacity-60"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Cor de fundo
                </span>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={normalizeHex(theme.background_color) ?? DEFAULT_RESTAURANT_THEME.background_color}
                    onChange={(e) => setTheme((t) => ({ ...t, background_color: e.target.value }))}
                    className="h-10 w-14 cursor-pointer rounded border border-slate-200 bg-white p-0.5 dark:border-slate-600"
                    aria-label="Cor de fundo"
                  />
                  <Input
                    className="font-mono"
                    value={theme.background_color}
                    onChange={(e) => setTheme((t) => ({ ...t, background_color: e.target.value }))}
                    placeholder="#f8fafc"
                    aria-label="Cor de fundo (hex)"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Cor de destaque
                </span>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={normalizeHex(theme.accent_color) ?? DEFAULT_RESTAURANT_THEME.accent_color}
                    onChange={(e) => setTheme((t) => ({ ...t, accent_color: e.target.value }))}
                    className="h-10 w-14 cursor-pointer rounded border border-slate-200 bg-white p-0.5 dark:border-slate-600"
                    aria-label="Cor de destaque"
                  />
                  <Input
                    className="font-mono"
                    value={theme.accent_color}
                    onChange={(e) => setTheme((t) => ({ ...t, accent_color: e.target.value }))}
                    placeholder="#4f46e5"
                    aria-label="Cor de destaque (hex)"
                  />
                </div>
              </div>
            </div>

            <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-slate-300 text-brand-600"
                checked={textManual}
                onChange={(e) => {
                  setTextManual(e.target.checked)
                  if (!e.target.checked) setTheme((t) => ({ ...t, text_color: '' }))
                }}
              />
              Definir cor do texto manualmente
            </label>
            {textManual ? (
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={
                    normalizeHex(theme.text_color) ?? pickSafeTextForColorInput(theme.background_color)
                  }
                  onChange={(e) => setTheme((t) => ({ ...t, text_color: e.target.value }))}
                  className="h-10 w-14 cursor-pointer rounded border border-slate-200 bg-white p-0.5 dark:border-slate-600"
                  aria-label="Cor do texto"
                />
                <Input
                  className="font-mono"
                  label="Cor do texto"
                  value={theme.text_color}
                  onChange={(e) => setTheme((t) => ({ ...t, text_color: e.target.value }))}
                  placeholder="#0f172a"
                />
              </div>
            ) : (
              <p className="text-sm text-slate-500 dark:text-slate-500">
                A cor do texto será ajustada automaticamente para manter leitura confortável sobre o
                fundo.
              </p>
            )}

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="font-family"
                className="text-sm font-medium text-slate-700 dark:text-slate-300"
              >
                Fonte
              </label>
              <select
                id="font-family"
                value={theme.font_family}
                onChange={(e) =>
                  setTheme((t) => ({ ...t, font_family: e.target.value as ThemeFontId }))
                }
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-slate-600 dark:bg-slate-900/80 dark:text-slate-100"
              >
                {FONT_OPTIONS.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Cabeçalho</p>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-500">
                O nome vem de <span className="font-medium">Restaurante</span> no painel.
              </p>
              <div className="mt-3 flex flex-col gap-2">
                <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-800 dark:text-slate-200">
                  <input
                    type="radio"
                    name="header"
                    checked={theme.header_display === 'name'}
                    onChange={() => setTheme((t) => ({ ...t, header_display: 'name' }))}
                    className="text-brand-600"
                  />
                  Mostrar nome do estabelecimento
                </label>
                <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-800 dark:text-slate-200">
                  <input
                    type="radio"
                    name="header"
                    checked={theme.header_display === 'logo'}
                    onChange={() => setTheme((t) => ({ ...t, header_display: 'logo' }))}
                    className="text-brand-600"
                  />
                  Mostrar logo
                </label>
              </div>
            </div>

            {theme.header_display === 'logo' ? (
              <div className="flex flex-col gap-2 rounded-lg border border-dashed border-slate-200 p-4 dark:border-slate-600">
                {theme.logo_url ? (
                  <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-start">
                    <img
                      src={theme.logo_url}
                      alt="Logo do estabelecimento"
                      className="h-16 max-w-[200px] object-contain"
                    />
                    <div className="flex flex-wrap gap-2">
                      <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-slate-100 px-3 py-2 text-sm font-medium text-slate-800 dark:bg-slate-800 dark:text-slate-200">
                        <ImagePlus className="h-4 w-4" aria-hidden />
                        Trocar
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp,image/gif"
                          className="sr-only"
                          onChange={(e) => void handleLogoFile(e.target.files?.[0] ?? null)}
                        />
                      </label>
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => setTheme((t) => ({ ...t, logo_url: null }))}
                      >
                        Remover
                      </Button>
                    </div>
                  </div>
                ) : (
                  <label className="flex cursor-pointer flex-col items-center gap-2 py-4 text-center text-sm text-slate-600 dark:text-slate-400">
                    <ImagePlus className="h-8 w-8 text-slate-400" aria-hidden />
                    <span>Enviar imagem (PNG, JPG ou WebP, até o limite do plano de armazenamento)</span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      className="sr-only"
                      onChange={(e) => void handleLogoFile(e.target.files?.[0] ?? null)}
                    />
                  </label>
                )}
                {logoUploading ? <p className="text-center text-sm text-slate-500">Enviando…</p> : null}
              </div>
            ) : null}
          </fieldset>

          {saveMut.isError ? (
            <p className="text-sm text-red-600 dark:text-red-300">{(saveMut.error as Error).message}</p>
          ) : null}
          {saveMut.isSuccess ? (
            <p className="text-sm text-emerald-700 dark:text-emerald-400">Alterações salvas.</p>
          ) : null}

          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit" loading={saveMut.isPending}>
              Salvar personalização
            </Button>
            <a
              href={previewHref}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 hover:underline dark:text-brand-400"
            >
              Abrir pré-visualização
              <ExternalLink className="h-3.5 w-3.5" aria-hidden />
            </a>
          </div>
        </form>
      </Card>

      <p className="mt-4 flex items-center gap-2 text-sm text-slate-500 dark:text-slate-500">
        <Palette className="h-4 w-4 shrink-0" aria-hidden />
        Dica: escolha fundo e destaque com bom contraste; o preço e os filtros usam a cor de
        destaque.
      </p>
    </div>
  )
}

function pickSafeTextForColorInput(bg: string): string {
  const n = normalizeHex(bg)
  if (!n) return '#0f172a'
  return pickContrastTextColor(n)
}

export function CustomizationPage() {
  const q = useQuery({ queryKey: ['my-restaurant'], queryFn: fetchMyRestaurant })
  const restaurant = q.data

  if (q.isLoading) {
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
        para personalizar o cardápio.
      </p>
    )
  }

  const initial = parseRestaurantTheme(restaurant.theme)

  return (
    <CustomizationForm
      key={restaurant.id}
      restaurantId={restaurant.id}
      slug={restaurant.slug}
      initial={initial}
    />
  )
}
