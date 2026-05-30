import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DashboardClient } from '@/components/dashboard/DashboardClient'
import type { Database } from '@/lib/supabase/types'

type Profile = Database['public']['Tables']['profiles']['Row']

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profileRaw, error: profileError } = await supabase
    .from('profiles').select('*').eq('id', user.id).single()

  if (profileError || !profileRaw) redirect('/onboarding')
  const profile = profileRaw as Profile & { onboarded_at?: string | null }
  if (!profile.onboarded_at) redirect('/onboarding')

  const [
    { data: attendance },
    { data: completions },
    { data: achievements },
    { data: sessionsRaw },
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
      .gte('trained_at', new Date(Date.now() - 90 * 86400000).toISOString())
      .order('trained_at', { ascending: false }),
  ])
  const sessions = (sessionsRaw ?? []) as { id: string; type: string; duration_min: number; trained_at: string }[]

  // Streak agora é mantido pelo trigger DB recompute_streak (PRD Etapa 2).
  // Não recalculamos no client — fonte única é o servidor.

  return (
    <DashboardClient
      profile={profile}
      attendance={(attendance ?? []) as { date: string }[]}
      completions={(completions ?? []) as { belt_id: string; module_id: string; technique_name: string }[]}
      achievements={(achievements ?? []) as { badge_id: string; unlocked_at: string }[]}
      sessions={sessions}
    />
  )
}
