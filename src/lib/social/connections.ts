import { createClient } from '@/lib/supabase/server'

export type Provider = 'instagram' | 'tiktok'

export interface SocialConnection {
  provider:     Provider
  external_id:  string | null
  username:     string | null
  status:       'connected' | 'expired' | 'revoked'
  expires_at:   string | null
  connected_at: string
}

export async function getConnection(provider: Provider): Promise<SocialConnection | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase
    .from('social_connections')
    .select('provider, external_id, username, status, expires_at, connected_at')
    .eq('user_id', user.id).eq('provider', provider).maybeSingle()
  return data as SocialConnection | null
}

export async function disconnect(provider: Provider) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'unauthorized' }
  const { error } = await supabase.from('social_connections' as never)
    .delete().match({ user_id: user.id, provider } as never)
  if (error) return { error: error.message }
  return { ok: true }
}
