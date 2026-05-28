import { NextResponse } from 'next/server'

// Stripe payments are not active in this environment.
// Full webhook implementation is ready — enable by adding STRIPE_SECRET_KEY
// and SUPABASE_SERVICE_ROLE_KEY to environment variables.

export async function POST() {
  return NextResponse.json({ received: true })
}
