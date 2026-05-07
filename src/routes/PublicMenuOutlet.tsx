import { lazy } from 'react'
import { useParams } from 'react-router-dom'

/** Remontá-lo ao mudar o slug garante estado limpo (categorias/visualização). */
const PublicMenuPage = lazy(() =>
  import('@/pages/public/PublicMenuPage').then((m) => ({ default: m.PublicMenuPage })),
)

export function PublicMenuOutlet() {
  const { slug } = useParams<{ slug: string }>()
  return <PublicMenuPage key={slug ?? ''} />
}
