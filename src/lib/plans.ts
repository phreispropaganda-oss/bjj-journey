// Belt Rise plan definitions
// Free: Faixa Branca only
// Pro / Academy: all belts

export type PlanType = 'free' | 'pro' | 'academy'

export const FREE_BELTS = ['white'] as const

export function canAccessBelt(plan: PlanType, beltId: string): boolean {
  if (plan === 'pro' || plan === 'academy') return true
  return FREE_BELTS.includes(beltId as 'white')
}

export const PLAN_LABELS: Record<PlanType, string> = {
  free: 'Gratuito',
  pro: 'Pro',
  academy: 'Academia',
}

export const PRO_PRICE = { monthly: 1900, annual: 14900 } // centavos
