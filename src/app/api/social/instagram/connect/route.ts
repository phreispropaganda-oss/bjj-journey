import { NextResponse } from 'next/server'
import { buildAuthorizeUrl, INSTAGRAM_ENABLED } from '@/lib/social/instagram'
import { createClient } from '@/lib/supabase/server'
import { randomBytes } from 'crypto'

export const runtime = 'nodejs'

export async function GET() {
  if (!INSTAGRAM_ENABLED) return NextResponse.json({ error: 'instagram_disabled' }, { status: 503 })

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  // state precisa ser persistido para validar no callback (cookie)
  const state = randomBytes(16).toString('hex')
  const url = buildAuthorizeUrl(state)

  const res = NextResponse.redirect(url)
  res.cookies.set('ig_oauth_state', state, { httpOnly: true, secure: true, sameSite: 'lax', maxAge: 600 })
  return res
}
