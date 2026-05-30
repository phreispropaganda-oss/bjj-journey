// MICHI TikTok integration
//
// Status: Share Kit (download + abrir TikTok) funcional sem aprovacao;
//         Content Posting API (Direct Post) requer aprovacao do app.
//
// Variaveis necessarias para OAuth:
// TIKTOK_CLIENT_KEY, TIKTOK_CLIENT_SECRET, NEXT_PUBLIC_APP_URL

export const TIKTOK_ENABLED =
  !!process.env.TIKTOK_CLIENT_KEY && !!process.env.TIKTOK_CLIENT_SECRET

export const TIKTOK_SCOPES = ['user.info.basic', 'video.upload'].join(',')

export function buildAuthorizeUrl(state: string): string {
  if (!TIKTOK_ENABLED) throw new Error('tiktok_disabled')
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const params = new URLSearchParams({
    client_key:    process.env.TIKTOK_CLIENT_KEY!,
    redirect_uri:  `${appUrl}/api/social/tiktok/callback`,
    response_type: 'code',
    scope:         TIKTOK_SCOPES,
    state,
  })
  return `https://www.tiktok.com/v2/auth/authorize?${params}`
}

interface TokenResponse {
  access_token: string
  refresh_token: string
  expires_in: number
  refresh_expires_in: number
  open_id: string
  scope: string
  token_type: string
}

export async function exchangeCodeForToken(code: string): Promise<TokenResponse> {
  if (!TIKTOK_ENABLED) throw new Error('tiktok_disabled')
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const body = new URLSearchParams({
    client_key:    process.env.TIKTOK_CLIENT_KEY!,
    client_secret: process.env.TIKTOK_CLIENT_SECRET!,
    code,
    grant_type:    'authorization_code',
    redirect_uri:  `${appUrl}/api/social/tiktok/callback`,
  })
  const r = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  })
  if (!r.ok) throw new Error(`tiktok_token_exchange_failed_${r.status}`)
  return r.json() as Promise<TokenResponse>
}

export async function refreshToken(refresh: string): Promise<TokenResponse> {
  if (!TIKTOK_ENABLED) throw new Error('tiktok_disabled')
  const body = new URLSearchParams({
    client_key:    process.env.TIKTOK_CLIENT_KEY!,
    client_secret: process.env.TIKTOK_CLIENT_SECRET!,
    refresh_token: refresh,
    grant_type:    'refresh_token',
  })
  const r = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  })
  if (!r.ok) throw new Error(`tiktok_refresh_failed_${r.status}`)
  return r.json() as Promise<TokenResponse>
}

// Direct Post via Content Posting API (requer aprovacao Meta TikTok app review)
interface DirectPostInit {
  post_info: { title: string; privacy_level: 'PUBLIC_TO_EVERYONE' | 'SELF_ONLY'; is_ai_generated?: boolean }
  source_info: { source: 'PULL_FROM_URL'; video_url: string }
}
export async function initDirectPost(accessToken: string, input: DirectPostInit) {
  const r = await fetch('https://open.tiktokapis.com/v2/post/publish/video/init/', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  })
  return r.json() as Promise<{ data?: { publish_id: string }; error?: { code: string; message: string } }>
}

// Status do post (polling)
export async function getPublishStatus(accessToken: string, publishId: string) {
  const r = await fetch(`https://open.tiktokapis.com/v2/post/publish/status/fetch/?publish_id=${publishId}`, {
    headers: { 'Authorization': `Bearer ${accessToken}` },
  })
  return r.json()
}

// Share Kit (client-side, sem API): tenta abrir o app TikTok pelo schema
// e a foto/video ja baixado deve ser selecionado pelo usuario
export function openTikTokAppForShare(): void {
  // tiktok:// schema (mobile) ou web fallback
  const isMobile = /android|iphone|ipad/i.test(navigator.userAgent)
  if (isMobile) {
    window.location.href = 'snssdk1233://'
    setTimeout(() => { window.location.href = 'https://www.tiktok.com/upload' }, 1500)
  } else {
    window.open('https://www.tiktok.com/upload', '_blank')
  }
}
