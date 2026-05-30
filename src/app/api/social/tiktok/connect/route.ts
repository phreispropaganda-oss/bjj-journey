import { NextResponse } from 'next/server'
import { buildAuthorizeUrl, TIKTOK_ENABLED } from '@/lib/social/tiktok'
import { createClient } from '@/lib/supabase/server'
import { randomBytes } from 'crypto'

export const runtime = 'nodejs'

export async function GET() {
  if (!TIKTOK_ENABLED) return NextResponse.json({ error: 'tiktok_disabled' }, { status: 503 })
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const state = randomBytes(16).toString('hex')
  const url = buildAuthorizeUrl(state)
  const res = NextResponse.redirect(url)
  res.cookies.set('tt_oauth_state', state, { httpOnly: true, secure: true, sameSite: 'lax', maxAge: 600 })
  return res
}
