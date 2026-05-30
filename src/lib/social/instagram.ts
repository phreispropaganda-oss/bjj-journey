// MICHI Instagram integration (Meta Graph API — Direct Login, July 2024+)
//
// Status: scaffolding completo, mas DESATIVADO em prod ate aprovacao do app
// pela Meta. Variaveis de ambiente controlam ativacao.
//
// Restricoes (PRD):
// - Conta Business ou Creator (nao funciona com pessoal)
// - Tokens de longa duracao: 60 dias — refresh manual a cada 50d
// - 25 posts via API por conta / 24h
// - Somente JPEG; rate limit 200 chamadas / hora / usuario
// - Publicacao requer App Review da Meta antes da producao
//
// Variaveis necessarias:
// INSTAGRAM_CLIENT_ID, INSTAGRAM_CLIENT_SECRET
// NEXT_PUBLIC_APP_URL (callback: /api/social/instagram/callback)

export const IG_SCOPES = ['instagram_business_basic', 'instagram_business_content_publish'].join(',')

export const INSTAGRAM_ENABLED =
  !!process.env.INSTAGRAM_CLIENT_ID && !!process.env.INSTAGRAM_CLIENT_SECRET

export function buildAuthorizeUrl(state: string): string {
  if (!INSTAGRAM_ENABLED) throw new Error('instagram_disabled')
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const params = new URLSearchParams({
    client_id:     process.env.INSTAGRAM_CLIENT_ID!,
    redirect_uri:  `${appUrl}/api/social/instagram/callback`,
    response_type: 'code',
    scope:         IG_SCOPES,
    state,
  })
  return `https://www.instagram.com/oauth/authorize?${params}`
}

interface ShortLivedToken { access_token: string; user_id: string }
export async function exchangeCodeForToken(code: string): Promise<ShortLivedToken> {
  if (!INSTAGRAM_ENABLED) throw new Error('instagram_disabled')
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const body = new URLSearchParams({
    client_id:     process.env.INSTAGRAM_CLIENT_ID!,
    client_secret: process.env.INSTAGRAM_CLIENT_SECRET!,
    grant_type:    'authorization_code',
    redirect_uri:  `${appUrl}/api/social/instagram/callback`,
    code,
  })
  const r = await fetch('https://api.instagram.com/oauth/access_token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  })
  if (!r.ok) throw new Error(`ig_token_exchange_failed_${r.status}`)
  return r.json() as Promise<ShortLivedToken>
}

interface LongLivedToken { access_token: string; token_type: string; expires_in: number }
export async function exchangeForLongLivedToken(shortToken: string): Promise<LongLivedToken> {
  if (!INSTAGRAM_ENABLED) throw new Error('instagram_disabled')
  const url = new URL('https://graph.instagram.com/access_token')
  url.searchParams.set('grant_type', 'ig_exchange_token')
  url.searchParams.set('client_secret', process.env.INSTAGRAM_CLIENT_SECRET!)
  url.searchParams.set('access_token', shortToken)
  const r = await fetch(url)
  if (!r.ok) throw new Error(`ig_long_lived_failed_${r.status}`)
  return r.json() as Promise<LongLivedToken>
}

export async function refreshLongLivedToken(token: string): Promise<LongLivedToken> {
  const url = new URL('https://graph.instagram.com/refresh_access_token')
  url.searchParams.set('grant_type', 'ig_refresh_token')
  url.searchParams.set('access_token', token)
  const r = await fetch(url)
  if (!r.ok) throw new Error(`ig_refresh_failed_${r.status}`)
  return r.json() as Promise<LongLivedToken>
}

// Publicar foto feed (1080x1080) — 2 etapas: criar container + publicar
export async function publishFeedPost(igUserId: string, accessToken: string, imageUrl: string, caption: string) {
  const c = await fetch(`https://graph.instagram.com/v21.0/${igUserId}/media`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image_url: imageUrl, caption, access_token: accessToken }),
  })
  const container = await c.json() as { id?: string; error?: { message: string } }
  if (!container.id) throw new Error(container.error?.message ?? 'container_failed')

  const p = await fetch(`https://graph.instagram.com/v21.0/${igUserId}/media_publish`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ creation_id: container.id, access_token: accessToken }),
  })
  return p.json()
}

// Story (1080x1920 JPEG)
export async function publishStory(igUserId: string, accessToken: string, imageUrl: string) {
  const c = await fetch(`https://graph.instagram.com/v21.0/${igUserId}/media`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image_url: imageUrl, media_type: 'STORIES', access_token: accessToken }),
  })
  const container = await c.json() as { id?: string; error?: { message: string } }
  if (!container.id) throw new Error(container.error?.message ?? 'story_container_failed')

  const p = await fetch(`https://graph.instagram.com/v21.0/${igUserId}/media_publish`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ creation_id: container.id, access_token: accessToken }),
  })
  return p.json()
}
