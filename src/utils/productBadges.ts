import type { ProductHighlightBadge } from '@/types/database'
import type { ThemeBadgeStyle } from '@/types/theme'

export const HIGHLIGHT_BADGE_OPTIONS: {
  value: ProductHighlightBadge | ''
  label: string
}[] = [
  { value: '', label: 'Nenhum' },
  { value: 'new', label: '✨ Novo' },
  { value: 'bestseller', label: '🔥 Mais pedido' },
  { value: 'special', label: '🏆 Especialidade da casa' },
]

const BADGE_LABELS: Record<NonNullable<ProductHighlightBadge>, string> = {
  new: '✨ Novo',
  bestseller: '🔥 Mais pedido',
  special: '🏆 Especialidade',
}

export function getHighlightBadgeLabel(badge: ProductHighlightBadge): string | null {
  if (!badge) return null
  return BADGE_LABELS[badge] ?? null
}

export function badgeStyleClasses(style: ThemeBadgeStyle): string {
  switch (style) {
    case 'ribbon':
      return 'rounded-sm px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide shadow-sm'
    case 'minimal':
      return 'rounded px-1.5 py-0.5 text-[10px] font-medium opacity-90'
    default:
      return 'rounded-full px-2.5 py-0.5 text-[10px] font-semibold shadow-sm'
  }
}
