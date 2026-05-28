import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import type { Database } from '@/lib/supabase/types'

// Route Handler for Google OAuth — avoids PKCE cookie loss that
// happens when a Server Action calls redirect() before the browser
// can store the code_verifier cookie.
export async function GET(request: NextRequest) {
  const origin = new URL(request.url).origin

  // Build the response that will carry the code_verifier cookie
  // We don't know the redirect URL yet, so use a temporary one
  const tempResponse = NextResponse.redirect(new URL('/login', origin))

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
            tempResponse.cookies.set(name, value, options as Parameters<typeof tempResponse.cookies.set>[2])
          })
        },
      },
    }
  )

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
    },
  })

  if (error || !data.url) {
    return NextResponse.redirect(new URL('/login?error=oauth_failed', origin))
  }

  // Redirect to Google/Supabase authorize URL WITH the code_verifier cookie set
  const response = NextResponse.redirect(data.url)

  // Copy all cookies (including code_verifier) to the redirect response
  tempResponse.cookies.getAll().forEach(({ name, value, ...rest }) => {
    response.cookies.set(name, value, rest as Parameters<typeof response.cookies.set>[2])
  })

  return response
}
