import type { ProductHighlightBadge } from '@/types/database'
import type { ThemeBadgeStyle } from '@/types/theme'
import { badgeStyleClasses, getHighlightBadgeLabel } from '@/utils/productBadges'

type ProductHighlightBadgeProps = {
  badge: ProductHighlightBadge
  accentColor: string
  accentFg: string
  style: ThemeBadgeStyle
  className?: string
}

export function ProductHighlightBadgeView({
  badge,
  accentColor,
  accentFg,
  style,
  className = '',
}: ProductHighlightBadgeProps) {
  const label = getHighlightBadgeLabel(badge)
  if (!label) return null

  return (
    <span
      className={`inline-block ${badgeStyleClasses(style)} ${className}`}
      style={{ backgroundColor: accentColor, color: accentFg }}
    >
      {label}
    </span>
  )
}
