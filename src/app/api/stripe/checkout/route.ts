import { NextResponse } from 'next/server'
import { stripe, PLANS, STRIPE_ENABLED, type PlanKey } from '@/lib/stripe'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  if (!STRIPE_ENABLED) {
    return NextResponse.json({ error: 'stripe_disabled' }, { status: 503 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => ({})) as {
    plan?: PlanKey; period?: 'monthly' | 'annual'
  }
  const plan = body.plan ?? 'pro'
  const period = body.period ?? 'monthly'
  const priceId = PLANS[plan]?.[period]
  if (!priceId) return NextResponse.json({ error: 'invalid_plan' }, { status: 400 })

  const { data: sub } = await supabase
    .from('subscriptions').select('stripe_customer_id').eq('user_id', user.id).maybeSingle()
  const existingCustomerId = (sub as { stripe_customer_id: string | null } | null)?.stripe_customer_id ?? null

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${appUrl}/pricing/sucesso?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url:  `${appUrl}/pricing`,
    customer:    existingCustomerId ?? undefined,
    customer_email: existingCustomerId ? undefined : user.email,
    subscription_data: {
      trial_period_days: PLANS[plan].trialDays,
      metadata: { user_id: user.id, plan },
    },
    metadata: { user_id: user.id, plan },
    allow_promotion_codes: true,
  })

  return NextResponse.json({ url: session.url })
}
