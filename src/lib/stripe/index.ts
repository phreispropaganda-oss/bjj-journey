import Stripe from 'stripe'

// MICHI Etapa 11 — Stripe (codado, gated por feature flag)
// Para ATIVAR em prod: setar NEXT_PUBLIC_STRIPE_ENABLED=true + STRIPE_SECRET_KEY + STRIPE_WEBHOOK_SECRET

export const STRIPE_ENABLED =
  process.env.NEXT_PUBLIC_STRIPE_ENABLED === 'true' &&
  !!process.env.STRIPE_SECRET_KEY

export const stripe = STRIPE_ENABLED
  ? new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2025-02-24.acacia' })
  : (null as unknown as Stripe)

export const PLANS = {
  pro: {
    monthly: process.env.STRIPE_PRO_MONTHLY_PRICE_ID ?? 'price_pro_monthly',
    annual:  process.env.STRIPE_PRO_ANNUAL_PRICE_ID  ?? 'price_pro_annual',
    amount:  2900,
    name:    'Pro',
    trialDays: 14,
    features: [
      'Treinos ilimitados',
      'Histórico completo + heatmap',
      'Wrapped + stories sem marca d\'água',
      'Radar 8 eixos + records personais',
      'Sem anúncios',
    ],
  },
  academy: {
    monthly: process.env.STRIPE_ACADEMY_MONTHLY_PRICE_ID ?? 'price_academy_monthly',
    annual:  process.env.STRIPE_ACADEMY_ANNUAL_PRICE_ID  ?? 'price_academy_annual',
    amount:  9900,
    name:    'Academia',
    trialDays: 14,
    features: [
      'Alunos ilimitados (free: 10)',
      'Dashboard professor + presença',
      'Verificação de graduações',
      'QR code de check-in',
      'Suporte prioritário',
    ],
  },
} as const

export type PlanKey = keyof typeof PLANS
