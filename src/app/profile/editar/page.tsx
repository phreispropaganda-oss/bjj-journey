import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ProfileClient from '@/components/profile/ProfileClient'
import type { Database } from '@/lib/supabase/types'

type Profile = Database['public']['Tables']['profiles']['Row'] & {
  weight_kg?: number | null
  height_cm?: number | null
  active?: boolean
}

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profileRaw } = await supabase
    .from('profiles').select('*').eq('id', user.id).single()
  if (!profileRaw) redirect('/onboarding')
  const profile = profileRaw as Profile

  const [
    { data: achievements },
    { data: attendance },
    { data: adminCheck },
    { data: memberCheck },
    { data: academiesRaw },
    { data: mostTrainedRaw },
    { data: caloriesTotal },
  ] = await Promise.all([
    supabase.from('achievements').select('badge_id, unlocked_at').eq('user_id', user.id),
    supabase.from('attendance').select('date').eq('user_id', user.id),
    supabase.from('admin_users').select('user_id').eq('user_id', user.id).maybeSingle(),
    supabase.from('academy_members')
      .select('academy_id, role').eq('user_id', user.id)
      .in('role', ['admin', 'instructor']).maybeSingle(),
    supabase.from('academies').select('id, name').eq('active', true).order('name'),
    (supabase as unknown as { rpc: (n: string, p: Record<string, string>) => Promise<{ data: string | null }> })
      .rpc('most_trained_position', { p_user_id: user.id }),
    (supabase as unknown as { rpc: (n: string, p: Record<string, string>) => Promise<{ data: number | null }> })
      .rpc('total_calories', { p_user_id: user.id }),
  ])

  const isOwner        = !!adminCheck
  const isAcademyAdmin = !!(memberCheck as { academy_id: string; role: string } | null)
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://bjj-journey-iota.vercel.app'

  return (
    <ProfileClient
      profile={profile}
      achievements={(achievements ?? []) as { badge_id: string; unlocked_at: string }[]}
      attendanceCount={(attendance ?? []).length}
      appUrl={appUrl}
      isOwner={isOwner}
      isAcademyAdmin={isAcademyAdmin}
      academies={(academiesRaw ?? []) as { id: string; name: string }[]}
      mostTrainedPosition={(mostTrainedRaw as unknown as string) ?? null}
      totalCalories={(caloriesTotal as unknown as number) ?? 0}
    />
  )
}
