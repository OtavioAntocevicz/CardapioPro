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
    label: 'Categorias, produtos e fotos',
    free: true,
    pro: true,
    enterprise: true,
  },
  {
    label: 'PWA (instalar no celular) e tema claro/escuro',
    free: true,
    pro: true,
    enterprise: true,
  },
  {
    label: 'Um restaurante por conta',
    free: true,
    pro: true,
    enterprise: true,
  },
  {
    label: 'Suporte',
    free: 'Documentação e autoatendimento',
    pro: 'E-mail comercial (até 2 dias úteis)',
    enterprise: 'Canal dedicado e SLA em contrato',
  },
  {
    label: 'Novidades e melhorias do produto',
    free: 'Acesso quando lançadas',
    pro: 'Prioridade em novos recursos e betas',
    enterprise: 'Roadmap alinhado ao seu negócio',
  },
  {
    label: 'Personalização e marca',
    free: 'Experiência CardápioPro',
    pro: 'Mais opções de identidade (em evolução)',
    enterprise: 'White-label, domínio e integrações sob medida',
  },
  {
    label: 'Volume e operações',
    free: 'Ideal para cardápios enxutos',
    pro: 'Pensado para alto volume de itens e atualizações',
    enterprise: 'Múltiplas unidades e processos (sob consulta)',
  },
]
