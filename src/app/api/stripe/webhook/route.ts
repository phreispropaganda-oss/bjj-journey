import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { stripe, STRIPE_ENABLED } from '@/lib/stripe'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import type Stripe from 'stripe'

export const runtime = 'nodejs'

function admin() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
}

export async function POST(req: Request) {
  if (!STRIPE_ENABLED) return NextResponse.json({ received: true, disabled: true })

  const sig = (await headers()).get('stripe-signature')
  const secret = process.env.STRIPE_WEBHOOK_SECRET
  if (!sig || !secret) return NextResponse.json({ error: 'no_sig' }, { status: 400 })

  const raw = await req.text()
  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(raw, sig, secret)
  } catch (e) {
    return NextResponse.json({ error: 'invalid_sig', detail: (e as Error).message }, { status: 400 })
  }

  const db = admin()

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const s = event.data.object as Stripe.Checkout.Session
        const userId = s.metadata?.user_id
        const plan = s.metadata?.plan
        if (!userId || !plan) break
        await db.from('subscriptions').upsert({
          user_id: userId,
          stripe_customer_id: s.customer as string,
          stripe_subscription_id: s.subscription as string,
          plan,
          status: 'trialing',
        }, { onConflict: 'user_id' })
        break
      }
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.trial_will_end': {
        const sub = event.data.object as Stripe.Subscription
        const userId = sub.metadata?.user_id
        if (!userId) break
        await db.from('subscriptions').upsert({
          user_id: userId,
          stripe_customer_id: sub.customer as string,
          stripe_subscription_id: sub.id,
          plan: sub.metadata?.plan ?? 'pro',
          status: sub.status,
          current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
          trial_ends_at: sub.trial_end ? new Date(sub.trial_end * 1000).toISOString() : null,
          cancel_at_period_end: sub.cancel_at_period_end,
        }, { onConflict: 'user_id' })
        break
      }
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription
        const userId = sub.metadata?.user_id
        if (!userId) break
        await db.from('subscriptions').update({
          status: 'canceled',
          cancel_at_period_end: false,
        }).eq('user_id', userId)
        break
      }
      case 'invoice.payment_failed': {
        const inv = event.data.object as Stripe.Invoice
        const sub = inv.subscription as string | null
        if (!sub) break
        await db.from('subscriptions').update({ status: 'past_due' }).eq('stripe_subscription_id', sub)
        break
      }
    }
  } catch (e) {
    console.error('[stripe webhook]', event.type, (e as Error).message)
    return NextResponse.json({ error: 'handler_failed' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
