import { createClient } from '@/lib/supabase/server'
import { STRIPE_ENABLED } from './index'

// Quando Stripe está desativado, todos contam como Pro (free unlocked everything).
// Quando ativado, consulta subscription real.

export async function isPro(userId: string): Promise<boolean> {
  if (!STRIPE_ENABLED) return true

  const supabase = await createClient()
  const { data } = await (supabase as unknown as {
    rpc: (n: string, p: Record<string, string>) => Promise<{ data: boolean | null }>
  }).rpc('is_user_pro', { p_uid: userId })
  return data ?? false
}

export async function planFor(userId: string): Promise<'free' | 'pro' | 'academy'> {
  if (!STRIPE_ENABLED) return 'pro'
  const supabase = await createClient()
  const { data } = await supabase
    .from('subscriptions')
    .select('plan, status, current_period_end')
    .eq('user_id', userId)
    .maybeSingle()
  const sub = data as { plan: string; status: string; current_period_end: string | null } | null
  if (!sub) return 'free'
  if (!['trialing', 'active'].includes(sub.status)) return 'free'
  if (sub.current_period_end && new Date(sub.current_period_end) < new Date()) return 'free'
  return (sub.plan as 'pro' | 'academy')
}
