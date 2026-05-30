import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DashboardClient } from '@/components/dashboard/DashboardClient'
import type { Database } from '@/lib/supabase/types'

type Profile = Database['public']['Tables']['profiles']['Row']

// PRD §3 — Fighter Card data shapes
interface XPProgress {
  total_minutes: number; total_hours: number; current_level: number
  level_start_min: number; next_level_min: number
  minutes_in_level: number; minutes_to_next: number; level_progress_pct: number
}
interface RadarPoint { category: string; score: number; raw_count: number }
interface PersonalRecord {
  longest_streak_days: number
  longest_session_min: number; longest_session_date: string | null
  most_subs_week: number; most_subs_week_start: string | null
  first_training_date: string | null
  most_active_month: string | null; most_active_month_count: number
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profileRaw, error: profileError } = await supabase
    .from('profiles').select('*').eq('id', user.id).single()
  if (profileError || !profileRaw) redirect('/onboarding')
  const profile = profileRaw as Profile & { onboarded_at?: string | null; current_modality?: string }
  if (!profile.onboarded_at) redirect('/onboarding')

  const modality = (profile.current_modality ?? 'bjj') as 'bjj'

  // ── Parallel: dados básicos + RPCs do PRD §3 ──
  const [
    { data: attendance },
    { data: completions },
    { data: achievements },
    { data: sessionsRaw },
    { data: xpRaw },
    { data: radarRaw },
    { data: prsRaw },
  ] = await Promise.all([
    supabase.from('attendance').select('date').eq('user_id', user.id)
      .order('date', { ascending: false }).limit(90),
    supabase.from('technique_completions')
      .select('belt_id, module_id, technique_name').eq('user_id', user.id),
    supabase.from('achievements')
      .select('badge_id, unlocked_at').eq('user_id', user.id)
      .order('unlocked_at', { ascending: false }),
    supabase.from('training_sessions')
      .select('id, type, duration_min, trained_at')
      .eq('user_id', user.id)
      .gte('trained_at', new Date(Date.now() - 365 * 86400000).toISOString())
      .order('trained_at', { ascending: false }),
    (supabase as unknown as { rpc: (n: string, p: Record<string, string>) => Promise<{ data: XPProgress[] | null }> })
      .rpc('user_xp_progress', { p_user_id: user.id }),
    (supabase as unknown as { rpc: (n: string, p: Record<string, string | number>) => Promise<{ data: RadarPoint[] | null }> })
      .rpc('radar_scores', { p_user_id: user.id, p_modality: modality, p_window_days: 90 }),
    (supabase as unknown as { rpc: (n: string, p: Record<string, string>) => Promise<{ data: PersonalRecord[] | null }> })
      .rpc('personal_records', { p_user_id: user.id }),
  ])

  const sessions = (sessionsRaw ?? []) as { id: string; type: string; duration_min: number; trained_at: string }[]
  const xp     = (xpRaw    ?? [])[0] as XPProgress | undefined
  const radar  = (radarRaw ?? []) as RadarPoint[]
  const prs    = (prsRaw   ?? [])[0] as PersonalRecord | undefined

  return (
    <DashboardClient
      profile={profile}
      attendance={(attendance ?? []) as { date: string }[]}
      completions={(completions ?? []) as { belt_id: string; module_id: string; technique_name: string }[]}
      achievements={(achievements ?? []) as { badge_id: string; unlocked_at: string }[]}
      sessions={sessions}
      xpProgress={xp}
      radar={radar}
      personalRecords={prs}
    />
  )
}
