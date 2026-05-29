import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import type { Database } from '@/lib/supabase/types'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  // Validate next is a relative path to prevent open redirect
  const rawNext = searchParams.get('next') ?? '/dashboard'
  const next = rawNext.startsWith('/') && !rawNext.startsWith('//') ? rawNext : '/dashboard'

  if (!code) {
    return NextResponse.redirect(new URL('/login?error=auth_failed', origin))
  }

  // Build the redirect response first so we can set cookies directly on it
  const redirectUrl = new URL(next, origin)
  const response = NextResponse.redirect(redirectUrl)

  // Create Supabase client that reads from request cookies
  // and writes directly onto the redirect response
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
            response.cookies.set(name, value, options as Parameters<typeof response.cookies.set>[2])
          })
        },
      },
    }
  )

  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    return NextResponse.redirect(new URL('/login?error=auth_failed', origin))
  }

  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    const { data: profileData } = await supabase
      .from('profiles')
      .select('onboarded_at, belt_id')
      .eq('id', user.id)
      .single()

    const profile = profileData as { onboarded_at: string | null; belt_id: string | null } | null

    // Always send to onboarding until user explicitly completes it
    if (!profile?.onboarded_at) {
      const onboardUrl = new URL('/onboarding', origin)
      const onboardResponse = NextResponse.redirect(onboardUrl)
      response.cookies.getAll().forEach(({ name, value, ...rest }) => {
        onboardResponse.cookies.set(name, value, rest as Parameters<typeof onboardResponse.cookies.set>[2])
      })
      return onboardResponse
    }
  }

  return response
}
