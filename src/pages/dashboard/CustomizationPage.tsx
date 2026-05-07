import { ThemeMenuPreview } from '@/components/theme/ThemeMenuPreview'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Spinner } from '@/components/ui/Spinner'
import { getPlanLimits } from '@/config/planLimits'
import {
  fetchMyRestaurant,
  updateMyRestaurantTheme,
  uploadRestaurantLogo,
} from '@/services/restaurants'
import {
  DEFAULT_RESTAURANT_THEME,
  type RestaurantTheme,
  type ThemeCardStyle,
  type ThemeCornerRadius,
  type ThemeDensity,
  type ThemeFontId,
  type ThemeProductLayout,
} from '@/types/theme'
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

type PreviewFrame = 'mobile' | 'desktop'

const THEME_PRESETS: {
  label: string
  description: string
  patch: Partial<RestaurantTheme>
}[] = [
  {
    label: 'Minimal claro',
    description: 'Lista limpa com cartões sutis.',
    patch: {
      background_color: '#fafafa',
      accent_color: '#18181b',
      text_color: '',
      heading_font_family: 'dm_sans',
      font_family: 'dm_sans',
      product_layout: 'list',
      card_style: 'flat',
      density: 'comfortable',
      corner_radius: 'md',
    },
  },
  {
    label: 'Noite elegante',
    description: 'Fundo escuro com destaque dourado.',
    patch: {
      background_color: '#0f172a',
      accent_color: '#e7c948',
      text_color: '',
      heading_font_family: 'playfair',
      font_family: 'lora',
      product_layout: 'cards',
      card_style: 'elevated',
      density: 'comfortable',
      corner_radius: 'lg',
    },
  },
  {
    label: 'Bistrô serif',
    description: 'Títulos clássicos e blocos destacados.',
    patch: {
      background_color: '#fef7ed',
      accent_color: '#9a3412',
      text_color: '',
      heading_font_family: 'playfair',
      font_family: 'lora',
      product_layout: 'cards',
      card_style: 'soft',
      density: 'comfortable',
      corner_radius: 'lg',
    },
  },
  {
    label: 'Lista compacta',
    description: 'Muitos itens na tela, ideal para eventos.',
    patch: {
      heading_font_family: 'poppins',
      font_family: 'poppins',
      product_layout: 'compact',
      card_style: 'soft',
      density: 'compact',
      corner_radius: 'sm',
    },
  },
]

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
  const [previewFrame, setPreviewFrame] = useState<PreviewFrame>('mobile')

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
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Personalização</h1>
      <p className="mt-1 text-slate-600 dark:text-slate-400">
        Ajuste o visual público (link /m/…): cores, layout dos pratos, fontes separadas para título e
        texto, e identidade no topo (nome ou logo).
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

          <div>
            <p className="text-sm font-medium text-slate-800 dark:text-slate-100">Temas rápidos</p>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-500">
              Aplicam um conjunto de cores e estilos e ligam a personalização automaticamente.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {THEME_PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  className="inline-flex flex-col rounded-lg border border-slate-200 bg-white px-3 py-2 text-left text-sm transition hover:border-brand-400 hover:bg-brand-50/70 dark:border-slate-700 dark:bg-slate-900/70 dark:hover:border-brand-500/50 dark:hover:bg-brand-500/10"
                  onClick={() => setTheme((t) => ({ ...t, ...preset.patch, enabled: true }))}
                  title={preset.description}
                >
                  <span className="font-medium text-slate-900 dark:text-slate-100">{preset.label}</span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">{preset.description}</span>
                </button>
              ))}
            </div>
          </div>

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
                htmlFor="font-heading"
                className="text-sm font-medium text-slate-700 dark:text-slate-300"
              >
                Fonte dos títulos
              </label>
              <p className="text-xs text-slate-500 dark:text-slate-500">
                Nome do estabelecimento e nomes dos pratos na página pública.
              </p>
              <select
                id="font-heading"
                value={theme.heading_font_family}
                onChange={(e) =>
                  setTheme((t) => ({
                    ...t,
                    heading_font_family: e.target.value as ThemeFontId,
                  }))
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

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="font-family"
                className="text-sm font-medium text-slate-700 dark:text-slate-300"
              >
                Fonte do texto
              </label>
              <p className="text-xs text-slate-500 dark:text-slate-500">
                Descrições, preços e demais textos do cardápio.
              </p>
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

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="product-layout"
                  className="text-sm font-medium text-slate-700 dark:text-slate-300"
                >
                  Layout dos pratos
                </label>
                <select
                  id="product-layout"
                  value={theme.product_layout}
                  onChange={(e) =>
                    setTheme((t) => ({
                      ...t,
                      product_layout: e.target.value as ThemeProductLayout,
                    }))
                  }
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-slate-600 dark:bg-slate-900/80 dark:text-slate-100"
                >
                  <option value="cards">Blocos grandes (alternar com lista no link)</option>
                  <option value="list">Lista (alternar com blocos)</option>
                  <option value="compact">Lista compacta (lista fixa, ideal para cards menores)</option>
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="card-style"
                  className="text-sm font-medium text-slate-700 dark:text-slate-300"
                >
                  Cartões
                </label>
                <select
                  id="card-style"
                  value={theme.card_style}
                  onChange={(e) =>
                    setTheme((t) => ({
                      ...t,
                      card_style: e.target.value as ThemeCardStyle,
                    }))
                  }
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-slate-600 dark:bg-slate-900/80 dark:text-slate-100"
                >
                  <option value="soft">Suave — sombra leve</option>
                  <option value="flat">Plano — só borda, sem sombra</option>
                  <option value="elevated">Elevado — sombra forte</option>
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="density" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Espaçamento
                </label>
                <select
                  id="density"
                  value={theme.density}
                  onChange={(e) =>
                    setTheme((t) => ({
                      ...t,
                      density: e.target.value as ThemeDensity,
                    }))
                  }
                  disabled={theme.product_layout === 'compact'}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-600 dark:bg-slate-900/80 dark:text-slate-100"
                >
                  <option value="comfortable">Confortável</option>
                  <option value="compact">Compacto</option>
                </select>
                {theme.product_layout === 'compact' ? (
                  <p className="text-xs text-slate-500 dark:text-slate-500">
                    Lista compacta usa espaçamento reduzido automaticamente.
                  </p>
                ) : null}
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="corners" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Cantos
                </label>
                <select
                  id="corners"
                  value={theme.corner_radius}
                  onChange={(e) =>
                    setTheme((t) => ({
                      ...t,
                      corner_radius: e.target.value as ThemeCornerRadius,
                    }))
                  }
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-slate-600 dark:bg-slate-900/80 dark:text-slate-100"
                >
                  <option value="sm">Suaves — cantos médios</option>
                  <option value="md">Padrão</option>
                  <option value="lg">Arredondados — bem macios</option>
                </select>
              </div>
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

      <Card>
        <p className="text-sm font-semibold text-slate-900 dark:text-slate-50">Simulação do link público</p>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Largura aproximada de celular ou desktop; só reflete tema e layout (itens são exemplos).
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button
            type="button"
            variant={previewFrame === 'mobile' ? 'secondary' : 'ghost'}
            onClick={() => setPreviewFrame('mobile')}
          >
            Celular
          </Button>
          <Button
            type="button"
            variant={previewFrame === 'desktop' ? 'secondary' : 'ghost'}
            onClick={() => setPreviewFrame('desktop')}
          >
            Desktop
          </Button>
        </div>
        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-100/90 p-4 dark:border-slate-700 dark:bg-slate-900/60">
          <ThemeMenuPreview theme={theme} frame={previewFrame} />
        </div>
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
  const limits = getPlanLimits(restaurant.plan)

  if (!limits.allowCustomization) {
    return (
      <div className="mx-auto max-w-xl">
        <Card>
          <h1 className="text-xl font-semibold text-slate-900 dark:text-white">Personalização indisponível</h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            Seu plano atual não permite personalizar o cardápio. Faça upgrade para Pro ou Enterprise.
          </p>
          <Link to="/app/plans" className="mt-4 inline-flex text-sm font-medium text-brand-600 hover:underline">
            Ver planos
          </Link>
        </Card>
      </div>
    )
  }

  return (
    <CustomizationForm
      key={restaurant.id}
      restaurantId={restaurant.id}
      slug={restaurant.slug}
      initial={initial}
    />
  )
}
