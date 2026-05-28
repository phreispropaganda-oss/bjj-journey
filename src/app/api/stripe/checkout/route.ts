import { NextResponse } from 'next/server'
import { stripe, PLANS } from '@/lib/stripe'
import { createClient } from '@/lib/supabase/server'
import type { PlanKey } from '@/lib/stripe'

export async function POST(req: Request) {
  const supabase = await createClient()
  return NextResponse.json({ url: null })
}
