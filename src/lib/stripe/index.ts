import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-02-24.acacia',
})

export const PLANS = {
  pro: {
    monthly: process.env.STRIPE_PRO_MONTHLY_PRICE_ID ?? 'price_pro_monthly',
    annual: process.env.STRIPE_PRO_ANNUAL_PRICE_ID ?? 'price_pro_annual',
    amount: 2900, name: 'Pro',
  },
  academy: {
    monthly: process.env.STRIPE_ACADEMY_MONTHLY_PRICE_ID ?? 'price_academy_monthly',
    annual: process.env.STRIPE_ACADEMY_ANNUAL_PRICE_ID ?? 'price_academy_annual',
    amount: 9900, name: 'Academia',
  },
} as const

export type PlanKey = keyof typeof PLANS
