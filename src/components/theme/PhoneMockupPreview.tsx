import type { RestaurantTheme } from '@/types/theme'
import { ThemeMenuPreview } from './ThemeMenuPreview'

type PhoneMockupPreviewProps = {
  theme: RestaurantTheme
  restaurantName?: string
  className?: string
}

const PHONE_WIDTH = 280
const PHONE_VIEWPORT_HEIGHT = 520

/** Moldura de celular com prévia do cardápio público (tamanho fixo). */
export function PhoneMockupPreview({
  theme,
  restaurantName,
  className = '',
}: PhoneMockupPreviewProps) {
  return (
    <div
      className={`mx-auto shrink-0 ${className}`}
      style={{ width: PHONE_WIDTH }}
    >
      <div className="rounded-[2.75rem] border-[11px] border-slate-900 bg-slate-900 p-2 shadow-2xl shadow-slate-900/25 ring-1 ring-slate-800/50 dark:border-slate-700 dark:shadow-black/40">
        <div className="overflow-hidden rounded-[2rem] bg-slate-100">
          <div className="flex items-center justify-center bg-slate-900 py-2">
            <div className="h-1.5 w-20 rounded-full bg-slate-700" aria-hidden />
          </div>
          <div
            className="overflow-y-auto overflow-x-hidden overscroll-contain [-ms-overflow-style:none] [scrollbar-width:thin]"
            style={{ height: PHONE_VIEWPORT_HEIGHT }}
          >
            <ThemeMenuPreview
              theme={theme}
              frame="mobile"
              restaurantName={restaurantName}
              embedded
            />
          </div>
          <div className="flex justify-center bg-slate-900 py-2">
            <div className="h-1 w-24 rounded-full bg-slate-700" aria-hidden />
          </div>
        </div>
      </div>
    </div>
  )
}
