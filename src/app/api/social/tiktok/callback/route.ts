import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { TIKTOK_ENABLED, exchangeCodeForToken } from '@/lib/social/tiktok'

export const runtime = 'nodejs'

export async function GET(req: Request) {
  if (!TIKTOK_ENABLED) {
    return NextResponse.redirect(new URL('/profile?tt=disabled', req.url))
  }

  const url = new URL(req.url)
  const code = url.searchParams.get('code')
  if (!code) return NextResponse.redirect(new URL('/profile?tt=error', req.url))

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.redirect(new URL('/login', req.url))

  try {
    const token = await exchangeCodeForToken(code)
    const expiresAt = new Date(Date.now() + token.expires_in * 1000).toISOString()

    await (supabase.from('social_connections') as ReturnType<typeof supabase.from>).upsert({
      user_id:       user.id,
      provider:      'tiktok',
      external_id:   token.open_id,
      access_token:  token.access_token,
      refresh_token: token.refresh_token,
      expires_at:    expiresAt,
      scope:         token.scope,
      status:        'connected',
      connected_at:  new Date().toISOString(),
    } as never, { onConflict: 'user_id,provider' } as never)

    return NextResponse.redirect(new URL('/profile?tt=connected', req.url))
  } catch {
    return NextResponse.redirect(new URL('/profile?tt=error', req.url))
  }
}
