import type { RestaurantTheme } from '@/types/theme'
import {
  pickCardBorder,
  resolvedPublicTheme,
  themeFontStack,
  themeLogoAlignClass,
  themeLogoShapeClass,
} from '@/utils/menuTheme'

type ThemedMenuHeaderProps = {
  theme: RestaurantTheme
  restaurantName: string
  compact?: boolean
}

/** Cabeçalho do cardápio público com banner, logo e alinhamento. */
export function ThemedMenuHeader({ theme, restaurantName, compact = false }: ThemedMenuHeaderProps) {
  const rt = resolvedPublicTheme(theme)
  const headingFont = themeFontStack(theme.heading_font_family)
  const showLogo = theme.header_display === 'logo' && Boolean(theme.logo_url)
  const align = themeLogoAlignClass(theme.logo_align)
  const shape = themeLogoShapeClass(theme.logo_shape)
  const logoW = Math.min(200, Math.max(50, theme.logo_size))

  return (
    <div
      className="border-b backdrop-blur-md"
      style={{
        borderColor: pickCardBorder(theme.background_color),
        backgroundColor: `${theme.background_color}f0`,
      }}
    >
      {theme.header_banner_url ? (
        <div className={`relative w-full overflow-hidden ${compact ? 'h-20' : 'h-28'}`}>
          <img
            src={theme.header_banner_url}
            alt=""
            className="h-full w-full object-cover"
          />
          <div
            className="absolute inset-0 bg-gradient-to-b from-black/10 to-transparent"
            aria-hidden
          />
        </div>
      ) : null}
      <div className={`flex px-4 py-3 ${align} ${compact ? 'py-2' : 'py-4'}`}>
        <div className="max-w-full">
          <p
            className={`font-semibold uppercase tracking-[0.2em] ${compact ? 'text-[8px]' : 'text-[11px]'}`}
            style={{ color: theme.accent_color, fontFamily: headingFont }}
          >
            Cardápio digital
          </p>
          {showLogo && theme.logo_url ? (
            <div className={`mt-2 flex ${align}`}>
              <img
                src={theme.logo_url}
                alt={restaurantName}
                className={`object-contain ${shape}`}
                style={{ width: logoW, maxWidth: '100%', height: 'auto', maxHeight: logoW * 0.6 }}
              />
            </div>
          ) : (
            <h1
              className={`mt-0.5 font-bold tracking-tight ${compact ? 'text-base' : 'text-2xl'}`}
              style={{ color: rt.effective_text_color, fontFamily: headingFont }}
            >
              {restaurantName}
            </h1>
          )}
        </div>
      </div>
    </div>
  )
}
