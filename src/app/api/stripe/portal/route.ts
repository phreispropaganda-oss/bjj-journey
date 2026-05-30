import { NextResponse } from 'next/server'
import { stripe, STRIPE_ENABLED } from '@/lib/stripe'
import { createClient } from '@/lib/supabase/server'

export async function POST() {
  if (!STRIPE_ENABLED) return NextResponse.json({ error: 'stripe_disabled' }, { status: 503 })

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const { data: sub } = await supabase.from('subscriptions')
    .select('stripe_customer_id').eq('user_id', user.id).maybeSingle()
  const customerId = (sub as { stripe_customer_id: string | null } | null)?.stripe_customer_id
  if (!customerId) return NextResponse.json({ error: 'no_customer' }, { status: 404 })

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${appUrl}/profile`,
  })
  return NextResponse.json({ url: session.url })
}
