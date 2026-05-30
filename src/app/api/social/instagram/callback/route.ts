import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  INSTAGRAM_ENABLED,
  exchangeCodeForToken, exchangeForLongLivedToken,
} from '@/lib/social/instagram'

export const runtime = 'nodejs'

export async function GET(req: Request) {
  if (!INSTAGRAM_ENABLED) {
    return NextResponse.redirect(new URL('/profile?ig=disabled', req.url))
  }

  const url = new URL(req.url)
  const code = url.searchParams.get('code')
  if (!code) return NextResponse.redirect(new URL('/profile?ig=error', req.url))

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.redirect(new URL('/login', req.url))

  try {
    const short = await exchangeCodeForToken(code)
    const long  = await exchangeForLongLivedToken(short.access_token)
    const expiresAt = new Date(Date.now() + long.expires_in * 1000).toISOString()

    await (supabase.from('social_connections') as ReturnType<typeof supabase.from>).upsert({
      user_id:      user.id,
      provider:     'instagram',
      external_id:  short.user_id,
      access_token: long.access_token,
      expires_at:   expiresAt,
      status:       'connected',
      connected_at: new Date().toISOString(),
    } as never, { onConflict: 'user_id,provider' } as never)

    return NextResponse.redirect(new URL('/profile?ig=connected', req.url))
  } catch {
    return NextResponse.redirect(new URL('/profile?ig=error', req.url))
  }
}
