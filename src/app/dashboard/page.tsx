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
  const profile = profileRaw as Profile
  if (!profile.name?.trim()) redirect('/onboarding')

  const [
    { data: attendance },
    { data: completions },
    { data: achievements },
  ] = await Promise.all([
    supabase.from('attendance').select('date').eq('user_id', user.id)
      .order('date', { ascending: false }).limit(90),
    supabase.from('technique_completions')
      .select('belt_id, module_id, technique_name').eq('user_id', user.id),
    supabase.from('achievements')
      .select('badge_id, unlocked_at').eq('user_id', user.id)
      .order('unlocked_at', { ascending: false }),
  ])

  // Recalculate streak from attendance
  const sortedDates = (attendance ?? [])
    .map((a: { date: string }) => a.date).sort().reverse()
  let streak = 0
  const today = new Date().toISOString().split('T')[0]
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]
  const dateSet = new Set(sortedDates)
  if (dateSet.has(today) || dateSet.has(yesterday)) {
    const start = dateSet.has(today) ? today : yesterday
    let cur = new Date(start)
    while (dateSet.has(cur.toISOString().split('T')[0])) {
      streak++
      cur.setDate(cur.getDate() - 1)
    }
  }

  // Sync streak to profile if changed
  if (streak !== profile.streak) {
    await supabase.from('profiles').update({ streak } as never).eq('id', user.id)
    profile.streak = streak
  }

  return (
    <DashboardClient
      profile={profile}
      attendance={(attendance ?? []) as { date: string }[]}
      completions={(completions ?? []) as { belt_id: string; module_id: string; technique_name: string }[]}
      achievements={(achievements ?? []) as { badge_id: string; unlocked_at: string }[]}
    />
  )
}
