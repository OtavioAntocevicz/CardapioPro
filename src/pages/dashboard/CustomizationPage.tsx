import { PhoneMockupPreview } from '@/components/theme/PhoneMockupPreview'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Spinner } from '@/components/ui/Spinner'
import { getPlanLimits } from '@/config/planLimits'
import { BANNER_PRESETS } from '@/data/bannerPresets'
import {
  fetchMyRestaurant,
  updateMyRestaurantTheme,
  uploadRestaurantBanner,
  uploadRestaurantLogo,
} from '@/services/restaurants'
import {
  DEFAULT_RESTAURANT_THEME,
  type RestaurantTheme,
  type ThemeBadgeStyle,
  type ThemeCardBorderStyle,
  type ThemeCardStyle,
  type ThemeCornerRadius,
  type ThemeDensity,
  type ThemeEntryAnimation,
  type ThemeFontId,
  type ThemeLogoAlign,
  type ThemeLogoShape,
  type ThemeProductLayout,
} from '@/types/theme'
import {
  normalizeHex,
  parseRestaurantTheme,
  pickContrastTextColor,
} from '@/utils/menuTheme'
import {
  sanitizeSocialUrlForSave,
  validateSocialUrl,
} from '@/utils/socialUrl'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  ExternalLink,
  ImagePlus,
  LayoutGrid,
  List,
  Palette,
  Share2,
  Smartphone,
  Sparkles,
  Type,
  Wand2,
  X,
} from 'lucide-react'
import type { FormEvent, ReactNode } from 'react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

type StudioTab = 'temas' | 'cores' | 'fontes' | 'layout' | 'branding' | 'estilo' | 'extras'

const TABS: { id: StudioTab; label: string; icon: typeof Palette }[] = [
  { id: 'temas', label: 'Temas', icon: Sparkles },
  { id: 'cores', label: 'Cores', icon: Palette },
  { id: 'fontes', label: 'Fontes', icon: Type },
  { id: 'layout', label: 'Layout', icon: LayoutGrid },
  { id: 'branding', label: 'Branding', icon: ImagePlus },
  { id: 'estilo', label: 'Estilo', icon: Wand2 },
  { id: 'extras', label: 'Extras', icon: Share2 },
]

const THEME_PRESETS: {
  label: string
  description: string
  swatch: [string, string]
  patch: Partial<RestaurantTheme>
}[] = [
  {
    label: 'Minimal claro',
    description: 'Lista limpa, cartões planos.',
    swatch: ['#fafafa', '#18181b'],
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
    description: 'Fundo escuro, destaque dourado.',
    swatch: ['#0f172a', '#e7c948'],
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
    description: 'Títulos clássicos, blocos suaves.',
    swatch: ['#fef7ed', '#9a3412'],
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
    description: 'Máximo de itens na tela.',
    swatch: ['#f8fafc', '#4f46e5'],
    patch: {
      background_color: '#f8fafc',
      accent_color: '#4f46e5',
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

const CORNER_LABELS: Record<ThemeCornerRadius, string> = {
  sm: 'Suaves',
  md: 'Padrão',
  lg: 'Arredondados',
}

function pickSafeTextForColorInput(bg: string): string {
  const n = normalizeHex(bg)
  if (!n) return '#0f172a'
  return pickContrastTextColor(n)
}

function CustomizationForm({
  restaurantId,
  slug,
  restaurantName,
  initial,
}: {
  restaurantId: string
  slug: string
  restaurantName: string
  initial: RestaurantTheme
}) {
  const qc = useQueryClient()
  const [theme, setTheme] = useState<RestaurantTheme>(initial)
  const [textManual, setTextManual] = useState(Boolean(initial.text_color))
  const [logoUploading, setLogoUploading] = useState(false)
  const [bannerUploading, setBannerUploading] = useState(false)
  const [activeTab, setActiveTab] = useState<StudioTab>('temas')
  const [mobilePreviewOpen, setMobilePreviewOpen] = useState(false)

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

  async function handleBannerFile(file: File | null) {
    if (!file) return
    setBannerUploading(true)
    try {
      const url = await uploadRestaurantBanner(restaurantId, file)
      setTheme((t) => ({ ...t, header_banner_url: url }))
    } finally {
      setBannerUploading(false)
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const instagramError = validateSocialUrl(theme.social_instagram_url, 'instagram')
    const facebookError = validateSocialUrl(theme.social_facebook_url, 'facebook')
    if (instagramError || facebookError) return

    const textColor =
      textManual && theme.text_color.trim()
        ? normalizeHex(theme.text_color.trim()) ?? ''
        : ''
    saveMut.mutate({
      ...theme,
      text_color: textColor,
      logo_url: theme.header_display === 'logo' ? theme.logo_url : null,
      social_instagram_url: sanitizeSocialUrlForSave(theme.social_instagram_url),
      social_facebook_url: sanitizeSocialUrlForSave(theme.social_facebook_url),
    })
  }

  const instagramError = validateSocialUrl(theme.social_instagram_url, 'instagram')
  const facebookError = validateSocialUrl(theme.social_facebook_url, 'facebook')

  const previewHref = `/m/${slug}?preview=1`
  const cornerIndex = (['sm', 'md', 'lg'] as ThemeCornerRadius[]).indexOf(theme.corner_radius)

  return (
    <div className="-mx-4 -mt-4 flex h-[calc(100dvh-3.5rem)] flex-col overflow-hidden md:-mx-8 md:-mt-8 lg:grid lg:grid-cols-[minmax(0,1fr)_320px]">
      {/* Coluna 2 — painel de configurações */}
      <form onSubmit={handleSubmit} className="flex min-h-0 min-w-0 flex-1 flex-col">
        <header className="shrink-0 border-b border-slate-200 bg-white/90 px-4 py-4 backdrop-blur dark:border-slate-800 dark:bg-slate-950/90 md:px-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-white">
                Estúdio de personalização
              </h1>
              <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
                Ajuste o visual do link público — alterações refletem na prévia à direita.
              </p>
            </div>
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-900/60">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                checked={theme.enabled}
                onChange={(e) => setTheme((t) => ({ ...t, enabled: e.target.checked }))}
              />
              <span className="font-medium text-slate-800 dark:text-slate-200">Tema ativo</span>
            </label>
          </div>

          <nav
            className="mt-4 flex gap-1 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            aria-label="Seções de personalização"
          >
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setActiveTab(id)}
                className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition ${
                  activeTab === id
                    ? 'bg-brand-100 text-brand-800 ring-1 ring-brand-200 dark:bg-brand-500/20 dark:text-brand-200 dark:ring-brand-500/40'
                    : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800/80'
                }`}
                aria-current={activeTab === id ? 'page' : undefined}
              >
                <Icon className="h-4 w-4 shrink-0" aria-hidden />
                {label}
              </button>
            ))}
          </nav>
        </header>

        <div
          className={`min-h-0 flex-1 overflow-y-auto px-4 py-5 md:px-6 ${!theme.enabled && activeTab !== 'temas' ? 'opacity-60' : ''}`}
        >
          {activeTab === 'temas' ? (
            <TabPanel title="Temas rápidos" description="Comece com um preset e refine nas outras abas.">
              <div className="grid gap-3 sm:grid-cols-2">
                {THEME_PRESETS.map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    className="group flex flex-col rounded-xl border border-slate-200 bg-white p-4 text-left transition hover:border-brand-400 hover:shadow-md dark:border-slate-700 dark:bg-slate-900/50 dark:hover:border-brand-500/50"
                    onClick={() => setTheme((t) => ({ ...t, ...preset.patch, enabled: true }))}
                  >
                    <div className="mb-3 flex gap-1">
                      <span
                        className="h-8 flex-1 rounded-md ring-1 ring-black/5"
                        style={{ backgroundColor: preset.swatch[0] }}
                      />
                      <span
                        className="h-8 w-8 rounded-md ring-1 ring-black/5"
                        style={{ backgroundColor: preset.swatch[1] }}
                      />
                    </div>
                    <span className="font-semibold text-slate-900 dark:text-white">{preset.label}</span>
                    <span className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                      {preset.description}
                    </span>
                  </button>
                ))}
              </div>
            </TabPanel>
          ) : null}

          {activeTab === 'cores' ? (
            <TabPanel title="Paleta" description="Fundo, destaque e texto do cardápio público.">
              <fieldset disabled={!theme.enabled} className="space-y-5 disabled:pointer-events-none">
                <ColorField
                  label="Cor de fundo"
                  value={theme.background_color}
                  fallback={DEFAULT_RESTAURANT_THEME.background_color}
                  onChange={(v) => setTheme((t) => ({ ...t, background_color: v }))}
                />
                <ColorField
                  label="Cor de destaque"
                  hint="Preços, chips e destaques usam esta cor."
                  value={theme.accent_color}
                  fallback={DEFAULT_RESTAURANT_THEME.accent_color}
                  onChange={(v) => setTheme((t) => ({ ...t, accent_color: v }))}
                />
                <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-700">
                  <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-slate-800 dark:text-slate-200">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-slate-300 text-brand-600"
                      checked={textManual}
                      onChange={(e) => {
                        setTextManual(e.target.checked)
                        if (!e.target.checked) setTheme((t) => ({ ...t, text_color: '' }))
                      }}
                    />
                    Cor do texto manual
                  </label>
                  {textManual ? (
                    <div className="mt-3">
                      <ColorField
                        label="Cor do texto"
                        value={theme.text_color}
                        fallback={pickSafeTextForColorInput(theme.background_color)}
                        onChange={(v) => setTheme((t) => ({ ...t, text_color: v }))}
                      />
                    </div>
                  ) : (
                    <p className="mt-2 text-xs text-slate-500 dark:text-slate-500">
                      Automático — contraste calculado a partir do fundo.
                    </p>
                  )}
                </div>
              </fieldset>
            </TabPanel>
          ) : null}

          {activeTab === 'fontes' ? (
            <TabPanel title="Tipografia" description="Separe a personalidade dos títulos e do corpo.">
              <fieldset disabled={!theme.enabled} className="space-y-5 disabled:pointer-events-none">
                <SelectField
                  id="font-heading"
                  label="Fonte dos títulos"
                  hint="Nome do restaurante e nomes dos pratos."
                  value={theme.heading_font_family}
                  options={FONT_OPTIONS}
                  onChange={(v) =>
                    setTheme((t) => ({ ...t, heading_font_family: v as ThemeFontId }))
                  }
                />
                <SelectField
                  id="font-body"
                  label="Fonte do texto"
                  hint="Descrições, preços e labels."
                  value={theme.font_family}
                  options={FONT_OPTIONS}
                  onChange={(v) => setTheme((t) => ({ ...t, font_family: v as ThemeFontId }))}
                />
              </fieldset>
            </TabPanel>
          ) : null}

          {activeTab === 'layout' ? (
            <TabPanel title="Layout dos pratos" description="Como os itens aparecem no cardápio.">
              <fieldset disabled={!theme.enabled} className="space-y-6 disabled:pointer-events-none">
                <SegmentField
                  label="Modo de exibição"
                  value={theme.product_layout}
                  options={[
                    { value: 'cards', label: 'Blocos', icon: LayoutGrid },
                    { value: 'list', label: 'Lista', icon: List },
                    { value: 'compact', label: 'Compacto', icon: List },
                  ]}
                  onChange={(v) =>
                    setTheme((t) => ({
                      ...t,
                      product_layout: v as ThemeProductLayout,
                    }))
                  }
                />
                <SegmentField
                  label="Estilo dos cartões"
                  value={theme.card_style}
                  options={[
                    { value: 'soft', label: 'Suave' },
                    { value: 'flat', label: 'Plano' },
                    { value: 'elevated', label: 'Elevado' },
                  ]}
                  onChange={(v) =>
                    setTheme((t) => ({ ...t, card_style: v as ThemeCardStyle }))
                  }
                />
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-800 dark:text-slate-200">
                      Cantos arredondados
                    </span>
                    <span className="text-xs text-slate-500">{CORNER_LABELS[theme.corner_radius]}</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={2}
                    step={1}
                    value={cornerIndex >= 0 ? cornerIndex : 2}
                    onChange={(e) => {
                      const radii: ThemeCornerRadius[] = ['sm', 'md', 'lg']
                      setTheme((t) => ({
                        ...t,
                        corner_radius: radii[Number(e.target.value)] ?? 'lg',
                      }))
                    }}
                    className="h-2 w-full cursor-pointer accent-brand-600"
                    aria-label="Cantos arredondados"
                  />
                </div>
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-800 dark:text-slate-200">
                      Espaçamento
                    </span>
                    <span className="text-xs text-slate-500">
                      {theme.product_layout === 'compact'
                        ? 'Automático (compacto)'
                        : theme.density === 'comfortable'
                          ? 'Confortável'
                          : 'Compacto'}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={1}
                    disabled={theme.product_layout === 'compact'}
                    value={theme.density === 'comfortable' ? 0 : 1}
                    onChange={(e) =>
                      setTheme((t) => ({
                        ...t,
                        density: (Number(e.target.value) === 0
                          ? 'comfortable'
                          : 'compact') as ThemeDensity,
                      }))
                    }
                    className="h-2 w-full cursor-pointer accent-brand-600 disabled:opacity-40"
                    aria-label="Espaçamento entre itens"
                  />
                </div>
              </fieldset>
            </TabPanel>
          ) : null}

          {activeTab === 'branding' ? (
            <TabPanel
              title="Identidade visual"
              description="Logo, capa do cabeçalho e posicionamento no topo do cardápio."
            >
              <fieldset disabled={!theme.enabled} className="space-y-6 disabled:pointer-events-none">
                <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-700">
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                    Banner de capa
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    Imagem larga no topo, estilo perfil de rede social.
                  </p>
                  {theme.header_banner_url ? (
                    <div className="mt-3 space-y-3">
                      <img
                        src={theme.header_banner_url}
                        alt="Banner"
                        className="h-28 w-full rounded-lg object-cover"
                      />
                      <div className="flex flex-wrap gap-2">
                        <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-slate-100 px-3 py-2 text-sm font-medium dark:bg-slate-800">
                          Trocar capa
                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            className="sr-only"
                            onChange={(e) => void handleBannerFile(e.target.files?.[0] ?? null)}
                          />
                        </label>
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => setTheme((t) => ({ ...t, header_banner_url: null }))}
                        >
                          Remover
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <label className="mt-3 flex cursor-pointer flex-col items-center gap-2 rounded-lg border border-dashed border-slate-300 py-6 text-sm text-slate-600 dark:border-slate-600 dark:text-slate-400">
                      Enviar imagem de capa
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="sr-only"
                        onChange={(e) => void handleBannerFile(e.target.files?.[0] ?? null)}
                      />
                    </label>
                  )}
                  {bannerUploading ? (
                    <p className="mt-2 text-center text-sm text-slate-500">Enviando capa…</p>
                  ) : null}
                  <div className="mt-4 border-t border-slate-200 pt-4 dark:border-slate-700">
                    <p className="text-xs font-medium text-slate-700 dark:text-slate-300">
                      Ou escolha uma capa pronta
                    </p>
                    <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                      {BANNER_PRESETS.map((preset) => {
                        const selected = theme.header_banner_url === preset.url
                        return (
                          <button
                            key={preset.id}
                            type="button"
                            className={`group overflow-hidden rounded-lg border-2 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 ${
                              selected
                                ? 'border-brand-600 ring-2 ring-brand-500/30'
                                : 'border-transparent hover:border-slate-300 dark:hover:border-slate-600'
                            }`}
                            onClick={() =>
                              setTheme((t) => ({ ...t, header_banner_url: preset.url }))
                            }
                            aria-pressed={selected}
                            aria-label={`Capa: ${preset.label}`}
                          >
                            <img
                              src={preset.url}
                              alt=""
                              className="aspect-[3/1] w-full object-cover"
                            />
                            <span className="block truncate px-2 py-1.5 text-[11px] font-medium text-slate-600 group-hover:text-slate-900 dark:text-slate-400 dark:group-hover:text-slate-200">
                              {preset.label}
                            </span>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </div>

                <SegmentField
                  label="Cabeçalho"
                  value={theme.header_display}
                  options={[
                    { value: 'name', label: 'Nome' },
                    { value: 'logo', label: 'Logo' },
                  ]}
                  onChange={(v) =>
                    setTheme((t) => ({
                      ...t,
                      header_display: v as 'name' | 'logo',
                      ...(v === 'name' ? { logo_align: 'center' as const } : {}),
                    }))
                  }
                />

                {theme.header_display === 'logo' ? (
                  <>
                    <SegmentField
                      label="Alinhamento da logo"
                      value={theme.logo_align}
                      options={[
                        { value: 'left', label: 'Esquerda' },
                        { value: 'center', label: 'Centro' },
                        { value: 'right', label: 'Direita' },
                      ]}
                      onChange={(v) =>
                        setTheme((t) => ({ ...t, logo_align: v as ThemeLogoAlign }))
                      }
                    />
                    <div>
                      <div className="mb-2 flex justify-between text-sm">
                        <span className="font-medium text-slate-800 dark:text-slate-200">
                          Tamanho da logo
                        </span>
                        <span className="text-slate-500">{theme.logo_size}px</span>
                      </div>
                      <input
                        type="range"
                        min={50}
                        max={200}
                        value={theme.logo_size}
                        onChange={(e) =>
                          setTheme((t) => ({ ...t, logo_size: Number(e.target.value) }))
                        }
                        className="h-2 w-full accent-brand-600"
                        aria-label="Tamanho da logo"
                      />
                    </div>
                    <SegmentField
                      label="Formato da logo"
                      value={theme.logo_shape}
                      options={[
                        { value: 'square', label: 'Quadrada' },
                        { value: 'rounded', label: 'Suave' },
                        { value: 'circle', label: 'Círculo' },
                      ]}
                      onChange={(v) =>
                        setTheme((t) => ({ ...t, logo_shape: v as ThemeLogoShape }))
                      }
                    />
                    <div className="rounded-xl border border-dashed border-slate-200 p-4 dark:border-slate-600">
                    {theme.logo_url ? (
                      <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-start">
                        <img
                          src={theme.logo_url}
                          alt="Logo"
                          className="h-16 max-w-[200px] object-contain"
                        />
                        <div className="flex flex-wrap gap-2">
                          <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-slate-100 px-3 py-2 text-sm font-medium dark:bg-slate-800">
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
                      <label className="flex cursor-pointer flex-col items-center gap-2 py-6 text-center text-sm text-slate-600 dark:text-slate-400">
                        <ImagePlus className="h-8 w-8 text-slate-400" aria-hidden />
                        Enviar logo (PNG, JPG ou WebP)
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp,image/gif"
                          className="sr-only"
                          onChange={(e) => void handleLogoFile(e.target.files?.[0] ?? null)}
                        />
                      </label>
                    )}
                    {logoUploading ? (
                      <p className="text-center text-sm text-slate-500">Enviando…</p>
                    ) : null}
                    </div>
                  </>
                ) : (
                  <p className="text-xs text-slate-500">
                    O nome vem de{' '}
                    <Link to="/app/settings" className="text-brand-600 hover:underline dark:text-brand-400">
                      Restaurante
                    </Link>{' '}
                    no painel.
                  </p>
                )}
              </fieldset>
            </TabPanel>
          ) : null}

          {activeTab === 'estilo' ? (
            <TabPanel title="Efeitos visuais" description="Glassmorphism, bordas e animações de entrada.">
              <fieldset disabled={!theme.enabled} className="space-y-6 disabled:pointer-events-none">
                <div>
                  <div className="mb-2 flex justify-between text-sm">
                    <span className="font-medium text-slate-800 dark:text-slate-200">
                      Opacidade dos cards
                    </span>
                    <span className="text-slate-500">{theme.card_opacity}%</span>
                  </div>
                  <input
                    type="range"
                    min={40}
                    max={100}
                    value={theme.card_opacity}
                    onChange={(e) =>
                      setTheme((t) => ({ ...t, card_opacity: Number(e.target.value) }))
                    }
                    className="h-2 w-full accent-brand-600"
                    aria-label="Opacidade dos cards"
                  />
                  <p className="mt-1 text-xs text-slate-500">
                    Valores baixos criam efeito glassmorphism sobre o fundo.
                  </p>
                </div>
                <SegmentField
                  label="Bordas dos cards"
                  value={theme.card_border_style}
                  options={[
                    { value: 'solid', label: 'Sólida' },
                    { value: 'dashed', label: 'Tracejada' },
                    { value: 'double', label: 'Dupla' },
                  ]}
                  onChange={(v) =>
                    setTheme((t) => ({
                      ...t,
                      card_border_style: v as ThemeCardBorderStyle,
                    }))
                  }
                />
                <SelectField
                  id="entry-animation"
                  label="Animação de entrada"
                  hint="Como os itens aparecem ao carregar o cardápio."
                  value={theme.entry_animation}
                  options={[
                    { id: 'none', label: 'Sem animação' },
                    { id: 'fade', label: 'Fade in' },
                    { id: 'slide', label: 'Slide up' },
                  ]}
                  onChange={(v) =>
                    setTheme((t) => ({
                      ...t,
                      entry_animation: v as ThemeEntryAnimation,
                    }))
                  }
                />
                <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-700">
                  <label className="flex cursor-pointer items-center gap-2 text-sm font-medium">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded text-brand-600"
                      checked={theme.show_product_badges}
                      onChange={(e) =>
                        setTheme((t) => ({ ...t, show_product_badges: e.target.checked }))
                      }
                    />
                    Exibir selos de destaque nos produtos
                  </label>
                  <p className="mt-1 text-xs text-slate-500">
                    Marque selos em{' '}
                    <Link to="/app/products" className="text-brand-600 hover:underline dark:text-brand-400">
                      Produtos
                    </Link>
                    .
                  </p>
                  {theme.show_product_badges ? (
                    <div className="mt-3">
                      <SelectField
                        id="badge-style"
                        label="Estilo do selo"
                        value={theme.badge_style}
                        options={[
                          { id: 'pill', label: 'Pílula arredondada' },
                          { id: 'ribbon', label: 'Faixa / ribbon' },
                          { id: 'minimal', label: 'Minimalista' },
                        ]}
                        onChange={(v) =>
                          setTheme((t) => ({ ...t, badge_style: v as ThemeBadgeStyle }))
                        }
                      />
                    </div>
                  ) : null}
                </div>
              </fieldset>
            </TabPanel>
          ) : null}

          {activeTab === 'extras' ? (
            <TabPanel title="Redes e confiança" description="Links sociais flutuantes no cardápio público.">
              <fieldset disabled={!theme.enabled} className="space-y-5 disabled:pointer-events-none">
                <label className="flex cursor-pointer items-center gap-2 text-sm font-medium">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded text-brand-600"
                    checked={theme.show_social_float}
                    onChange={(e) =>
                      setTheme((t) => ({ ...t, show_social_float: e.target.checked }))
                    }
                  />
                  Mostrar botões flutuantes de redes sociais
                </label>
                <Input
                  label="Instagram (URL completa)"
                  value={theme.social_instagram_url}
                  onChange={(e) =>
                    setTheme((t) => ({ ...t, social_instagram_url: e.target.value }))
                  }
                  placeholder="https://instagram.com/seurestaurante"
                  error={instagramError ?? undefined}
                />
                <Input
                  label="Facebook (URL completa)"
                  value={theme.social_facebook_url}
                  onChange={(e) =>
                    setTheme((t) => ({ ...t, social_facebook_url: e.target.value }))
                  }
                  placeholder="https://facebook.com/seurestaurante"
                  error={facebookError ?? undefined}
                />
              </fieldset>
            </TabPanel>
          ) : null}
        </div>

        {/* Rodapé fixo — salvar */}
        <footer className="shrink-0 border-t border-slate-200 bg-white/95 px-4 py-3 pb-20 backdrop-blur dark:border-slate-800 dark:bg-slate-950/95 md:px-6 lg:pb-3">
          {saveMut.isError ? (
            <p className="mb-2 text-sm text-red-600 dark:text-red-300">
              {(saveMut.error as Error).message}
            </p>
          ) : null}
          {saveMut.isSuccess ? (
            <p className="mb-2 text-sm text-emerald-700 dark:text-emerald-400">Alterações salvas.</p>
          ) : null}
          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="submit"
              loading={saveMut.isPending}
              disabled={Boolean(instagramError || facebookError)}
              className="shadow-md"
            >
              Salvar alterações
            </Button>
            <a
              href={previewHref}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 hover:underline dark:text-brand-400"
            >
              Abrir cardápio
              <ExternalLink className="h-3.5 w-3.5" aria-hidden />
            </a>
          </div>
        </footer>
      </form>

      {/* Coluna 3 — prévia fixa (desktop) */}
      <aside className="hidden w-[320px] shrink-0 border-l border-slate-200 bg-slate-100/80 dark:border-slate-800 dark:bg-slate-900/40 lg:block">
        <div className="sticky top-0 flex h-[calc(100dvh-3.5rem)] flex-col items-center justify-start gap-4 overflow-y-auto px-5 py-8">
          <p className="text-center text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Prévia em tempo real
          </p>
          <PhoneMockupPreview theme={theme} restaurantName={restaurantName} />
          <p className="max-w-[280px] text-center text-xs text-slate-500 dark:text-slate-500">
            Reflete instantaneamente cores, fontes e layout selecionados.
          </p>
        </div>
      </aside>

      {/* FAB — prévia mobile/tablet */}
      <button
        type="button"
        className="fixed bottom-6 right-6 z-40 inline-flex items-center gap-2 rounded-full bg-brand-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-600/30 transition hover:bg-brand-700 lg:hidden"
        onClick={() => setMobilePreviewOpen(true)}
        aria-label="Abrir prévia do cardápio"
      >
        <Smartphone className="h-4 w-4" aria-hidden />
        Prévia
      </button>

      {mobilePreviewOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
            aria-label="Fechar prévia"
            onClick={() => setMobilePreviewOpen(false)}
          />
          <div className="absolute inset-x-4 bottom-4 top-auto max-h-[90dvh] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl dark:border-slate-700 dark:bg-slate-900">
            <div className="mb-4 flex items-center justify-between">
              <p className="font-semibold text-slate-900 dark:text-white">Prévia do cardápio</p>
              <button
                type="button"
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                onClick={() => setMobilePreviewOpen(false)}
                aria-label="Fechar"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <PhoneMockupPreview theme={theme} restaurantName={restaurantName} />
          </div>
        </div>
      ) : null}
    </div>
  )
}

function TabPanel({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: ReactNode
}) {
  return (
    <section className="max-w-2xl">
      <h2 className="text-base font-semibold text-slate-900 dark:text-white">{title}</h2>
      <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">{description}</p>
      <div className="mt-5">{children}</div>
    </section>
  )
}

function ColorField({
  label,
  hint,
  value,
  fallback,
  onChange,
}: {
  label: string
  hint?: string
  value: string
  fallback: string
  onChange: (hex: string) => void
}) {
  return (
    <div>
      <span className="text-sm font-medium text-slate-800 dark:text-slate-200">{label}</span>
      {hint ? <p className="mt-0.5 text-xs text-slate-500">{hint}</p> : null}
      <div className="mt-2 flex items-center gap-3">
        <input
          type="color"
          value={normalizeHex(value) ?? fallback}
          onChange={(e) => onChange(e.target.value)}
          className="h-11 w-14 shrink-0 cursor-pointer rounded-lg border border-slate-200 bg-white p-1 dark:border-slate-600"
          aria-label={label}
        />
        <Input
          className="font-mono"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={fallback}
          aria-label={`${label} (hex)`}
        />
      </div>
    </div>
  )
}

function SelectField({
  id,
  label,
  hint,
  value,
  options,
  onChange,
}: {
  id: string
  label: string
  hint?: string
  value: string
  options: { id: string; label: string }[]
  onChange: (value: string) => void
}) {
  return (
    <div>
      <label htmlFor={id} className="text-sm font-medium text-slate-800 dark:text-slate-200">
        {label}
      </label>
      {hint ? <p className="mt-0.5 text-xs text-slate-500">{hint}</p> : null}
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-slate-600 dark:bg-slate-900/80 dark:text-slate-100"
      >
        {options.map((o) => (
          <option key={o.id} value={o.id}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  )
}

function SegmentField<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: T
  options: { value: T; label: string; icon?: typeof LayoutGrid }[]
  onChange: (value: T) => void
}) {
  return (
    <div>
      <span className="text-sm font-medium text-slate-800 dark:text-slate-200">{label}</span>
      <div className="mt-2 inline-flex flex-wrap gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1 dark:border-slate-700 dark:bg-slate-900/50">
        {options.map((opt) => {
          const Icon = opt.icon
          const active = value === opt.value
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange(opt.value)}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition ${
                active
                  ? 'bg-white text-brand-800 shadow-sm ring-1 ring-slate-200 dark:bg-slate-800 dark:text-brand-200 dark:ring-slate-600'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
              aria-pressed={active}
            >
              {Icon ? <Icon className="h-3.5 w-3.5" aria-hidden /> : null}
              {opt.label}
            </button>
          )
        })}
      </div>
    </div>
  )
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
          <h1 className="text-xl font-semibold text-slate-900 dark:text-white">
            Personalização indisponível
          </h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            Seu plano atual não permite personalizar o cardápio. Faça upgrade para Pro ou Enterprise.
          </p>
          <Link
            to="/app/plans"
            className="mt-4 inline-flex text-sm font-medium text-brand-600 hover:underline"
          >
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
      restaurantName={restaurant.name}
      initial={initial}
    />
  )
}
