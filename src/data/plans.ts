import type { Plan } from '@/types/database'

export const PLAN_ORDER: Plan[] = ['free', 'pro', 'enterprise']

export type PlanMarketing = {
  id: Plan
  name: string
  tagline: string
  priceLabel: string
  priceNote: string
}

export const PLAN_MARKETING: Record<Plan, PlanMarketing> = {
  free: {
    id: 'free',
    name: 'Free',
    tagline: 'Começar sem custo',
    priceLabel: 'R$ 0',
    priceNote: 'Para testar e publicar seu primeiro cardápio.',
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    tagline: 'Operação no dia a dia',
    priceLabel: 'Em breve',
    priceNote: 'Assinatura mensal com benefícios extras para quem escala.',
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    tagline: 'Redes e franquias',
    priceLabel: 'Sob consulta',
    priceNote: 'Contrato, integrações e suporte dedicado.',
  },
}

/** Linhas da tabela comparativa (✓ = incluído). */
export const PLAN_COMPARISON_ROWS: {
  label: string
  free: boolean | string
  pro: boolean | string
  enterprise: boolean | string
}[] = [
  {
    label: 'Cardápio público com link próprio (/m/seu-slug)',
    free: true,
    pro: true,
    enterprise: true,
  },
  {
    label: 'Restaurantes por conta',
    free: '1',
    pro: '1',
    enterprise: '3',
  },
  {
    label: 'Cardápios por restaurante',
    free: '1',
    pro: '3',
    enterprise: '3',
  },
  {
    label: 'Categorias por cardápio',
    free: '3',
    pro: '5',
    enterprise: '10',
  },
  {
    label: 'Produtos por categoria',
    free: '5',
    pro: '10',
    enterprise: '30',
  },
  {
    label: 'QR Code para impressão',
    free: false,
    pro: true,
    enterprise: true,
  },
  {
    label: 'Personalização de cardápio',
    free: false,
    pro: true,
    enterprise: true,
  },
  {
    label: 'Experiência de marca',
    free: 'Visual padrão CardápioPro',
    pro: 'Tema customizável',
    enterprise: 'Tema customizável + extras futuros',
  },
  {
    label: 'Suporte',
    free: 'Base de ajuda',
    pro: 'Atendimento comercial',
    enterprise: 'Atendimento prioritário',
  },
]
